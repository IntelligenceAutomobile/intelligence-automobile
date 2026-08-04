// Régime de vente d'un véhicule : à qui il appartient, et donc dans quel cadre
// la vente se fait. Distinct du statut (disponible / réservé / vendu), qui dit
// seulement où en est la commercialisation.
// La valeur stockée en base est le libellé technique ; le texte affiché vient
// des traductions (`t.vehicleDetail.regimes`), l'explication apparaît au survol.

export const SALE_REGIMES = ["stock", "mandat-client", "mandat-pro-eu"] as const;
export type SaleRegime = (typeof SALE_REGIMES)[number];

export const SALE_REGIME_DEFAULT: SaleRegime = "stock";

// Clé de traduction correspondante (les tirets passent mal en clé d'objet).
export type SaleRegimeKey = "stock" | "mandatClient" | "mandatProEu";

const KEYS: Record<SaleRegime, SaleRegimeKey> = {
  stock: "stock",
  "mandat-client": "mandatClient",
  "mandat-pro-eu": "mandatProEu",
};

/** Valeur de base → clé de traduction. Toute valeur inconnue retombe sur « en stock ». */
export function saleRegimeKey(value: string | null | undefined): SaleRegimeKey {
  return KEYS[(value ?? "") as SaleRegime] ?? "stock";
}

/** Valeur de base validée, pour ce qui arrive d'un formulaire ou d'une requête. */
export function normalizeSaleRegime(value: unknown): SaleRegime {
  return SALE_REGIMES.includes(value as SaleRegime) ? (value as SaleRegime) : SALE_REGIME_DEFAULT;
}

// Mention ajoutée au texte de l'annonce diffusée sur les portails. Un véhicule
// détenu par l'entreprise se vend dans le cadre ordinaire d'un professionnel :
// rien à signaler. Les deux mandats, eux, changent le cadre de la vente et se
// disent donc dans l'annonce elle-même, au-delà de la fiche du site.
export const SALE_REGIME_MENTION: Record<SaleRegime, string> = {
  stock: "",
  "mandat-client": "Vente réalisée pour le compte d'un particulier.",
  "mandat-pro-eu":
    "Véhicule confié par un partenaire professionnel européen pour sa diffusion en France.",
};

// Choix proposés dans le back-office. L'administration reste en français, ces
// libellés vivent donc ici plutôt que dans les traductions du site public.
export const SALE_REGIME_OPTIONS: { value: SaleRegime; label: string }[] = [
  { value: "stock", label: "En stock — détenu par Intelligence Automobile" },
  { value: "mandat-client", label: "Mandat client — vente pour un particulier" },
  { value: "mandat-pro-eu", label: "Mandat pro européen — confié par un partenaire" },
];
