import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { reserveVehicleForQuote, syncLeadForQuote } from "@/lib/devis-effets";
import { COMPANY } from "@/lib/company";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

// Acceptation d'un devis par le client, depuis la page publique.
// Route ouverte par nature : le jeton du lien tient lieu d'identification.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const row = await prisma.quote.findUnique({ where: { publicToken: token } });
    if (!row || row.docType === "facture") {
      return NextResponse.json({ error: "Ce devis est introuvable." }, { status: 404 });
    }
    if (row.status === "accepte") {
      return NextResponse.json({ ok: true, already: true });
    }

    const body = await req.json().catch(() => ({}));
    const signerName = String(body.signerName ?? "").trim().slice(0, 120);
    if (signerName.length < 2) {
      return NextResponse.json({ error: "Indiquez le nom du signataire." }, { status: 400 });
    }

    // Adresse d'origine : trace de l'accord, comme la date et le nom.
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "";

    const updated = await prisma.quote.update({
      where: { id: row.id },
      data: {
        status: "accepte",
        signerName,
        signedAt: new Date().toISOString(),
        signedIp: ip,
        relanceSnoozeUntil: "",
      },
    });

    await reserveVehicleForQuote(updated);
    await syncLeadForQuote(updated, signerName);

    // Le vendeur est prévenu tout de suite : c'est l'information qui déclenche
    // la suite du dossier.
    let branding: { emitterName?: string; emitterEmail?: string } = {};
    try {
      branding = JSON.parse(row.branding ?? "{}");
    } catch {
      /* repli */
    }
    const notify = branding.emitterEmail || COMPANY.email;
    if (process.env.RESEND_API_KEY && notify) {
      const client = row.clientCompany || row.clientName || signerName;
      await resend.emails
        .send({
          from: FROM,
          to: notify,
          subject: `Devis ${row.number} accepté par ${client}`,
          html: `<p>Le devis <strong>${row.number}</strong> vient d'être accepté en ligne par <strong>${signerName}</strong> (${client}).</p>`,
        })
        .catch(() => {
          /* l'accord du client prime sur la notification */
        });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }
}
