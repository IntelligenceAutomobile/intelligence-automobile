import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendMail, MAIL_FROM, blockedByRedList, ajoutsListeRouge, journaliseRefus } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { parisDay } from "@/lib/vehicules";
import { addDays } from "@/lib/relances";
import { formatDateFr } from "@/lib/devis";
import {
  etatAvis,
  lienAvis,
  lienStop,
  motifAffiche,
  motifRefusEnvoi,
  AVIS_REPORT_JOURS,
  type AchatRef,
  type AvisEtat,
} from "@/lib/avis";
import { reviewEmail, reviewSubject } from "@/lib/avis-email";
import { achatsParClient } from "@/lib/avis-server";
import { COMPANY } from "@/lib/company";

const FROM = MAIL_FROM;

function siteOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return req.nextUrl.origin;
}

/**
 * Jeton du client, posé dès l'aperçu : le lien montré est le lien envoyé.
 * Les fiches d'avant cette version le reçoivent à leur premier passage ici.
 */
async function assureJeton(id: string, connu: string | null): Promise<string> {
  if (connu) return connu;
  const jeton = randomBytes(18).toString("base64url");
  await prisma.client.update({ where: { id }, data: { reviewToken: jeton } });
  return jeton;
}

const ACTIONS = ["envoi", "manuel", "avis", "report", "stop", "ecart", "reprise"] as const;
type Action = (typeof ACTIONS)[number];

type ClientAvis = {
  id: string;
  name: string;
  company: string;
  email: string;
  reviewRequestedAt: string;
  reviewCount: number;
  reviewSnoozeUntil: string;
  reviewOutcome: string;
  reviewToken: string | null;
};

type Pret = {
  client: ClientAvis;
  achat: AchatRef | undefined;
  etat: AvisEtat;
  today: string;
  brandName: string;
  accent: string;
  reviewLink: string;
};

type Prepare = { erreur: string; status: number } | Pret;

/**
 * Tout ce qu'il faut pour montrer, envoyer ou classer, et les refus qui vont
 * avec. La page affichée peut dater (un second onglet, une invitation partie
 * entre-temps) : l'état se recalcule ici, comme le fait déjà la route des
 * relances.
 */
async function prepare(id: string): Promise<Prepare> {
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const [client, theme] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        reviewRequestedAt: true,
        reviewCount: true,
        reviewSnoozeUntil: true,
        reviewOutcome: true,
        reviewToken: true,
      },
    }),
    prisma.brandTheme.findUnique({ where: { id: "default" }, select: { name: true, accent: true, reviewLink: true } }),
  ]);
  if (!client) return { erreur: "Client introuvable.", status: 404 };

  const achat = (await achatsParClient([id])).get(id);
  const etat = etatAvis(
    { requestedAt: client.reviewRequestedAt, reasonDate: achat?.date ?? "", outcome: client.reviewOutcome },
    today,
  );

  return {
    client,
    achat,
    etat,
    today,
    brandName: theme?.name || "Intelligence Automobile",
    accent: theme?.accent || "#6B9FEE",
    reviewLink: theme?.reviewLink?.trim() ?? "",
  };
}

const SANS_ACHAT =
  "Ce client relève de la liste des acheteurs à partir d'une vente conclue, d'une facture réglée, d'une reprise ou d'une livraison inscrite au planning.";

/** Ce qui empêche un envoi, du plus général au plus précis. */
function refusEnvoi(p: Pret): { erreur: string; status: number } | null {
  if (!p.achat) return { erreur: SANS_ACHAT, status: 409 };

  const motif = motifRefusEnvoi(
    {
      etat: p.etat,
      requestedAt: p.client.reviewRequestedAt,
      count: p.client.reviewCount,
      snoozeUntil: p.client.reviewSnoozeUntil,
    },
    p.today,
    formatDateFr,
  );
  if (motif) return { erreur: motif, status: 409 };

  if (!p.client.email) return { erreur: "Ce client n'a pas d'adresse email.", status: 400 };
  if (!p.reviewLink) {
    return { erreur: "Configurez d'abord votre lien Google dans Réglages → Marque blanche.", status: 400 };
  }
  return null;
}

/* ── Aperçu : le corps montré est celui qui partira ── */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const p = await prepare(id);
    if ("erreur" in p) return NextResponse.json({ error: p.erreur }, { status: p.status });

    const refus = refusEnvoi(p);
    if (refus) return NextResponse.json({ error: refus.erreur }, { status: refus.status });

    // Liste rouge : l'aperçu lui-même est refusé, il n'y a rien à relire.
    if (blockedByRedList(p.client.email, process.env, await ajoutsListeRouge(true)).length > 0) {
      return NextResponse.json(
        { error: `${p.client.email} est en liste rouge : aucun message ne part vers ce destinataire.` },
        { status: 409 },
      );
    }

    const achat = p.achat as AchatRef;
    const origin = siteOrigin(_req);
    const jeton = await assureJeton(p.client.id, p.client.reviewToken);
    return NextResponse.json({
      to: p.client.email,
      subject: reviewSubject(p.brandName),
      html: reviewEmail({
        clientName: p.client.name,
        brandName: p.brandName,
        reviewLink: lienAvis(origin, jeton),
        accent: p.accent,
        vehicle: achat.vehicle,
        stopLink: lienStop(origin, jeton),
      }),
      vehicle: achat.vehicle,
      reason: motifAffiche(achat.kind, achat.reason, p.etat),
      reasonDate: achat.date,
      // Deuxième envoi : le dialogue le dit, pour que le ton se choisisse en connaissance.
      rappel: p.client.reviewCount >= 1,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la préparation de l'aperçu." }, { status: 500 });
  }
}

/* ── Envoi et classement ── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const action: Action = ACTIONS.includes(body?.action) ? body.action : "envoi";
    const message = typeof body?.message === "string" ? body.message.slice(0, 2000) : "";
    const note = typeof body?.note === "string" ? body.note.slice(0, 200).trim() : "";

    const p = await prepare(id);
    if ("erreur" in p) return NextResponse.json({ error: p.erreur }, { status: p.status });

    // Auteur du geste, pour le journal.
    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    const nom = p.client.company || p.client.name;

    async function journal(
      logAction: string,
      extra: { channel?: string; step?: number; sentDay?: string; detail?: string } = {},
    ) {
      try {
        await prisma.avisLog.create({
          data: {
            clientId: id,
            clientName: nom,
            action: logAction,
            channel: extra.channel ?? "",
            step: extra.step ?? 0,
            sentDay: extra.sentDay ?? "",
            detail: extra.detail ?? "",
            author,
          },
        });
      } catch {
        /* Le journal reste un confort : son échec laisse le geste en place. */
      }
    }

    /* ── Classement : aucun message ne part ── */
    if (action !== "envoi" && action !== "manuel") {
      const reportAu = addDays(p.today, AVIS_REPORT_JOURS);
      const suites: Record<string, { data: Record<string, string>; log: string; detail: string; message: string }> = {
        avis: {
          data: { reviewOutcome: "avis", reviewSnoozeUntil: "" },
          log: "avis",
          detail: "Avis reçu",
          message: "Avis noté. Merci de l'avoir enregistré.",
        },
        report: {
          data: { reviewSnoozeUntil: reportAu },
          log: "report",
          detail: `Reporté au ${formatDateFr(reportAu)}`,
          message: `Ligne mise de côté jusqu'au ${formatDateFr(reportAu)}.`,
        },
        stop: {
          data: { reviewOutcome: "stop", reviewOutcomeNote: note },
          log: "arret",
          detail: note || "Le client souhaite rester tranquille",
          message: "Ce client reste tranquille.",
        },
        ecart: {
          data: { reviewOutcome: "ecarte", reviewOutcomeNote: note },
          log: "ecart",
          detail: note || "Écarté de la liste",
          message: "Ligne écartée. Elle reste visible sous « Écartés et arrêts ».",
        },
        reprise: {
          data: { reviewOutcome: "", reviewOutcomeNote: "", reviewSnoozeUntil: "" },
          log: "reprise",
          detail: "Remis dans la liste",
          message: "Ce client revient dans la liste.",
        },
      };
      const suite = suites[action];
      await prisma.client.update({ where: { id }, data: suite.data });
      await journal(suite.log, { detail: suite.detail });
      return NextResponse.json({ ok: true, message: suite.message });
    }

    /* ── Sollicité sur place : la demande se note, aucun email ne part ── */
    if (action === "manuel") {
      if (!p.achat) return NextResponse.json({ error: SANS_ACHAT }, { status: 409 });
      const step = p.client.reviewCount + 1;
      await prisma.client.update({
        where: { id },
        data: {
          reviewRequestedAt: p.today,
          reviewCount: step,
          reviewOutcome: "",
          reviewOutcomeNote: "",
          reviewSnoozeUntil: "",
        },
      });
      await journal("manuel", { channel: "main", step, sentDay: p.today, detail: "Demande faite de vive voix" });
      return NextResponse.json({ ok: true, message: "Demande notée. Ce client passe en attente de réponse." });
    }

    /* ── Envoi de l'invitation ou de son rappel ── */
    const refus = refusEnvoi(p);
    if (refus) return NextResponse.json({ error: refus.erreur }, { status: refus.status });

    const achat = p.achat as AchatRef;
    const step = p.client.reviewCount + 1;
    const origin = siteOrigin(req);
    const jeton = await assureJeton(p.client.id, p.client.reviewToken);
    const html = reviewEmail({
      clientName: p.client.name,
      brandName: p.brandName,
      reviewLink: lienAvis(origin, jeton),
      accent: p.accent,
      vehicle: achat.vehicle,
      message,
      stopLink: lienStop(origin, jeton),
    });

    // Liste rouge : la demande n'est ni envoyée ni marquée comme faite.
    if (blockedByRedList(p.client.email, process.env, await ajoutsListeRouge(true)).length > 0) {
      const motif = `liste rouge : aucun message ne part vers ${p.client.email}`;
      await journaliseRefus({ to: p.client.email, subject: "Votre avis", reason: motif, origin: "demande-avis" });
      return NextResponse.json(
        { error: `${p.client.email} est en liste rouge : aucun message ne part vers ce destinataire.` },
        { status: 409 },
      );
    }

    const envoi = await sendMail({
      from: FROM,
      to: p.client.email,
      replyTo: COMPANY.email || undefined,
      subject: reviewSubject(p.brandName),
      html,
      origin: "demande-avis",
    });
    // Rien n'est parti : la demande reste à faire. La marquer « envoyée »
    // retirait le client de la liste sans qu'il ait rien reçu. Un message
    // simplement retenu revient sans « error », d'où le test sur l'envoi lui-même.
    if (envoi.sent === false) {
      return NextResponse.json(
        { error: envoi.blocked ? `L'email n'est pas parti : ${envoi.reason}` : "L'email n'est pas parti : la demande d'avis reste à faire." },
        { status: envoi.blocked ? 409 : 502 },
      );
    }

    await journal(step > 1 ? "rappel" : "invitation", {
      channel: "email",
      step,
      sentDay: p.today,
      detail: message ? "Message personnel joint" : "",
    });

    // L'email est parti : l'enregistrement qui échoue derrière reste un incident
    // mineur, pas un échec d'envoi. Annoncer « Erreur » ici poussait à recliquer,
    // et le client recevait deux fois le même mot.
    try {
      await prisma.client.update({
        where: { id },
        data: {
          reviewRequestedAt: p.today,
          reviewCount: step,
          reviewOutcome: "",
          reviewOutcomeNote: "",
          reviewSnoozeUntil: "",
        },
      });
    } catch {
      return NextResponse.json({
        ok: true,
        sent: true,
        warning: "Invitation envoyée. L'enregistrement a échoué : ce client peut réapparaître dans la liste à solliciter.",
      });
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      message: step > 1 ? "Rappel envoyé par email." : "Invitation envoyée par email.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
