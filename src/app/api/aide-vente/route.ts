import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createLeadFromSite } from "@/lib/crm-intake";

const resend = new Resend(process.env.RESEND_API_KEY);

const TO   = process.env.RESEND_TO   ?? "contact@intelligenceautomobile.com";
const FROM = process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    const prenom      = data.get("prenom")      as string;
    const nom         = data.get("nom")          as string;
    const email       = data.get("email")        as string;
    const telephone   = data.get("telephone")    as string;
    const marque      = data.get("marque")       as string;
    const modele      = data.get("modele")       as string;
    const annee       = data.get("annee")        as string;
    const kilometrage = data.get("kilometrage")  as string;
    const carburant   = data.get("carburant")    as string;
    const boite       = data.get("boite")        as string;
    const etat        = data.get("etat")         as string;
    const entretien   = data.get("entretien")    as string;
    const prix        = data.get("prix")         as string;
    const precisions  = data.get("precisions")   as string;
    // Reprise d'annonce : le vendeur a déjà publié son véhicule quelque part.
    const lien        = ((data.get("lien") as string) ?? "").trim();

    if (!prenom || !nom || !email || !marque || !modele) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const photoUrls = (data.getAll("photoUrls") as string[]).filter(Boolean);

    // Lead CRM (en plus de l'email) : silencieux en cas d'échec.
    try {
      await createLeadFromSite({
        name: `${prenom} ${nom}`.trim(),
        email,
        phone: telephone,
        source: "aide-vente",
        title: `${lien ? "Reprise d'annonce" : "Vente"} ${marque} ${modele} (${annee})`,
        message: [
          `${marque} ${modele} · ${annee} · ${kilometrage} km · ${carburant} · ${boite}`,
          `État : ${etat} · Entretien : ${entretien}`,
          prix ? `Prix espéré : ${prix}` : "",
          lien ? `Annonce en ligne : ${lien}` : "",
          precisions || "",
        ].filter(Boolean).join("\n"),
      });
    } catch (e) {
      console.error("[CRM] Échec création lead (aide-vente):", e);
    }

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
      <p style="color:#6B9FEE;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 8px;">
        Nouvelle demande
      </p>
      <h1 style="color:#F0F5FF;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.02em;">
        ${lien ? "Reprise d'annonce" : "Aide à la Vente"}
      </h1>
      <p style="color:#C8D8EE;font-size:13px;margin:8px 0 0;">
        ${marque} ${modele} · ${annee} · ${kilometrage} km
      </p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#0A1628;border:1px solid #1B3055;">
      <tr><td colspan="2" style="padding:10px 16px;background:#040B16;color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;border-bottom:1px solid #1B3055;">Véhicule</td></tr>
      ${row("Marque", marque)}
      ${row("Modèle", modele)}
      ${row("Année", annee)}
      ${row("Kilométrage", `${kilometrage} km`)}
      ${row("Carburant", carburant)}
      ${row("Boîte", boite)}
      ${row("État", etat)}
      ${row("Entretien", entretien)}
      ${row("Prix espéré", prix)}
      ${lien ? row("Annonce en ligne", `<a href="${lien}" style="color:#6B9FEE;">${lien}</a>`) : ""}
      ${precisions ? row("Précisions", precisions) : ""}
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#0A1628;border:1px solid #1B3055;">
      <tr><td colspan="2" style="padding:10px 16px;background:#040B16;color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;border-bottom:1px solid #1B3055;">Contact</td></tr>
      ${row("Nom", `${prenom} ${nom}`)}
      ${row("Email", email)}
      ${row("Téléphone", telephone)}
    </table>

    ${
      photoUrls.length > 0
        ? `<div style="margin-top:8px;">
            <p style="color:#6B9FEE;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid #1B3055;">
              Photos (${photoUrls.length})
            </p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              ${photoUrls.map((url, i) => `<a href="${url}" target="_blank" style="display:block;aspect-ratio:1;overflow:hidden;border:1px solid #1B3055;">
                <img src="${url}" alt="Photo ${i + 1}" style="width:100%;height:100%;object-fit:cover;" />
              </a>`).join("")}
            </div>
          </div>`
        : `<p style="color:#C8D8EE;font-size:12px;margin:0;">Aucune photo jointe.</p>`
    }

  </div>
</body>
</html>`;

    // Envoi email via Resend
    if (process.env.RESEND_API_KEY) {
      console.log(`[Resend] FROM=${FROM} TO=${TO}`);
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: TO,
        replyTo: email,
        subject: `${lien ? "Reprise d'annonce" : "Aide à la vente"} — ${marque} ${modele} (${annee}) — ${prenom} ${nom}`,
        html,
      });
      if (error) console.error("[Resend] Erreur:", JSON.stringify(error));
      else console.log("[Resend] Envoyé, id:", data?.id);
    } else {
      console.log("=== Aide à la vente (RESEND_API_KEY manquant) ===");
      console.log({ prenom, nom, email, telephone, marque, modele, annee, kilometrage, etat, prix });
    }

    // Notification WhatsApp via CallMeBot (optionnel)
    const cbPhone  = process.env.CALLMEBOT_PHONE;
    const cbApiKey = process.env.CALLMEBOT_APIKEY;
    if (cbPhone && cbApiKey) {
      const text = `🚗 Aide à la vente\n${marque} ${modele} ${annee} — ${kilometrage} km\n${etat} · ${entretien}\nPrix espéré : ${prix || "NC"}\n\n${prenom} ${nom}\n${telephone || email}`;
      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${cbPhone}&text=${encodeURIComponent(text)}&apikey=${cbApiKey}`
      ).catch(() => {}); // silencieux si WhatsApp non configuré
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur aide-vente API:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
