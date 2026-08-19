// Mailings : les trois modèles d'email de prospection et leur rendu HTML.
// Le même code compose l'aperçu à l'écran et le message réellement envoyé :
// ce que l'utilisateur relit est exactement ce que reçoit le destinataire.
// Module neutre, sans dépendance Prisma/React.

import { escapeHtml } from "./html";

// ── Structure d'un mailing ──────────────────────────────────────────────────
// Le corps est une suite de blocs ordonnés, chacun éditable à l'écran.

export type MailingBlock =
  | { type: "paragraphe"; text: string }
  | { type: "puces"; items: string[] }
  | { type: "bouton"; label: string; url: string };

export type MailingContent = {
  /** Objet du message. */
  subject: string;
  /** Ligne d'aperçu dans la boîte de réception, invisible dans le message. */
  preheader: string;
  /** Petite ligne en capitales au-dessus du titre. */
  kicker: string;
  /** Titre du message. */
  titre: string;
  blocks: MailingBlock[];
  /** Ligne grise propre à la cible, affichée sous la signature. */
  signatureNote: string;
  /** « Vous recevez ce message … » du pied de page légal. */
  motif: string;
};

export type MailingTemplate = {
  id: string;
  /** Nom du modèle à l'écran. */
  label: string;
  /** À qui il s'adresse, en une ligne. */
  audience: string;
  content: MailingContent;
};

// ── Mise en gras légère ─────────────────────────────────────────────────────
// Dans un paragraphe ou une puce, un passage entre **doubles astérisques**
// ressort en blanc et en gras (les intitulés de services du mail acheteurs).
function riche(text: string): string {
  return escapeHtml(text).replace(
    /\*\*([^*]+)\*\*/g,
    '<span style="color:#F0F5FF;font-weight:700;">$1</span>',
  );
}

// ── Rendu HTML ──────────────────────────────────────────────────────────────
// Gabarit maison : tables et styles en ligne (les clients de messagerie
// ignorent les feuilles de style), largeur 600 px, une colonne.

function para(text: string, top = 18): string {
  return `<tr><td class="ia-pad ia-corps" style="padding:${top}px 32px 0;color:#C8D8EE;font-size:15px;line-height:26px;"><p style="margin:0;">${riche(text)}</p></td></tr>`;
}

function puces(items: string[]): string {
  const rows = items
    .map(
      (it) =>
        `<tr><td valign="top" width="18" style="padding:0 0 12px;color:#6B9FEE;font-size:15px;line-height:26px;">&bull;</td><td valign="top" class="ia-corps" style="padding:0 0 12px;color:#C8D8EE;font-size:15px;line-height:26px;">${riche(it)}</td></tr>`,
    )
    .join("");
  return `<tr><td class="ia-pad" style="padding:16px 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${rows}</table></td></tr>`;
}

function bouton(label: string, url: string): string {
  return `<tr><td class="ia-pad" align="left" style="padding:22px 32px 0;"><table role="presentation" class="ia-btn" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td align="center" bgcolor="#6B9FEE" style="background-color:#6B9FEE;background-image:linear-gradient(#6B9FEE,#6B9FEE);"><a href="${escapeHtml(url)}" style="display:inline-block;padding:15px 28px;color:#070F1E;font-size:13px;line-height:16px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table></td></tr>`;
}

function signature(note: string): string {
  const extra = note.trim()
    ? `<p style="margin:0 0 14px;color:#7C92B5;font-size:11px;line-height:18px;">${riche(note)}</p>`
    : "";
  return `<tr><td class="ia-pad" style="padding:30px 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td style="padding:26px 0 0;border-top:1px solid #1B3055;">
<p style="margin:0 0 3px;color:#F0F5FF;font-size:16px;line-height:22px;font-weight:700;">C&eacute;sar Vachon</p>
<p style="margin:0 0 16px;color:#6B9FEE;font-size:10px;line-height:16px;letter-spacing:0.3em;text-transform:uppercase;">Fondateur &middot; Intelligence Automobile</p>
<p style="margin:0 0 5px;color:#C8D8EE;font-size:14px;line-height:22px;">T&eacute;l&eacute;phone et WhatsApp : <a href="https://wa.me/33620243879" style="color:#6B9FEE;text-decoration:none;">+33 6 20 24 38 79</a></p>
<p style="margin:0 0 5px;color:#C8D8EE;font-size:14px;line-height:22px;"><a href="mailto:contact@intelligenceautomobile.com" style="color:#6B9FEE;text-decoration:none;">contact@intelligenceautomobile.com</a></p>
<p style="margin:0 0 16px;color:#C8D8EE;font-size:14px;line-height:22px;"><a href="https://intelligenceautomobile.fr" style="color:#6B9FEE;text-decoration:none;">intelligenceautomobile.fr</a></p>
${extra}
<p style="margin:0;color:#7C92B5;font-size:11px;line-height:18px;">SASU Intelligence Automobile au capital de 2&nbsp;000&nbsp;&euro;, 30 rue Pouchet, 75017 Paris.<br>RCS Paris 108&nbsp;086&nbsp;646 &middot; SIRET 108&nbsp;086&nbsp;646&nbsp;00016 &middot; TVA FR08108086646.</p>
</td></tr></table></td></tr>`;
}

function pied(motif: string): string {
  return `<tr><td class="ia-pad" style="padding:30px 32px 40px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td style="padding:20px 0 0;border-top:1px solid #1B3055;color:#7C92B5;font-size:11px;line-height:19px;">
<p style="margin:0 0 12px;">Ce message vous est adress&eacute; par Intelligence Automobile, SASU au capital de 2&nbsp;000&nbsp;&euro;, 30 rue Pouchet, 75017 Paris, RCS Paris 108&nbsp;086&nbsp;646.</p>
<p style="margin:0 0 12px;">Vous recevez ce message ${riche(motif)}. Pour cesser de le recevoir, r&eacute;pondez simplement &laquo;&nbsp;STOP&nbsp;&raquo; &agrave; cette adresse. Votre retrait prend effet sous 48&nbsp;heures.</p>
<p style="margin:0;">Vos coordonn&eacute;es servent exclusivement &agrave; nos &eacute;changes au sujet de l&rsquo;import automobile. Elles restent chez Intelligence Automobile et se conservent 3&nbsp;ans &agrave; compter de notre dernier contact. Vous disposez des droits d&rsquo;acc&egrave;s, de rectification, d&rsquo;effacement, d&rsquo;opposition et de portabilit&eacute; : &eacute;crivez &agrave; <a href="mailto:contact@intelligenceautomobile.com" style="color:#6B9FEE;text-decoration:none;">contact@intelligenceautomobile.com</a>. Une r&eacute;clamation reste ouverte aupr&egrave;s de la CNIL, <a href="https://www.cnil.fr" style="color:#6B9FEE;text-decoration:none;">cnil.fr</a>.</p>
</td></tr></table></td></tr>`;
}

/** Compose le message complet. Sert à l'aperçu à l'écran ET à l'envoi réel. */
export function renderMailing(c: MailingContent): string {
  // Un paragraphe vidé à l'écran disparaît du message ; une puce vide aussi.
  const corps = c.blocks
    .map((b, i) => {
      if (b.type === "paragraphe") return b.text.trim() ? para(b.text, i === 0 ? 24 : 18) : "";
      if (b.type === "puces") {
        const items = b.items.map((s) => s.trim()).filter(Boolean);
        return items.length ? puces(items) : "";
      }
      return b.label.trim() && b.url.trim() ? bouton(b.label, b.url) : "";
    })
    .join("");

  // Un message vierge se passe d'en-tête : la petite ligne et le titre ne
  // s'affichent que s'ils sont remplis.
  const enTete =
    c.kicker.trim() || c.titre.trim()
      ? `<tr><td class="ia-pad" style="padding:28px 32px 0;">
${c.kicker.trim() ? `<p style="margin:0 0 10px;color:#6B9FEE;font-size:10px;line-height:16px;letter-spacing:0.3em;text-transform:uppercase;">${escapeHtml(c.kicker)}</p>` : ""}
${c.titre.trim() ? `<h1 class="ia-titre" style="margin:0;color:#F0F5FF;font-size:22px;line-height:30px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(c.titre)}</h1>` : ""}
</td></tr>`
      : "";

  // Blindage du fond sombre : certaines boîtes mail (Gmail sur téléphone en
  // tête) repeignent les couleurs d'un email sombre et le rendent tout blanc.
  // Trois parades cumulées : les métas color-scheme, l'attribut bgcolor
  // historique, et un dégradé uni en image de fond, que ces boîtes ne
  // retouchent jamais.
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<style>
body,table,td,a{-webkit-text-size-adjust:100%}
img{border:0;height:auto;line-height:100%}
a{color:#6B9FEE}
@media only screen and (max-width:620px){
.ia-wrap{width:100%!important;max-width:100%!important}
.ia-pad{padding-left:20px!important;padding-right:20px!important}
.ia-titre{font-size:20px!important;line-height:27px!important}
.ia-corps{font-size:16px!important;line-height:26px!important}
.ia-btn a{display:block!important;width:auto!important;text-align:center!important}
}
</style></head>
<body bgcolor="#070F1E" style="margin:0;padding:0;background-color:#070F1E;background-image:linear-gradient(#070F1E,#070F1E);">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#070F1E;font-size:1px;line-height:1px;">${escapeHtml(c.preheader)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#070F1E" style="border-collapse:collapse;background-color:#070F1E;background-image:linear-gradient(#070F1E,#070F1E);"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="ia-wrap" cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="#070F1E" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#070F1E;background-image:linear-gradient(#070F1E,#070F1E);font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;">
<tr><td bgcolor="#6B9FEE" style="height:2px;line-height:2px;font-size:0;background-color:#6B9FEE;background-image:linear-gradient(#6B9FEE,#6B9FEE);">&nbsp;</td></tr>
${enTete}
${corps}
${signature(c.signatureNote)}
${pied(c.motif)}
</table></td></tr></table></body></html>`;
}

// ── Message vierge ──────────────────────────────────────────────────────────
// Le point de départ par défaut de l'écran Mailings : un mail nu, habillé du
// gabarit maison (filet, signature, pied légal) mais libre de tout texte.
export const MAILING_VIERGE: MailingContent = {
  subject: "",
  preheader: "",
  kicker: "",
  titre: "",
  blocks: [
    { type: "paragraphe", text: "Bonjour," },
    { type: "paragraphe", text: "" },
  ],
  signatureNote: "",
  motif: "à la suite de nos échanges",
};

// ── Les trois modèles ───────────────────────────────────────────────────────
// Textes validés le 19 août 2026. L'écran Mailings les charge tels quels et
// laisse tout modifier avant l'envoi ; modifier ici change le modèle de départ.

export const MAILING_TEMPLATES: MailingTemplate[] = [
  {
    id: "pros-etrangers",
    label: "Professionnels étrangers",
    audience: "Garages, concessions et marchands en Allemagne, Belgique et Union européenne",
    content: {
      subject: "Un débouché français pour votre stock",
      preheader: "Vos véhicules en vente en France, vous restez propriétaire jusqu'à la signature.",
      kicker: "Partenariat professionnel",
      titre: "Un débouché français pour votre stock.",
      blocks: [
        { type: "paragraphe", text: "Bonjour," },
        {
          type: "paragraphe",
          text: "Intelligence Automobile est une société parisienne spécialisée dans les véhicules premium. Nous sélectionnons nos voitures chez des professionnels allemands, belges et européens, puis nous les vendons en France sur notre propre site.",
        },
        {
          type: "paragraphe",
          text: "Nous vous proposons de confier certains de vos véhicules à la vente chez nous. Voici comment nous travaillons :",
        },
        {
          type: "puces",
          items: [
            "Vous restez propriétaire du véhicule jusqu'à la signature de l'acheteur final.",
            "Votre prix net vendeur se fixe ensemble, avant la mise en ligne. Notre honoraire s'ajoute à ce prix.",
            "Nous nous occupons de tout le reste : l'acheteur, le transport, les formalités d'export et la carte grise française.",
            "Votre facture est réglée sous 30 jours, et dès l'encaissement de l'acheteur lorsqu'il intervient plus tôt.",
          ],
        },
        {
          type: "paragraphe",
          text: "Intelligence Automobile est une SASU immatriculée au RCS de Paris (108 086 646), couverte par une assurance responsabilité civile professionnelle.",
        },
        { type: "paragraphe", text: "Notre vitrine vous montre la présentation réservée à vos véhicules :" },
        { type: "bouton", label: "Voir notre vitrine", url: "https://intelligenceautomobile.fr" },
        {
          type: "paragraphe",
          text: "Si vous souhaitez travailler avec nous, ou simplement en savoir plus, répondez à ce message : nous serons ravis d'un premier échange au téléphone, à l'heure qui vous arrange.",
        },
      ],
      signatureNote: "Wir sprechen Deutsch · We speak English · Nederlands op aanvraag",
      motif:
        "en votre qualité de professionnel du négoce automobile en Union européenne, à l'adresse publiée par votre établissement",
    },
  },
  {
    id: "vendeurs-particuliers",
    label: "Particuliers vendeurs",
    audience: "Particuliers qui vendent leur véhicule (mandat d'aide à la vente)",
    content: {
      subject: "Et si on s'occupait de la vente pour vous ?",
      preheader: "Photos, annonce, acheteurs filtrés. Nos honoraires se règlent le jour de la vente.",
      kicker: "Aide à la vente",
      titre: "Et si on s'occupait de la vente pour vous ?",
      blocks: [
        { type: "paragraphe", text: "Bonjour," },
        {
          type: "paragraphe",
          text: "Vendre sa voiture soi-même est un deuxième travail. Les appels arrivent le soir, la moitié des messages commencent par « dernier prix », et les rendez-vous sérieux se comptent sur les doigts d'une main.",
        },
        { type: "paragraphe", text: "Notre métier est de faire ce travail à votre place, au prix du marché." },
        { type: "paragraphe", text: "Concrètement :" },
        {
          type: "puces",
          items: [
            "Une estimation argumentée de votre véhicule sous 24 h ouvrées.",
            "Photos professionnelles, annonce rédigée, diffusion sur les plateformes adaptées à votre modèle.",
            "Nous répondons à chaque contact et nous vous amenons uniquement les acheteurs sérieux.",
            "Paiement sécurisé et démarches administratives comprises : le règlement arrive directement sur votre compte.",
          ],
        },
        {
          type: "paragraphe",
          text: "Nos honoraires se règlent le jour de la vente conclue, sur le prix obtenu. Leur montant vous est annoncé avant tout accord.",
        },
        {
          type: "paragraphe",
          text: "Le rythme que nous visons : une vente en 2 à 4 semaines, au prix constaté sur le marché de votre modèle.",
        },
        {
          type: "paragraphe",
          text: "Curieux de savoir ce que vaut votre voiture aujourd'hui ? Décrivez-la en deux minutes, nous revenons vers vous avec un prix et un plan de vente.",
        },
        { type: "bouton", label: "Recevoir mon estimation", url: "https://intelligenceautomobile.fr/revente-sur-mesure" },
      ],
      signatureNote: "Estimation gratuite · Honoraires annoncés avant tout accord · Règlement le jour de la vente conclue",
      motif: "à la suite de votre annonce publiée en ligne et de votre accord pour recevoir nos informations",
    },
  },
  {
    id: "acheteurs",
    label: "Acheteurs",
    audience: "Particuliers en projet d'achat (services et recherche personnalisée)",
    content: {
      subject: "Votre future voiture, du choix aux plaques",
      preheader: "Un seul interlocuteur, chaque étape sécurisée, du contrôle du véhicule aux plaques posées.",
      kicker: "Recherche personnalisée",
      titre: "Votre future voiture, du choix aux plaques.",
      blocks: [
        { type: "paragraphe", text: "Bonjour," },
        {
          type: "paragraphe",
          text: "Intelligence Automobile accompagne les particuliers dans l'achat de leur véhicule en Europe. Notre veille analyse plus de 2 000 annonces par mois sur les marchés européens : c'est ce qui nous permet de dénicher des véhicules premium à bon tarif, contrôlés et bien documentés.",
        },
        {
          type: "paragraphe",
          text: "Notre méthode tient en une idée simple : vous avez un seul interlocuteur, et chaque étape est sécurisée.",
        },
        {
          type: "puces",
          items: [
            "**Contrôle du véhicule** : inspection sur place par un technicien indépendant, rapport complet remis avant votre décision.",
            "**Garantie mécanique** : 3 mois inclus (moteur, boîte, transmission), extension jusqu'à 24 mois en option.",
            "**Financement** : crédit, LOA ou LLD, dossier étudié sous 48 h par nos partenaires immatriculés à l'ORIAS.",
            "**Assurance auto** : nos courtiers partenaires mettent votre couverture en place pour le jour de la livraison.",
            "**Immatriculation et livraison** : COC, quitus fiscal, plaques WW pour rouler tout de suite, carte grise française suivie jusqu'aux plaques définitives, livraison à domicile.",
          ],
        },
        {
          type: "paragraphe",
          text: "Côté budget, tout est transparent : chaque coût figure au devis, avant votre engagement.",
        },
        {
          type: "paragraphe",
          text: "Vous avez un projet, même encore flou ? Décrivez la voiture qui vous ferait plaisir dans notre formulaire de recherche personnalisée. Et si vous préférez en parler de vive voix, nous serons ravis d'un premier échange au téléphone : une simple prise de contact, qui vous laisse entièrement libre de la suite.",
        },
        { type: "bouton", label: "Lancer ma recherche", url: "https://intelligenceautomobile.fr/recherche-personnalisee" },
      ],
      signatureNote:
        "Intelligence Automobile intervient en qualité d'importateur et de mandataire automobile. Les prestations de financement et d'assurance relèvent de partenaires immatriculés à l'ORIAS, seuls habilités à les proposer.",
      motif: "à la suite de votre demande de contact adressée à Intelligence Automobile",
    },
  },
];
