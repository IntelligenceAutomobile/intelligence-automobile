// Infos de l'émetteur (vendeur) utilisées sur les devis.
// Éditable librement : complète SIRET / TVA / contact dès qu'ils sont disponibles.
export const COMPANY = {
  legalName: "SASU Intelligence Automobile",
  brandName: "Intelligence Automobile",
  addressLines: ["30 rue Pouchet", "75017 Paris", "France"],
  representative: "César Vachon",
  // Laisser vide tant que non attribué : les lignes vides ne s'affichent pas.
  siret: "",
  tvaNumber: "",
  rcs: "",
  email: "",
  phone: "+33 6 20 24 38 79",
  website: "",
  // Logo affiché en haut du devis (sur fond blanc). Chemin public, espaces encodés.
  logoSrc: "/Logo/v9%20transparent.png",
  // Mention de bas de page (statut juridique).
  legalFootnote:
    "SASU Intelligence Automobile en cours d'immatriculation au Registre du Commerce et des Sociétés — SIRET et numéro de TVA intracommunautaire communiqués dès leur attribution. Devis sans valeur d'engagement avant signature des deux parties.",
} as const;
