import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { COMPANY } from "@/lib/company";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

function reviewEmail(opts: { clientName: string; brandName: string; reviewLink: string; accent: string }) {
  const { clientName, brandName, reviewLink, accent } = opts;
  const hi = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#C8D8EE;">
    <div style="border-top:2px solid ${accent};padding-top:20px;margin-bottom:24px;">
      <p style="color:${accent};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Votre avis compte</p>
      <h1 style="color:#F0F5FF;font-size:20px;margin:0;">Merci de votre confiance</h1>
    </div>
    <p>${hi}</p>
    <p>Nous espérons que votre nouveau véhicule vous donne entière satisfaction. Votre retour nous aide énormément et guide les futurs acheteurs.</p>
    <p>Si vous avez un instant, laisser un avis Google ne prend qu'une minute :</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${reviewLink}" style="display:inline-block;background:${accent};color:#070F1E;font-weight:600;text-decoration:none;padding:12px 24px;font-size:14px;">
        ⭐ Laisser un avis
      </a>
    </p>
    <p style="color:#7C92B5;font-size:12px;">Merci infiniment,<br>L'équipe ${brandName}</p>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1B3055;color:#7C92B5;font-size:12px;">
      ${COMPANY.email} · ${COMPANY.phone}
    </div>
  </div>
</body></html>`;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const [client, theme] = await Promise.all([
      prisma.client.findUnique({ where: { id } }),
      prisma.brandTheme.findUnique({ where: { id: "default" } }),
    ]);
    if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    if (!client.email) return NextResponse.json({ error: "Ce client n'a pas d'adresse email." }, { status: 400 });

    const reviewLink = theme?.reviewLink?.trim();
    if (!reviewLink) {
      return NextResponse.json({ error: "Configurez d'abord votre lien Google dans Réglages → Marque blanche." }, { status: 400 });
    }

    const html = reviewEmail({
      clientName: client.name,
      brandName: theme?.name || "Intelligence Automobile",
      reviewLink,
      accent: theme?.accent || "#6B9FEE",
    });

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({ from: FROM, to: client.email, replyTo: COMPANY.email, subject: `Votre avis sur ${theme?.name || "notre équipe"}`, html });
    } else {
      console.log(`[Avis ${client.name}] → ${client.email} (RESEND_API_KEY absent, non envoyé)`);
    }

    await prisma.client.update({ where: { id }, data: { reviewRequestedAt: new Date().toISOString().slice(0, 10) } });
    return NextResponse.json({ ok: true, sent: !!process.env.RESEND_API_KEY });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
