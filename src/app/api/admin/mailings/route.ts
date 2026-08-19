import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { sendMail, refusEnvoi, blockedByRedList, ajoutsListeRouge } from "@/lib/mailer";
import { renderMailing, type MailingBlock, type MailingContent } from "@/lib/mailings";
import { COMPANY } from "@/lib/company";

// Envoi d'un mailing à un destinataire. Le serveur recompose le message à
// partir des blocs édités à l'écran, avec la même fonction que l'aperçu :
// ce qui a été relu est ce qui part.

const MAX_TEXTE = 4000;

function texte(v: unknown, max = MAX_TEXTE): string {
  return String(v ?? "").slice(0, max);
}

// Les blocs arrivent du navigateur : on ne garde que les formes connues,
// bornées en taille, plutôt que de faire confiance à la charge reçue.
function lireBlocs(raw: unknown): MailingBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).flatMap<MailingBlock>((b) => {
    const type = (b as { type?: unknown })?.type;
    if (type === "paragraphe") return [{ type: "paragraphe", text: texte((b as { text?: unknown }).text) }];
    if (type === "puces") {
      const items = (b as { items?: unknown }).items;
      return [{ type: "puces", items: Array.isArray(items) ? items.slice(0, 12).map((i) => texte(i, 600)) : [] }];
    }
    if (type === "bouton") {
      const url = texte((b as { url?: unknown }).url, 500).trim();
      // Seul un lien web part dans un bouton : tout autre schéma est écarté.
      if (!/^https?:\/\//i.test(url)) return [];
      return [{ type: "bouton", label: texte((b as { label?: unknown }).label, 80), url }];
    }
    return [];
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  // Même réserve que l'écran Emails : ce module écrit à de vraies personnes.
  if (!can(asRole(session.admin.role), "settings")) {
    return NextResponse.json({ error: "Votre rôle ne permet pas d'envoyer des mailings." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const to = texte(body.to, 200).trim();
    const content: MailingContent = {
      subject: texte(body.subject, 200).trim(),
      preheader: texte(body.preheader, 300),
      kicker: texte(body.kicker, 120),
      titre: texte(body.titre, 200),
      blocks: lireBlocs(body.blocks),
      signatureNote: texte(body.signatureNote, 600),
      motif: texte(body.motif, 400),
    };

    if (!to) return NextResponse.json({ error: "Indiquez l'adresse du destinataire." }, { status: 400 });
    if (!content.subject) return NextResponse.json({ error: "Le message a besoin d'un objet." }, { status: 400 });
    if (content.blocks.length === 0) {
      return NextResponse.json({ error: "Le message est vide : rechargez un modèle." }, { status: 400 });
    }

    // Liste rouge, adresse illisible ou service d'envoi absent : refus net
    // avant l'envoi, avec le motif exact.
    const refus = await refusEnvoi(to);
    if (refus) {
      const rouge = blockedByRedList(to, process.env, await ajoutsListeRouge(true)).length > 0;
      return NextResponse.json(
        {
          error: rouge
            ? `${to} est en liste rouge : aucun message ne part vers ce destinataire.`
            : `Envoi impossible : ${refus}.`,
        },
        { status: rouge ? 409 : 503 },
      );
    }

    const envoi = await sendMail({
      to,
      replyTo: COMPANY.email || undefined,
      subject: content.subject,
      html: renderMailing(content),
      origin: "mailing",
    });

    if (envoi.sent === false) {
      // Retenu (mode atelier) ou refusé par le service : le motif se lit tel quel.
      const motif = envoi.reason ?? envoi.error ?? "raison inconnue";
      return NextResponse.json(
        { error: `L'email est resté sur place : ${motif}.` },
        { status: envoi.blocked ? 409 : 502 },
      );
    }

    return NextResponse.json({ ok: true, sent: true, id: envoi.id ?? "" });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi du mailing." }, { status: 500 });
  }
}
