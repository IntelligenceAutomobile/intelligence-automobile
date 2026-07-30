import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sendMail, MAIL_FROM, refusEnvoi, blockedByRedList, ajoutsListeRouge, journaliseRefus } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { computeTotals, formatEuro, formatDateFr, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { addDays, daysSince, parisDayOf, relanceDue, DEVIS_RELANCE_DAYS, FACTURE_RELANCE_DAYS, SNOOZE_DAYS } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { escapeHtml } from "@/lib/html";
import { COMPANY } from "@/lib/company";

const FROM = MAIL_FROM;

// Adresse publique du site, pour composer le lien envoyé au client.
function siteOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return req.nextUrl.origin;
}

type QuoteRow = {
  docType: string;
  factureKind: string;
  number: string;
  clientName: string;
  clientCompany: string;
  issueDate: string;
  sentAt: string;
  relanceCount: number;
  items: string;
  tvaMode: string;
  tvaRate: number;
  depositMode: string;
  depositValue: number;
};

function amountDueOf(row: QuoteRow): number {
  let items: QuoteItem[] = [];
  try {
    const p = JSON.parse(row.items);
    if (Array.isArray(p)) items = p;
  } catch {
    /* ignore */
  }
  const totals = computeTotals({
    items,
    tvaMode: row.tvaMode as TvaMode,
    tvaRate: row.tvaRate,
    depositMode: row.depositMode as DepositMode,
    depositValue: row.depositValue,
  });
  return row.docType === "facture" && row.factureKind === "solde" ? totals.balance : totals.totalTTC;
}

// Palier de ton d'une facture : courtois, ferme, dernier rappel amiable.
function palierOf(row: QuoteRow): 0 | 1 | 2 {
  if (row.docType !== "facture") return 0;
  return Math.min(row.relanceCount, 2) as 0 | 1 | 2;
}

const PALIER_LABEL = ["Rappel courtois", "Deuxième rappel", "Dernier rappel amiable"] as const;

// Compose l'email de relance : même fonction pour l'aperçu et l'envoi réel,
// ce que voit l'utilisateur est exactement ce que reçoit le client.
function buildRelanceEmail(row: QuoteRow, opts: { link?: string; message?: string; expired?: boolean }): { subject: string; html: string; palier: 0 | 1 | 2 } {
  const isFacture = row.docType === "facture";
  const palier = palierOf(row);
  const number = escapeHtml(row.number);
  const clientName = escapeHtml(row.clientName || row.clientCompany);
  const amount = escapeHtml(formatEuro(amountDueOf(row)));
  // Pour un devis, la date qui parle au client est celle de l'envoi réel (jour de Paris).
  const dateRef = formatDateFr((row.sentAt ? parisDayOf(row.sentAt) : "") || row.issueDate);

  const hi = clientName ? `Bonjour ${clientName},` : "Bonjour,";

  let headLabel: string;
  let intro: string;
  let cta: string;
  if (isFacture) {
    const dateEmise = formatDateFr(row.issueDate);
    if (palier === 0) {
      headLabel = "Rappel de règlement";
      intro = `Sauf erreur de notre part, la facture <strong>${number}</strong> (${amount}) émise le ${dateEmise} demeure en attente de règlement.`;
      cta = "Nous vous remercions de bien vouloir procéder au règlement, ou de nous indiquer la date prévue.";
    } else if (palier === 1) {
      headLabel = "Deuxième rappel";
      intro = `Malgré notre précédent rappel, la facture <strong>${number}</strong> (${amount}) émise le ${dateEmise} demeure en attente de règlement, échéance dépassée.`;
      cta = "Nous vous remercions de procéder au règlement sous 8 jours. Conformément à la réglementation, des pénalités de retard s'appliquent aux sommes échues.";
    } else {
      headLabel = "Dernier rappel amiable";
      intro = `La facture <strong>${number}</strong> (${amount}) émise le ${dateEmise} attend toujours son règlement, malgré nos précédents rappels.`;
      cta = "Ce message constitue notre dernier rappel amiable : le règlement sous 8 jours clôturera ce dossier ; passé ce délai, nous engagerons une procédure de recouvrement. Nous restons disponibles pour trouver une solution ensemble.";
    }
  } else if (opts.expired) {
    // La page publique refuse l'acceptation d'un devis expiré : l'email propose
    // une version à jour au lieu de promettre « accepter en un clic ».
    headLabel = "Relance";
    intro = `Nous revenons vers vous au sujet du devis <strong>${number}</strong> (${amount}) transmis le ${dateRef} : sa période de validité est arrivée à son terme.`;
    cta = "Répondez simplement à ce message pour recevoir une version mise à jour ; nous restons à votre disposition pour toute question.";
  } else {
    headLabel = "Relance";
    intro = `Nous revenons vers vous au sujet du devis <strong>${number}</strong> (${amount}) transmis le ${dateRef} : il attend simplement votre retour.`;
    cta = opts.link
      ? "Vous pouvez le consulter et l'accepter en ligne en un clic. Nous restons à votre disposition pour toute question et serions ravis de finaliser avec vous."
      : "Nous restons à votre disposition pour toute question et serions ravis de finaliser avec vous.";
  }

  // Message personnel de l'utilisateur, inséré tel quel (échappé) après l'intro.
  // Le conteneur marqué data-perso sert à l'aperçu : le dialogue y reflète la
  // saisie en direct, ce qui s'affiche est ce qui part.
  const perso = (opts.message ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("");

  const bouton = !isFacture && opts.link
    ? `<p style="margin:24px 0;">
        <a href="${opts.link}" style="display:inline-block;background:#6B9FEE;color:#070F1E;font-weight:600;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;text-decoration:none;">
          Voir le devis
        </a>
      </p>`
    : "";

  const factureNote = isFacture
    ? `<p style="color:#7C92B5;font-size:12px;">Les modalités de règlement figurent sur la facture. Pour toute question : ${escapeHtml(COMPANY.phone)}.</p>`
    : "";
  const relanceNote = !isFacture && row.relanceCount > 0
    ? `<p style="color:#7C92B5;font-size:12px;">Ce message fait suite à une précédente relance.</p>`
    : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#C8D8EE;">
    <div style="border-top:2px solid #6B9FEE;padding-top:20px;margin-bottom:24px;">
      <p style="color:#6B9FEE;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">${headLabel}</p>
      <h1 style="color:#F0F5FF;font-size:20px;margin:0;">${isFacture ? "Facture" : "Devis"} ${number}</h1>
    </div>
    <p>${hi}</p>
    <p>${intro}</p>
    <div data-perso>${perso}</div>
    <p>${cta}</p>
    ${bouton}
    ${factureNote}
    ${relanceNote}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1B3055;color:#7C92B5;font-size:12px;line-height:1.6;">
      ${COMPANY.legalName}<br>${[COMPANY.email, COMPANY.phone].filter(Boolean).join(" · ")}
    </div>
  </div>
</body></html>`;

  const subject = isFacture
    ? palier === 0
      ? `Rappel — facture ${row.number}`
      : palier === 1
        ? `Deuxième rappel — facture ${row.number}`
        : `Dernier rappel amiable — facture ${row.number}`
    : `Votre devis ${row.number} — ${COMPANY.brandName}`;

  return { subject, html, palier };
}

// Message précis quand le document affiché à l'écran a changé entre-temps, ou
// que sa relance a une raison d'attendre : le motif exact évite de faire croire
// à une relance déjà partie quand l'utilisateur a lui-même posé un report.
function motifRefus(
  row: { docType: string; status: string; paymentStatus: string; lastRelanceDate: string; relanceSnoozeUntil: string },
  today: string,
): string {
  const isFacture = row.docType === "facture";
  if (isFacture && row.paymentStatus !== "impayee") return "Cette facture est réglée : relance annulée.";
  if (!isFacture && row.status === "accepte") return "Ce devis vient d'être accepté : relance annulée.";
  if (!isFacture && row.status !== "envoye") return "Ce devis a changé de statut : relance annulée.";
  if (row.relanceSnoozeUntil === "9999-12-31") return "Les relances de ce document sont arrêtées.";
  if (row.relanceSnoozeUntil && daysSince(row.relanceSnoozeUntil, today) < 0) {
    return `Relances en pause jusqu'au ${formatDateFr(row.relanceSnoozeUntil)}.`;
  }
  const interval = isFacture ? FACTURE_RELANCE_DAYS : DEVIS_RELANCE_DAYS;
  if (row.lastRelanceDate && daysSince(row.lastRelanceDate, today) < interval) {
    return isFacture ? "Cette facture a déjà été relancée récemment." : "Ce devis a déjà été relancé récemment.";
  }
  return isFacture ? "L'échéance de cette facture est à venir." : "Ce devis a été envoyé il y a moins d'une semaine.";
}

function dueOf(row: { docType: string; status: string; paymentStatus: string; issueDate: string; sentAt: string; validityDays: number; lastRelanceDate: string; relanceSnoozeUntil: string }, today: string) {
  return relanceDue(
    {
      docType: row.docType,
      status: row.status,
      paymentStatus: row.paymentStatus,
      issueDate: row.issueDate,
      sentAt: row.sentAt,
      validityDays: row.validityDays,
      lastRelanceDate: row.lastRelanceDate,
      relanceSnoozeUntil: row.relanceSnoozeUntil,
    },
    today,
  );
}

// Aperçu de la relance : destinataire, objet, corps exact, palier de ton.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const today = parisDay(new Date()).toISOString().slice(0, 10);
    const row = await prisma.quote.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

    if (!dueOf(row, today)) return NextResponse.json({ error: motifRefus(row, today) }, { status: 409 });
    if (!row.clientEmail) return NextResponse.json({ error: "Ce client n'a pas d'adresse email." }, { status: 400 });

    // Liste rouge : l'aperçu lui-même est refusé, il n'y a rien à relire.
    if (blockedByRedList(row.clientEmail, process.env, await ajoutsListeRouge(true)).length > 0) {
      return NextResponse.json(
        { error: `${row.clientEmail} est en liste rouge : aucun message ne part vers ce destinataire.` },
        { status: 409 },
      );
    }

    // Le jeton public du devis est posé dès l'aperçu : le lien montré est le lien envoyé.
    let publicToken = row.publicToken;
    if (row.docType !== "facture" && !publicToken) {
      publicToken = randomBytes(24).toString("base64url");
      await prisma.quote.update({ where: { id }, data: { publicToken } });
    }
    const link = row.docType !== "facture" && publicToken ? `${siteOrigin(req)}/devis/${publicToken}` : "";

    const expired = row.docType !== "facture" && row.validityDays > 0 && daysSince(row.issueDate, today) > row.validityDays;
    const { subject, html, palier } = buildRelanceEmail(row, { link, expired });

    return NextResponse.json({
      to: row.clientEmail,
      subject,
      html,
      palier,
      palierLabel: row.docType === "facture" ? PALIER_LABEL[palier] : "",
      expired,
      phone: row.clientPhone,
      relanceCount: row.relanceCount,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la préparation de l'aperçu." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const action = ["snooze", "mute", "unsnooze", "manual", "relance"].includes(body.action) ? body.action : "relance";
    // Jour civil de Paris, comme partout ailleurs : le runtime tourne en UTC.
    const today = parisDay(new Date()).toISOString().slice(0, 10);

    const row = await prisma.quote.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

    // Auteur de l'action, pour le journal.
    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    // Chaque action laisse une trace : « est-ce que la relance est partie ? »
    // se lisait nulle part.
    async function journal(logAction: string, detail: string) {
      try {
        await prisma.relanceLog.create({
          data: {
            quoteId: id,
            number: row!.number,
            client: row!.clientCompany || row!.clientName || "",
            action: logAction,
            detail,
            author,
          },
        });
      } catch {
        /* le journal ne doit jamais faire échouer l'action elle-même */
      }
    }

    if (action === "snooze") {
      const days = body.days === 30 ? 30 : SNOOZE_DAYS;
      const until = addDays(today, days);
      await prisma.quote.update({ where: { id }, data: { relanceSnoozeUntil: until } });
      await journal("report", `Reporté au ${formatDateFr(until)}`);
      return NextResponse.json({ ok: true, snoozed: true, until });
    }

    if (action === "mute") {
      // Relances arrêtées pour ce document ; un renvoi du devis ou une
      // annulation les réactivent.
      await prisma.quote.update({ where: { id }, data: { relanceSnoozeUntil: "9999-12-31" } });
      await journal("arret", "Relances arrêtées pour ce document");
      return NextResponse.json({ ok: true, muted: true });
    }

    if (action === "unsnooze") {
      await prisma.quote.update({ where: { id }, data: { relanceSnoozeUntil: "" } });
      await journal("annulation", "Report annulé, document de retour dans la liste");
      return NextResponse.json({ ok: true });
    }

    if (action === "manual") {
      // Relance faite hors email (téléphone, comptoir) : elle compte comme les
      // autres, la ligne se met en sommeil pour le délai standard.
      await prisma.quote.update({
        where: { id },
        data: { relanceCount: { increment: 1 }, lastRelanceDate: today, relanceSnoozeUntil: "" },
      });
      await journal("telephone", "Relance notée : contact par téléphone");
      return NextResponse.json({ ok: true, manual: true });
    }

    // Relance par email. La page affichée peut dater : on revérifie l'éligibilité
    // au moment du clic (devis accepté en ligne, facture encaissée, relance déjà
    // partie d'un autre onglet…) plutôt que d'envoyer un email malvenu.
    if (!dueOf(row, today)) return NextResponse.json({ error: motifRefus(row, today) }, { status: 409 });
    if (!row.clientEmail) return NextResponse.json({ error: "Ce client n'a pas d'adresse email." }, { status: 400 });

    // Destinataire en liste rouge, ou service d'envoi absent : la relance est
    // annulée. Enregistrer une relance jamais partie masquait le document une à
    // deux semaines pour rien.
    const refus = await refusEnvoi(row.clientEmail);
    if (refus) {
      const rouge = blockedByRedList(row.clientEmail, process.env, await ajoutsListeRouge(true)).length > 0;
      await journal("bloque", `Envoi annulé : ${refus}`);
      await journaliseRefus({ to: row.clientEmail, subject: `Relance ${row.number}`, reason: refus, origin: "relance" });
      return NextResponse.json(
        {
          error: rouge
            ? `${row.clientEmail} est en liste rouge : aucun message ne part vers ce destinataire.`
            : "L'envoi d'emails est indisponible sur ce serveur : relance annulée.",
        },
        { status: rouge ? 409 : 503 },
      );
    }

    // Le jeton reste stable d'un envoi à l'autre : un lien déjà transmis continue de fonctionner.
    let publicToken = row.publicToken;
    if (row.docType !== "facture" && !publicToken) {
      publicToken = randomBytes(24).toString("base64url");
      await prisma.quote.update({ where: { id }, data: { publicToken } });
    }
    const link = row.docType !== "facture" && publicToken ? `${siteOrigin(req)}/devis/${publicToken}` : "";

    const message = String(body.message ?? "").slice(0, 2000);
    const expired = row.docType !== "facture" && row.validityDays > 0 && daysSince(row.issueDate, today) > row.validityDays;
    const { subject, html } = buildRelanceEmail(row, { link, message, expired });

    // Le service signale ses échecs dans la réponse, jamais en exception : sans
    // ce contrôle, une clé révoquée enregistrait des relances fantômes en série.
    const envoi = await sendMail({ from: FROM, to: row.clientEmail, replyTo: COMPANY.email, subject, html, origin: "relance" });
    if (envoi.sent === false) {
      await journal("echec", `Envoi refusé par le service d'email : ${envoi.error ?? envoi.reason ?? "raison inconnue"}`);
      return NextResponse.json({ error: "L'email n'est pas parti : la relance reste à faire. Réessayez dans un instant." }, { status: 502 });
    }

    await journal("email", `Email envoyé à ${row.clientEmail}${envoi.id ? ` (réf. ${envoi.id})` : ""}`);

    try {
      await prisma.quote.update({
        where: { id },
        data: { relanceCount: { increment: 1 }, lastRelanceDate: today, relanceSnoozeUntil: "" },
      });
    } catch {
      // L'email est parti : répondre en succès avec avertissement, une erreur
      // inviterait à recliquer et doublerait la relance chez le client.
      return NextResponse.json({ ok: true, sent: true, warning: "Relance envoyée, mais l'enregistrement a échoué : le document peut réapparaître dans la liste." });
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la relance." }, { status: 500 });
  }
}
