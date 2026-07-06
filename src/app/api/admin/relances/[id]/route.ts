import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { computeTotals, formatEuro, formatDateFr, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { addDays, SNOOZE_DAYS } from "@/lib/relances";
import { COMPANY } from "@/lib/company";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

function relanceEmail(opts: { isFacture: boolean; number: string; clientName: string; amount: string; issueDate: string; relanceCount: number }) {
  const { isFacture, number, clientName, amount, issueDate, relanceCount } = opts;
  const hi = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const intro = isFacture
    ? `Sauf erreur de notre part, la facture <strong>${number}</strong> (${amount}) émise le ${formatDateFr(issueDate)} demeure en attente de règlement.`
    : `Nous revenons vers vous concernant le devis <strong>${number}</strong> (${amount}) du ${formatDateFr(issueDate)}, resté sans réponse à ce jour.`;
  const cta = isFacture
    ? "Nous vous remercions de bien vouloir procéder au règlement, ou de nous indiquer la date prévue."
    : "Nous restons à votre disposition pour toute question et serions ravis de finaliser avec vous.";
  const relanceNote = relanceCount > 0 ? `<p style="color:#7C92B5;font-size:12px;">Ce message fait suite à une précédente relance.</p>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#C8D8EE;">
    <div style="border-top:2px solid #6B9FEE;padding-top:20px;margin-bottom:24px;">
      <p style="color:#6B9FEE;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">${isFacture ? "Rappel de règlement" : "Relance"}</p>
      <h1 style="color:#F0F5FF;font-size:20px;margin:0;">${isFacture ? "Facture" : "Devis"} ${number}</h1>
    </div>
    <p>${hi}</p>
    <p>${intro}</p>
    <p>${cta}</p>
    ${relanceNote}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1B3055;color:#7C92B5;font-size:12px;line-height:1.6;">
      ${COMPANY.legalName}<br>${COMPANY.email} · ${COMPANY.phone}
    </div>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action === "snooze" ? "snooze" : "relance";
    const today = new Date().toISOString().slice(0, 10);

    const row = await prisma.quote.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

    if (action === "snooze") {
      await prisma.quote.update({ where: { id }, data: { relanceSnoozeUntil: addDays(today, SNOOZE_DAYS) } });
      return NextResponse.json({ ok: true, snoozed: true });
    }

    // Relance par email.
    if (!row.clientEmail) return NextResponse.json({ error: "Ce client n'a pas d'adresse email." }, { status: 400 });

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
    const isFacture = row.docType === "facture";
    const due = isFacture && row.factureKind === "solde" ? totals.balance : totals.totalTTC;

    const html = relanceEmail({
      isFacture,
      number: row.number,
      clientName: row.clientName || row.clientCompany,
      amount: formatEuro(due),
      issueDate: row.issueDate,
      relanceCount: row.relanceCount,
    });
    const subject = isFacture ? `Rappel — facture ${row.number}` : `Votre devis ${row.number} — Intelligence Automobile`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({ from: FROM, to: row.clientEmail, replyTo: COMPANY.email, subject, html });
    } else {
      console.log(`[Relance ${row.number}] → ${row.clientEmail} (RESEND_API_KEY absent, non envoyé)`);
    }

    await prisma.quote.update({
      where: { id },
      data: { relanceCount: { increment: 1 }, lastRelanceDate: today, relanceSnoozeUntil: "" },
    });

    return NextResponse.json({ ok: true, sent: !!process.env.RESEND_API_KEY });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la relance." }, { status: 500 });
  }
}
