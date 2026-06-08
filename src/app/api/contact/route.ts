import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TO   = process.env.RESEND_TO   ?? "contact@intelligenceautomobile.com";
const FROM = process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

const SUJETS: Record<string, string> = {
  achat:  "Achat d'un véhicule",
  mandat: "Recherche personnalisée",
  vente:  "Aide à la vente",
  autre:  "Autre",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, email, telephone, sujet, message } = body;

    if (!nom || !email || !message) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const sujetLabel = SUJETS[sujet] ?? sujet ?? "Contact";

    const row = (label: string, value: string) =>
      `<tr>
        <td style="padding:8px 16px;color:#C8D8EE;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid #1B3055;">${label}</td>
        <td style="padding:8px 16px;color:#F0F5FF;font-size:13px;border-bottom:1px solid #1B3055;">${value || "—"}</td>
      </tr>`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="border-top:2px solid #6B9FEE;padding-top:24px;margin-bottom:32px;">
      <p style="color:#6B9FEE;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 8px;">Nouveau message</p>
      <h1 style="color:#F0F5FF;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.02em;">${sujetLabel}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#0A1628;border:1px solid #1B3055;">
      <tr><td colspan="2" style="padding:10px 16px;background:#040B16;color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;border-bottom:1px solid #1B3055;">Contact</td></tr>
      ${row("Nom", nom)}
      ${row("Email", email)}
      ${row("Téléphone", telephone)}
    </table>
    <div style="background:#0A1628;border:1px solid #1B3055;padding:20px;">
      <p style="color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid #1B3055;">Message</p>
      <p style="color:#C8D8EE;font-size:13px;line-height:1.8;margin:0;white-space:pre-wrap;">${message}</p>
    </div>
  </div>
</body>
</html>`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM,
        to: TO,
        replyTo: email,
        subject: `${sujetLabel} — ${nom}`,
        html,
      });
    } else {
      console.log("=== Contact (RESEND_API_KEY manquant) ===");
      console.log({ nom, email, telephone, sujet, message });
    }

    // Notification WhatsApp optionnelle
    const cbPhone  = process.env.CALLMEBOT_PHONE;
    const cbApiKey = process.env.CALLMEBOT_APIKEY;
    if (cbPhone && cbApiKey) {
      const text = `📩 ${sujetLabel}\n${nom} — ${telephone || email}`;
      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${cbPhone}&text=${encodeURIComponent(text)}&apikey=${cbApiKey}`
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
