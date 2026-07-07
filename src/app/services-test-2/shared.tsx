/* Base partagée entre la page (server) et les variantes interactives (client). */

export type Service = {
  num: string;
  id: string;
  title: string;
  hook: string;
  lead: string;
  points: string[];
};

export const SERVICES: Service[] = [
  {
    num: "01",
    id: "garantie",
    title: "Garantie",
    hook: "Roulez l'esprit tranquille.",
    lead: "Les organes essentiels couverts dès la remise des clés, sans démarche de votre part.",
    points: [
      "Garantie panne mécanique 3 mois incluse",
      "Extension jusqu'à 24 mois en option",
      "Moteur, boîte et transmission",
      "Assistance + véhicule de remplacement",
    ],
  },
  {
    num: "02",
    id: "financement",
    title: "Financement",
    hook: "Adapté à votre projet.",
    lead: "Crédit, LOA ou LLD : on vous oriente vers la formule qui colle à votre budget, réponse sous 48 h.",
    points: [
      "Crédit auto, LOA, LLD",
      "Étude personnalisée sous 48 h",
      "Partenaires spécialisés premium",
      "Financement des véhicules importés",
    ],
  },
  {
    num: "03",
    id: "assurances",
    title: "Assurances",
    hook: "Assuré dès la remise des clés.",
    lead: "Assurance temporaire WW pour rouler tout de suite, puis devis comparatifs pour votre couverture définitive.",
    points: [
      "Temporaire WW & assurance définitive",
      "Effective dès la livraison",
      "Partenaires premium & import",
      "Devis comparatifs sans engagement",
    ],
  },
  {
    num: "04",
    id: "demarches",
    title: "Démarches administratives",
    hook: "L'import sans la paperasse.",
    lead: "Quitus, COC, CPI, plaques WW : on monte et on suit tout le dossier ANTS à votre place.",
    points: [
      "Quitus fiscal & certificat de conformité",
      "CPI — Certificat Provisoire d'Immatriculation",
      "Plaques provisoires WW immédiates",
      "Dossier ANTS de bout en bout",
    ],
  },
  {
    num: "05",
    id: "carte-grise",
    title: "Carte grise définitive",
    hook: "Immatriculé en France.",
    lead: "On obtient votre carte grise française définitive et on fait poser vos plaques, sans une démarche de votre part.",
    points: [
      "Immatriculation définitive française",
      "Démarche ANTS prise en charge",
      "Suivi jusqu'à réception du titre",
      "Plaques définitives posées",
    ],
  },
];

/* Chiffre en dégradé (motif repris de /methode). */
export const NUM_GRADIENT = {
  backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

export function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
      <path d="M5 12.5l4 4L19 6.5" stroke="#6B9FEE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
