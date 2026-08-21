import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sendMail, MAIL_FROM, blockedByRedList, ajoutsListeRouge, journaliseRefus } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { formatEuroCents } from "@/lib/comptes";
import { escapeHtml } from "@/lib/html";
import { COMPANY } from "@/lib/company";
import { MANDAT_TYPE_DE, isMandatType, mandatVehiculeLabel, type MandatType } from "@/lib/mandats";

const FROM = MAIL_FROM;
const ACCENT = "#6B9FEE";

// Adresse publique du site, pour composer le lien envoyé au vendeur.
function siteOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return req.nextUrl.origin;
}

function envoiEmail(opts: {
  type: MandatType;
  reference: string;
  ownerName: string;
  vehicule: string;
  prix: string;
  link: string;
  message: string;
}) {
  const typeDe = MANDAT_TYPE_DE[opts.type];
  const reference = escapeHtml(opts.reference);
  const ownerName = escapeHtml(opts.ownerName);
  const vehicule = escapeHtml(opts.vehicule);
  const prix = escapeHtml(opts.prix);
  const objetPhrase =
    opts.type === "vente"
      ? `pour <strong>${vehicule}</strong>${prix ? `, présenté à ${prix}` : ""}`
      : opts.type === "import"
        ? `pour l'acquisition de <strong>${vehicule}</strong> dans l'Union européenne`
        : `pour la recherche de <strong>${vehicule}</strong>`;
  const corps = opts.message
    ? opts.message.split("\n").map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join("")
    : `<p style="margin:0 0 12px;">Voici votre mandat ${typeDe} <strong>${reference}</strong> ${objetPhrase}. Le contrat se lit en entier sur la page, la signature se fait en bas de la dernière feuille.</p>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#C8D8EE;">
    <div style="border-top:2px solid ${ACCENT};padding-top:20px;margin-bottom:24px;">
      <p style="color:${ACCENT};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Votre mandat ${typeDe}</p>
      <h1 style="color:#F0F5FF;font-size:20px;margin:0;">${reference}</h1>
    </div>
    <p>${ownerName ? `Bonjour ${ownerName},` : "Bonjour,"}</p>
    ${corps}
    <p style="margin:24px 0;">
      <a href="${opts.link}" style="display:inline-block;background:${ACCENT};color:#070F1E;font-weight:600;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;text-decoration:none;">
        Lire et signer mon mandat
      </a>
    </p>
    <p style="color:#7C92B5;font-size:13px;">La signature se fait depuis votre téléphone ou votre ordinateur, en deux minutes. Après signature, vous disposez d'un délai de rétractation de quatorze jours, le bordereau figure au bas du contrat.</p>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1B3055;color:#7C92B5;font-size:12px;line-height:1.6;">
      ${escapeHtml(COMPANY.brandName)}
    </div>
  </div>
</body></html>`;
}

// Envoie le mandat au vendeur : lien public de lecture et de signature, date
// d'envoi posée, mode de signature « à distance » puisque le contrat part de
// loin. Même parcours que l'envoi d'un devis.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const row = await prisma.mandat.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });
    if (row.signedAt !== "" || row.status !== "brouillon") {
      return NextResponse.json({ error: "Ce mandat est déjà signé ou clôturé." }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const to = String(body.to ?? row.ownerEmail ?? "").trim();
    if (!to) return NextResponse.json({ error: "Renseignez l'adresse email du vendeur." }, { status: 400 });

    // Un contrat incomplet part chez personne : ce qui s'imprime en blanc sur
    // un brouillon devient un engagement une fois signé. Chaque type a ses
    // essentiels : la vente engage un prix plancher, la recherche un budget et
    // des honoraires, l'import la même chose avec l'annonce ou la cible.
    const type: MandatType = isMandatType(row.type) ? row.type : "vente";
    const manques: string[] = [];
    if (!row.ownerName.trim()) manques.push(type === "vente" ? "le nom du vendeur" : "le nom du client");
    if (!row.ownerAddress.trim()) manques.push("son adresse");
    if (type === "vente") {
      if (!row.make.trim() || !row.model.trim()) manques.push("le véhicule");
      if (!row.plate.trim()) manques.push("l'immatriculation");
      if (row.priceCents <= 0) manques.push("le prix affiché");
      if (row.floorCents <= 0) manques.push("le prix plancher");
    } else {
      if (!row.make.trim() && !row.searchSpec.trim() && !row.listingUrl.trim()) {
        manques.push(type === "import" ? "l'annonce repérée ou la cible" : "la marque recherchée ou le cahier des charges");
      }
      if (row.budgetCents <= 0) manques.push("le budget d'achat");
      if (row.feeCents <= 0) manques.push("les honoraires convenus");
    }
    if (manques.length > 0) {
      return NextResponse.json(
        { error: `Ce mandat attend encore ${manques.join(", ")} avant de partir.` },
        { status: 400 },
      );
    }

    // Liste rouge : le mandat ne part pas, et rien ne bouge sur la fiche.
    if (blockedByRedList(to, process.env, await ajoutsListeRouge(true)).length > 0) {
      const motif = `liste rouge : aucun message ne part vers ${to}`;
      await journaliseRefus({ to, subject: `Votre mandat ${row.reference}`, reason: motif, origin: "envoi-mandat" });
      return NextResponse.json(
        { error: `${to} est en liste rouge : aucun message ne part vers ce destinataire.` },
        { status: 409 },
      );
    }

    // Le jeton reste stable d'un envoi à l'autre : un lien déjà transmis
    // continue de fonctionner.
    const publicToken = row.publicToken ?? randomBytes(24).toString("base64url");
    const link = `${siteOrigin(req)}/mandat/${publicToken}`;
    const subject = String(body.subject ?? "").trim() || `Votre mandat ${MANDAT_TYPE_DE[type]} ${row.reference}`;

    const html = envoiEmail({
      type,
      reference: row.reference,
      ownerName: row.ownerName,
      vehicule: mandatVehiculeLabel(row),
      prix: row.priceCents > 0 ? formatEuroCents(row.priceCents) : "",
      link,
      message: String(body.message ?? ""),
    });

    // Un envoi refusé par le service passerait pour réussi : la date d'envoi ne
    // se pose que si le message est réellement parti ou retenu volontairement.
    const envoi = await sendMail({ from: FROM, to, subject, html, origin: "envoi-mandat" });
    if (envoi.error) {
      return NextResponse.json(
        { error: "L'email n'est pas parti : le mandat reste à envoyer. Réessayez dans un instant." },
        { status: 502 },
      );
    }
    if (!envoi.sent) console.log(`[Envoi mandat ${row.reference}] → ${to} retenu (${envoi.reason})\n${link}`);

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    const premierEnvoi = row.sentAt === "";

    await prisma.mandat.update({
      where: { id },
      data: {
        publicToken,
        sentAt: new Date().toISOString(),
        // Un contrat envoyé pour signature de loin est un contrat à distance :
        // l'article 14 imprimé bascule sur la bonne qualification légale.
        signMode: "distance",
        events: {
          create: [{
            type: "statut",
            content: `${premierEnvoi ? "Mandat envoyé pour signature" : "Mandat renvoyé"} à ${to}`,
            author,
          }],
        },
      },
    });

    return NextResponse.json({ ok: true, sent: envoi.sent, link });
  } catch {
    return NextResponse.json({ error: "L'envoi a échoué." }, { status: 500 });
  }
}
