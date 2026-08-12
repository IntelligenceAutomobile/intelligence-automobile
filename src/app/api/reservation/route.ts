import { NextRequest, NextResponse } from "next/server";
import { sendMail, MAIL_FROM } from "@/lib/mailer";
import { createLeadFromSite } from "@/lib/crm-intake";
import { formatNumber } from "@/lib/format";

// Demande posée depuis la fiche d'un véhicule : réserver le véhicule, ou en
// recevoir le dossier complet. Les deux visent UN véhicule du stock et attendent
// un rappel : même chemin, même accusé de réception, textes et origine dans le
// carnet adaptés au bouton cliqué.
const TO = process.env.RESEND_TO ?? "contact@intelligenceautomobile.com";
const FROM = MAIL_FROM;

const RAPPELS: Record<string, string> = {
  matin: "Le matin",
  "apres-midi": "L'après-midi",
  soiree: "En soirée",
  "peu-importe": "Peu importe",
};

// Les valeurs saisies par un visiteur repartent dans deux emails : elles sont
// échappées avant d'entrer dans le gabarit.
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nom = String(body.nom ?? "").trim();
    const email = String(body.email ?? "").trim();
    const telephone = String(body.telephone ?? "").trim();
    const vehicule = String(body.vehicule ?? "").trim();
    const message = String(body.message ?? "").trim();
    const url = String(body.url ?? "").trim();
    const vehiculeId = String(body.vehiculeId ?? "").trim();
    const prix = Number(body.prix);
    const rappel = RAPPELS[String(body.rappel ?? "")] ?? RAPPELS["peu-importe"];
    const dossier = String(body.type ?? "") === "dossier";

    if (!nom || !email || !telephone || !vehicule) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const prixLabel = Number.isFinite(prix) && prix > 0 ? `${formatNumber(prix)} €` : "";
    const objet = dossier ? `Demande de dossier — ${vehicule}` : `Réservation — ${vehicule}`;

    // Lead CRM (en plus de l'email) : silencieux en cas d'échec.
    try {
      // Le marqueur d'origine vient du cookie posé par la mesure : il rattache
      // le contact au portail qui a amené le visiteur.
      await createLeadFromSite({
        srcMarker: req.cookies.get("ia_src")?.value ?? "",
        name: nom,
        email,
        phone: telephone,
        source: dossier ? "dossier" : "reservation",
        title: objet,
        vehicleId: vehiculeId,
        message: [
          dossier ? `Demande de dossier complet depuis le site.` : `Demande de réservation depuis le site.`,
          `Véhicule : ${vehicule}${prixLabel ? ` (${prixLabel})` : ""}`,
          `Rappel souhaité : ${rappel}`,
          message ? `Message du client : ${message}` : "",
          url ? `Page : ${url}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (e) {
      console.error("[CRM] Échec création lead (réservation):", e);
    }

    const row = (label: string, value: string) =>
      `<tr>
        <td style="padding:8px 16px;color:#C8D8EE;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid #1B3055;">${label}</td>
        <td style="padding:8px 16px;color:#F0F5FF;font-size:13px;border-bottom:1px solid #1B3055;">${value || "—"}</td>
      </tr>`;

    // ── Email interne ────────────────────────────────────────────────────────
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="border-top:2px solid #6B9FEE;padding-top:24px;margin-bottom:32px;">
      <p style="color:#6B9FEE;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 8px;">${dossier ? "Demande de dossier" : "Demande de réservation"}</p>
      <h1 style="color:#F0F5FF;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.02em;">${esc(vehicule)}</h1>
      ${prixLabel ? `<p style="color:#A8C6F4;font-size:14px;margin:8px 0 0;">${esc(prixLabel)}</p>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#0A1628;border:1px solid #1B3055;">
      <tr><td colspan="2" style="padding:10px 16px;background:#040B16;color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;border-bottom:1px solid #1B3055;">${dossier ? "Dossier à envoyer" : "À rappeler"}</td></tr>
      ${row("Nom", esc(nom))}
      ${row("Téléphone", esc(telephone))}
      ${row("Email", esc(email))}
      ${row("Moment", esc(rappel))}
    </table>
    ${
      message
        ? `<div style="background:#0A1628;border:1px solid #1B3055;padding:20px;margin-bottom:24px;">
      <p style="color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid #1B3055;">Message</p>
      <p style="color:#C8D8EE;font-size:13px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(message)}</p>
    </div>`
        : ""
    }
    ${
      url
        ? `<p style="margin:0;"><a href="${esc(url)}" style="color:#6B9FEE;font-size:12px;">Voir la fiche du véhicule</a></p>`
        : ""
    }
  </div>
</body>
</html>`;

    const envoi = await sendMail({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `${objet} — ${nom}`,
      html,
      origin: dossier ? "dossier" : "reservation",
    });
    if (!envoi.sent) {
      console.log(`=== ${dossier ? "Demande de dossier" : "Réservation"} (email non parti) ===`);
      console.log({ nom, email, telephone, vehicule, rappel, message, raison: envoi.reason ?? envoi.error });
    }

    // ── Accusé de réception au client ────────────────────────────────────────
    // Il engage un véhicule de plusieurs dizaines de milliers d'euros : la trace
    // écrite de sa demande vaut mieux qu'un message qui disparaît à l'écran.
    const accuse = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="border-top:2px solid #6B9FEE;padding-top:24px;margin-bottom:28px;">
      <p style="color:#6B9FEE;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 8px;">Intelligence Automobile</p>
      <h1 style="color:#F0F5FF;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.02em;">${dossier ? "Votre demande de dossier" : "Votre demande de réservation"}</h1>
    </div>
    <p style="color:#C8D8EE;font-size:14px;line-height:1.8;margin:0 0 20px;">Bonjour ${esc(nom)},</p>
    <p style="color:#C8D8EE;font-size:14px;line-height:1.8;margin:0 0 20px;">
      Nous avons bien reçu votre demande de ${dossier ? "dossier complet" : "réservation"} pour la <strong style="color:#F0F5FF;">${esc(vehicule)}</strong>${prixLabel ? ` (${esc(prixLabel)})` : ""}.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#0A1628;border:1px solid #1B3055;">
      ${row("Téléphone", esc(telephone))}
      ${row("Rappel", esc(rappel))}
    </table>
    <p style="color:#C8D8EE;font-size:14px;line-height:1.8;margin:0 0 20px;">
      ${
        dossier
          ? "Nous vous envoyons le dossier complet du véhicule sous 24 heures ouvrées : photos détaillées, historique d'entretien, contrôles et conditions de financement. Nous vous rappelons dans la foulée pour répondre à vos questions."
          : "Nous vous rappelons sous 24 heures ouvrées pour bloquer le véhicule à votre nom et répondre à vos questions."
      }
    </p>
    <p style="color:#C8D8EE;font-size:14px;line-height:1.8;margin:0 0 28px;">
      Pour nous joindre avant : <a href="tel:+33620243879" style="color:#6B9FEE;">+33 6 20 24 38 79</a>.
    </p>
    <p style="color:#7BA5DC;font-size:12px;line-height:1.7;margin:0;border-top:1px solid #1B3055;padding-top:18px;">
      Intelligence Automobile · contact@intelligenceautomobile.com
    </p>
  </div>
</body>
</html>`;

    await sendMail({
      from: FROM,
      to: email,
      subject: `${dossier ? "Votre demande de dossier" : "Votre demande de réservation"} — ${vehicule}`,
      html: accuse,
      origin: dossier ? "dossier-client" : "reservation-client",
    });

    // Notification WhatsApp optionnelle
    const cbPhone = process.env.CALLMEBOT_PHONE;
    const cbApiKey = process.env.CALLMEBOT_APIKEY;
    if (cbPhone && cbApiKey) {
      const text = dossier
        ? `📄 Dossier ${vehicule}\n${nom} — ${telephone}\nRappel : ${rappel}`
        : `🔒 Réservation ${vehicule}\n${nom} — ${telephone}\nRappel : ${rappel}`;
      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${cbPhone}&text=${encodeURIComponent(text)}&apikey=${cbApiKey}`
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
