// Gabarit de l'invitation à laisser un avis.
//
// Module neutre (aucun accès base, aucun envoi) : la route d'envoi le construit
// pour de vrai, l'aperçu du back-office l'affiche, et la démonstration publique
// /demopro montre exactement le même message. Une seule source pour les trois.
import { escapeHtml } from "./html";
import { phraseSatisfaction } from "./avis";
import { COMPANY } from "./company";

export function reviewEmail(opts: {
  clientName: string;
  brandName: string;
  reviewLink: string;
  accent: string;
  /** Véhicule acheté. Vide, le message parle de « votre nouveau véhicule ». */
  vehicle: string;
  /** Message personnel tapé dans l'aperçu. */
  message?: string;
  /** Adresse d'opposition en un clic. Absente, le message renvoie à la réponse. */
  stopLink?: string;
}): string {
  const { reviewLink, accent } = opts;
  const clientName = escapeHtml(opts.clientName);
  const brandName = escapeHtml(opts.brandName);
  const hi = clientName ? `Bonjour ${clientName},` : "Bonjour,";

  // Message personnel de l'utilisateur, inséré tel quel (échappé) après
  // l'accroche. Le conteneur marqué data-perso sert à l'aperçu : le dialogue y
  // reflète la saisie en direct, ce qui s'affiche est ce qui part.
  const perso = (opts.message ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("");

  // Coordonnées : les champs vides du fichier company.ts se retiraient d'eux-mêmes
  // sur les devis. Ici le pied de page gardait le séparateur, d'où un point
  // médian orphelin devant le téléphone.
  const coordonnees = [COMPANY.email, COMPANY.phone].filter(Boolean).join(" · ");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070F1E;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#C8D8EE;">
    <div style="border-top:2px solid ${accent};padding-top:20px;margin-bottom:24px;">
      <p style="color:${accent};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Votre avis compte</p>
      <h1 style="color:#F0F5FF;font-size:20px;margin:0;">Merci de votre confiance</h1>
    </div>
    <p>${hi}</p>
    <p>${escapeHtml(phraseSatisfaction(opts.vehicle))} Votre retour nous aide énormément et guide les futurs acheteurs.</p>
    <div data-perso>${perso}</div>
    <p>Si vous avez un instant, laisser un avis Google ne prend qu'une minute :</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${escapeHtml(reviewLink)}" style="display:inline-block;background:${accent};color:#070F1E;font-weight:600;text-decoration:none;padding:12px 24px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">
        Laisser un avis
      </a>
    </p>
    <p style="color:#7C92B5;font-size:12px;">Merci infiniment,<br>L'équipe ${brandName}</p>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1B3055;color:#7C92B5;font-size:12px;">
      ${coordonnees}
    </div>
    <!-- Prospection directe au sens de l'article L34-5 du code des postes : le
         destinataire lit d'où vient le message et comment y mettre fin. -->
    <p style="margin-top:16px;color:#5C7092;font-size:11px;line-height:1.6;">
      Vous recevez ce message parce que vous avez acheté un véhicule auprès de ${brandName}.
      ${
        opts.stopLink
          ? `<a href="${escapeHtml(opts.stopLink)}" style="color:#7C92B5;">Je préfère cesser de recevoir ces messages</a>.`
          : "Répondez à ce message pour cesser de recevoir nos invitations."
      }
      Vos coordonnées restent conservées le temps de notre relation commerciale, et vous disposez d'un droit d'accès, de rectification et d'effacement en écrivant à cette même adresse.
    </p>
  </div>
</body></html>`;
}

/** Objet du message, calculé une seule fois pour l'aperçu et pour l'envoi. */
export function reviewSubject(brandName: string): string {
  return `Votre avis sur ${brandName}`;
}
