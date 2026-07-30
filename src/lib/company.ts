// Infos de l'émetteur (vendeur) utilisées sur les devis.
// Éditable librement : complète SIRET / TVA / contact dès qu'ils sont disponibles.
//
// L'adresse reste complète ici : une facture doit porter l'adresse du siège.
// Les pages publiques du site (mentions légales, CGV) s'en tiennent à « Paris 17ᵉ ».
export const COMPANY = {
  legalName: "SASU Intelligence Automobile",
  brandName: "Intelligence Automobile",
  addressLines: ["30 rue Pouchet", "75017 Paris", "France"],
  representative: "César Vachon",
  siret: "108 086 646 00016",
  // Sans espaces : c'est la forme qu'un client recopie dans le vérificateur
  // européen VIES. Les lignes vides ne s'affichent pas sur le document.
  tvaNumber: "FR08108086646",
  rcs: "Paris 108 086 646",
  email: "",
  phone: "+33 6 20 24 38 79",
  website: "",
  // Logo affiché en haut du devis (sur fond blanc). Chemin public, espaces encodés.
  logoSrc: "/Logo/v9%20transparent.png",
  // Mention de bas de page (statut juridique).
  legalFootnote:
    "SASU Intelligence Automobile au capital de 2 000 €, immatriculée au Registre du commerce et des sociétés de Paris sous le numéro 108 086 646. Devis sans valeur d'engagement avant signature des deux parties.",
} as const;
