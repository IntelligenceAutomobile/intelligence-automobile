import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { computeTotals, formatEuro, formatDateFr, validUntilFr, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { escapeHtml } from "@/lib/html";
import { syncLeadForQuote } from "@/lib/devis-effets";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

// Adresse publique du site, pour composer le lien envoyé au client.
function siteOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return req.nextUrl.origin;
}

function envoiEmail(opts: {
  emitter: string;
  number: string;
  clientName: string;
  amount: string;
  validUntil: string;
  link: string;
  message: string;
  accent: string;
}) {
  const { validUntil, link, accent } = opts;
  const emitter = escapeHtml(opts.emitter);
  const number = escapeHtml(opts.number);
  const clientName = escapeHtml(opts.clientName);
  const amount = escapeHtml(opts.amount);
  const hi = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const corps = opts.message
    ? opts.message.split("\n").map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join("")
    : `<p style="margin:0 0 12px;">Vous trouverez ci-dessous votre devis <strong>${number}</strong> d'un montant de <strong>${amount}</strong>.</p>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#C8D8EE;">
    <div style="border-top:2px solid ${accent};padding-top:20px;margin-bottom:24px;">
      <p style="color:${accent};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Votre devis</p>
      <h1 style="color:#F0F5FF;font-size:20px;margin:0;">${number}</h1>
    </div>
    <p>${hi}</p>
    ${corps}
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;background:${accent};color:#070F1E;font-weight:600;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;padding:14px 26px;text-decoration:none;">
        Voir mon devis
      </a>
    </p>
    <p style="color:#7C92B5;font-size:13px;">Ce devis est valable jusqu'au ${validUntil}. Vous pouvez l'accepter directement depuis la page.</p>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1B3055;color:#7C92B5;font-size:12px;line-height:1.6;">
      ${emitter}
    </div>
  </div>
</body></html>`;
}

// Envoie le devis au client : lien de consultation, statut « envoyé », date d'envoi.
// Le parcours s'arrêtait à l'imprimante ; c'est la première diapositive de tous
// les outils concurrents.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const row = await prisma.quote.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    if (row.docType === "facture") return NextResponse.json({ error: "L'envoi concerne les devis." }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const to = String(body.to ?? row.clientEmail ?? "").trim();
    if (!to) return NextResponse.json({ error: "Renseignez l'adresse email du client." }, { status: 400 });

    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(row.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* un devis abîmé s'envoie quand même, avec un total à zéro */
    }
    const totals = computeTotals({
      items,
      tvaMode: row.tvaMode as TvaMode,
      tvaRate: row.tvaRate,
      depositMode: row.depositMode as DepositMode,
      depositValue: row.depositValue,
    });

    let branding: { emitterName?: string; accentColor?: string } = {};
    try {
      branding = JSON.parse(row.branding ?? "{}");
    } catch {
      /* repli sur les valeurs par défaut */
    }

    // Le jeton reste stable d'un envoi à l'autre : un lien déjà transmis continue de fonctionner.
    const publicToken = row.publicToken ?? randomBytes(24).toString("base64url");
    const link = `${siteOrigin(req)}/devis/${publicToken}`;
    const subject = String(body.subject ?? "").trim() || `Votre devis ${row.number}`;

    const html = envoiEmail({
      emitter: branding.emitterName ?? "",
      number: row.number,
      clientName: row.clientName || row.clientCompany,
      amount: formatEuro(totals.totalTTC),
      validUntil: validUntilFr(row.issueDate, row.validityDays) || formatDateFr(row.issueDate),
      link,
      message: String(body.message ?? ""),
      accent: branding.accentColor ?? "#6B9FEE",
    });

    const sent = !!process.env.RESEND_API_KEY;
    if (sent) {
      // Resend signale ses échecs dans la réponse, jamais en exception : sans ce
      // contrôle, un envoi raté passait pour réussi (statut, date, lien… posés).
      const { error: sendError } = await resend.emails.send({ from: FROM, to, subject, html });
      if (sendError) {
        return NextResponse.json({ error: "L'email n'est pas parti : le devis reste à envoyer. Réessayez dans un instant." }, { status: 502 });
      }
    } else {
      console.log(`[Envoi devis ${row.number}] → ${to} (RESEND_API_KEY absent, non envoyé)\n${link}`);
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        publicToken,
        sentAt: new Date().toISOString(),
        status: row.status === "brouillon" ? "envoye" : row.status,
        // Le compteur de relances repart : l'envoi est le nouveau point de départ.
        relanceCount: 0,
        lastRelanceDate: "",
        relanceSnoozeUntil: "",
      },
    });

    const collab = await getCollabSession();
    await syncLeadForQuote(updated, collab?.name ?? session.admin.email ?? "");

    return NextResponse.json({ ok: true, sent, link, number: updated.number });
  } catch {
    return NextResponse.json({ error: "L'envoi a échoué." }, { status: 500 });
  }
}
