// Types et calculs partagés du devis (module neutre : importable côté serveur ET client).
// Aucune dépendance React/Next ici.
import { COMPANY } from "./company";
// La règle « neuf fiscalement » (moins de 6 mois OU moins de 6 000 km, jugée au
// jour près) vit dans le module Immatriculations : une seule définition pour les
// deux modules, sinon les deux écrans se contredisent sur le même véhicule.
import { assessVat } from "./immatriculation";

export type TvaMode = "marge" | "tva20" | "exonere" | "intracom";
export type DepositMode = "percent" | "amount" | "none";
export const QUOTE_STATUSES = ["brouillon", "envoye", "accepte", "refuse"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
// « avoir » : facture d'avoir, le seul document qui corrige une facture émise.
// Une facture ne se modifie ni ne se supprime, la comptabilité l'interdit.
export type DocType = "devis" | "facture" | "avoir";

// Langue du document remis au client. Le back-office reste en français : c'est
// la feuille imprimée, l'email d'envoi et la page publique qui basculent.
export type DocLang = "fr" | "en";
export const DOC_LANGS = ["fr", "en"] as const;
export const DOC_LANG_LABEL: Record<DocLang, string> = { fr: "Français", en: "Anglais" };

// Documents qui ne sont PAS des devis. Sert de filtre unique en base : écrit à la
// main à chaque requête, un type oublié faisait apparaître les avoirs dans la
// liste des devis et dans le centre de relances.
export const DOCS_HORS_DEVIS = ["facture", "avoir"] as const;

// Motifs d'avoir proposés à la saisie. Le motif n'est pas décoratif : c'est lui
// qui explique au client et au comptable pourquoi la facture est corrigée.
export const AVOIR_REASONS = [
  "Annulation de la commande",
  "Geste commercial",
  "Remise accordée après facturation",
  "Retour de marchandise",
  "Erreur de facturation",
  "Prestation non réalisée",
] as const;
export type FactureKind = "complete" | "acompte" | "solde";
export type PaymentStatus = "impayee" | "payee";
export type LogoAlign = "left" | "center" | "right";
export type QuoteKind = "vehicule" | "prestation";
export type DocTheme = "classic" | "colored" | "minimal";

// Couleurs d'accent prédéfinies (pastilles).
export const ACCENT_PRESETS: { label: string; value: string }[] = [
  { label: "Bleu marine", value: "#1E4FA3" },
  { label: "Magenta", value: "#ED008C" },
  { label: "Anthracite", value: "#2B2F36" },
  { label: "Émeraude", value: "#0F8A6A" },
  { label: "Bordeaux", value: "#8A1538" },
];

// Blocs de l'en-tête déplaçables/redimensionnables (hors logo, géré à part).
export type HeaderBlockId = "emitter" | "client" | "meta";
export type BlockBox = { x: number; y: number; w: number }; // mm

// Disposition par défaut des blocs (mm, repère = coin haut-gauche de la zone de contenu, largeur ~178mm).
// Le bloc client garde un repère fixe uniquement pour la rétro-compatibilité :
// sa position réelle se calcule sur la hauteur de l'émetteur (voir defaultBlockBox).
export const DEFAULT_BLOCK_BOX: Record<HeaderBlockId, BlockBox> = {
  emitter: { x: 0, y: 22, w: 95 },
  meta: { x: 108, y: 22, w: 70 },
  client: { x: 0, y: 48, w: 95 },
};
export const DEFAULT_HEADER_HEIGHT = 74; // mm

/* ── Géométrie de l'en-tête ──
   Les blocs sont posés en absolu sur la feuille : sans mesure de leur contenu,
   l'encadré client passait par-dessus les coordonnées de l'émetteur, et le
   recouvrement s'aggravait de deux lignes dès que le SIRET et le numéro de TVA
   étaient renseignés, c'est-à-dire sur tout devis d'un professionnel. */
const PT_MM = 0.3528; // 1 pt en millimètres
const NAME_MM = 11 * PT_MM * 1.45; // le nom de l'émetteur est en 11 pt
const LINE_MM = 8.5 * PT_MM * 1.45; // ses coordonnées en 8,5 pt
const NAME_GAP_MM = 1.5;
const BLOCK_GAP_MM = 6;

// Lignes réellement imprimées sous le nom de l'émetteur.
export function emitterLineCount(b: Branding): number {
  const address = b.emitterAddress.split("\n").map((l) => l.trim()).filter(Boolean).length;
  return (
    address +
    (b.emitterRepresentative ? 1 : 0) +
    (b.emitterSiret ? 1 : 0) +
    (b.emitterTva ? 1 : 0) +
    (b.emitterEmail ? 1 : 0) +
    (b.emitterPhone ? 1 : 0)
  );
}

export function emitterHeight(b: Branding): number {
  return NAME_MM + NAME_GAP_MM + emitterLineCount(b) * LINE_MM;
}

// Disposition automatique : le client se pose sous l'émetteur, quel qu'il soit.
export function defaultBlockBox(b: Branding, id: HeaderBlockId): BlockBox {
  if (id === "emitter") return DEFAULT_BLOCK_BOX.emitter;
  if (id === "meta") return DEFAULT_BLOCK_BOX.meta;
  const top = DEFAULT_BLOCK_BOX.emitter.y + emitterHeight(b) + BLOCK_GAP_MM;
  return { x: 0, y: Math.round(top * 10) / 10, w: 95 };
}

// Lignes de l'encadré destinataire.
type ClientLines = Pick<QuoteData, "clientName" | "clientCompany" | "clientAddress" | "clientEmail" | "clientPhone"> &
  Partial<Pick<QuoteData, "clientCountry" | "clientVatNumber">>;
function clientBoxHeight(q: ClientLines): number {
  const lines =
    (q.clientCompany ? 1 : 0) +
    (q.clientName ? 1 : 0) +
    q.clientAddress.split("\n").map((l) => l.trim()).filter(Boolean).length +
    // Pays et numéro de TVA occupent une ligne chacun : sans les compter,
    // l'encadré client débordait sur le tableau des lignes.
    (q.clientCountry && q.clientCountry !== "FR" ? 1 : 0) +
    (q.clientVatNumber ? 1 : 0) +
    (q.clientEmail ? 1 : 0) +
    (q.clientPhone ? 1 : 0);
  const FRAME_MM = 11; // marges intérieures + libellé « Client »
  return FRAME_MM + Math.max(1, lines) * LINE_MM;
}

// Hauteur d'en-tête effective : la valeur enregistrée, relevée quand la
// disposition demande davantage de place, pour que l'encadré client cesse de
// déborder sur le tableau des lignes.
export function headerHeightFor(q: QuoteData): number {
  const client = blockBox(q.branding, "client");
  return Math.max(q.branding.headerHeight, Math.ceil(client.y + clientBoxHeight(q) + 2));
}

// Lignes proposées en ajout rapide. Le prix indicatif reste modifiable.
export type LinePreset = { designation: string; detail: string; unitPrice?: number; unit?: string };

// Frais et options d'une vente de véhicule. Ce sont aussi les postes que la
// réglementation impose de présenter en lignes distinctes du prix du véhicule.
export const VEHICULE_PRESETS: LinePreset[] = [
  { designation: "Carte grise et taxes", detail: "Immatriculation, facturée au réel", unit: "forfait" },
  { designation: "Frais de dossier", detail: "", unitPrice: 390, unit: "forfait" },
  { designation: "Frais de mise à la route", detail: "Révision, nettoyage complet, plein", unitPrice: 290, unit: "forfait" },
  { designation: "Garantie 12 mois", detail: "Pièces et main d'œuvre", unitPrice: 690, unit: "forfait" },
  { designation: "Extension de garantie 24 mois", detail: "Pièces et main d'œuvre", unitPrice: 1290, unit: "forfait" },
  { designation: "Préparation esthétique", detail: "Polissage, traitement céramique", unitPrice: 490, unit: "forfait" },
  { designation: "Contrôle technique", detail: "Réalisé depuis moins de 6 mois", unitPrice: 90, unit: "forfait" },
  { designation: "Jeu de plaques d'immatriculation", detail: "Pose comprise", unitPrice: 60, unit: "forfait" },
  { designation: "Livraison à domicile", detail: "Camion porte-voitures", unit: "forfait" },
  { designation: "Convoyage par chauffeur", detail: "Trajet par la route", unit: "forfait" },
];

// Prestations proposées en ajout rapide (mode « Prestation »).
export const PRESTATION_PRESETS: LinePreset[] = [
  { designation: "Création de site internet vitrine", detail: "Conception, développement responsive, mise en ligne" },
  { designation: "Développement web sur-mesure", detail: "Application / fonctionnalités spécifiques" },
  { designation: "Intégration d'un outil / agent IA", detail: "Mise en place et intégration" },
  { designation: "Reprise / refonte de site existant", detail: "" },
  { designation: "Maintenance & support", detail: "Forfait mensuel", unit: "mois" },
  { designation: "Hébergement & nom de domaine", detail: "Forfait annuel", unit: "forfait" },
  { designation: "Rédaction de contenu / SEO", detail: "" },
];

// Bibliothèque affichée selon le type de devis.
export function presetsFor(kind: QuoteKind): LinePreset[] {
  return kind === "prestation" ? PRESTATION_PRESETS : VEHICULE_PRESETS;
}

// Désignation par défaut d'une ligne de reprise (montant en déduction).
export const REPRISE_DESIGNATION = "Reprise de votre véhicule";

// Personnalisation de l'en-tête : identité émetteur + réglages du logo.
export type Branding = {
  emitterName: string;
  emitterAddress: string; // multiligne
  emitterRepresentative: string;
  emitterEmail: string;
  emitterPhone: string;
  emitterSiret: string;
  emitterTva: string;
  // Coordonnées bancaires : une facture sans elles oblige le client à rappeler
  // pour savoir où payer.
  emitterIban: string;
  emitterBic: string;
  emitterBank: string;
  // Mention légale de pied de page, propre à l'émetteur.
  legalFootnote: string;
  // Logo du document. Chemin public ou adresse complète : c'est ce qui permet à
  // un revendeur d'imprimer ses devis sous sa propre marque.
  logoUrl: string;
  logoVisible: boolean;
  // Passe le logo en réserve blanche : indispensable sur le thème à bandeau,
  // où un logo sombre disparaît dans la couleur.
  logoWhite: boolean;
  logoAlign: LogoAlign;
  logoSize: number; // hauteur en mm
  // Position libre (mm depuis le coin haut-gauche de la page). null = placement auto via logoAlign.
  logoX: number | null;
  logoY: number | null;
  // Mise en page libre de l'en-tête : hauteur de la zone + position/largeur de chaque bloc (null = défaut).
  headerHeight: number;
  blocks: Record<HeaderBlockId, BlockBox | null>;
  // Apparence du document.
  accentColor: string; // #RRGGBB
  theme: DocTheme;
};

// Boîte effective d'un bloc (valeur enregistrée ou disposition automatique).
export function blockBox(b: Branding, id: HeaderBlockId): BlockBox {
  return b.blocks[id] ?? defaultBlockBox(b, id);
}

export function defaultBranding(): Branding {
  return {
    emitterName: COMPANY.legalName,
    emitterAddress: COMPANY.addressLines.filter(Boolean).join("\n"),
    emitterRepresentative: COMPANY.representative,
    emitterEmail: COMPANY.email,
    emitterPhone: COMPANY.phone,
    emitterSiret: COMPANY.siret,
    emitterTva: COMPANY.tvaNumber,
    emitterIban: "",
    emitterBic: "",
    emitterBank: "",
    legalFootnote: COMPANY.legalFootnote,
    logoUrl: COMPANY.logoSrc,
    logoVisible: true,
    logoWhite: false,
    logoAlign: "left",
    logoSize: 16,
    logoX: null,
    logoY: null,
    headerHeight: DEFAULT_HEADER_HEIGHT,
    blocks: { emitter: null, client: null, meta: null },
    accentColor: "#1E4FA3",
    theme: "classic",
  };
}

// Identité de documents portée par la marque blanche. Un champ laissé vide dans
// les réglages reprend la valeur de company.ts : le revendeur ne remplit que ce
// qui le concerne, et son devis sort à son nom dès le premier réglage.
export type BrandDocIdentity = {
  logoUrl?: string | null;
  docAccent?: string | null;
  docTheme?: string | null;
  emitterName?: string | null;
  emitterAddress?: string | null;
  emitterRepresentative?: string | null;
  emitterEmail?: string | null;
  emitterPhone?: string | null;
  emitterSiret?: string | null;
  emitterTva?: string | null;
  emitterIban?: string | null;
  emitterBic?: string | null;
  emitterBank?: string | null;
  legalFootnote?: string | null;
  accent?: string | null;
};

// Personnalisation d'un nouveau document, à partir des réglages de la marque.
// `layout` permet de conserver la mise en page (position des blocs, hauteur
// d'en-tête, taille du logo) travaillée sur un devis précédent.
export function brandingFromTheme(theme: BrandDocIdentity | null | undefined, layout?: Branding): Branding {
  const base = defaultBranding();
  const pick = (v: string | null | undefined, repli: string) => (v && v.trim() ? v.trim() : repli);
  const accent = pick(theme?.docAccent, pick(theme?.accent, base.accentColor));
  const themeDoc = theme?.docTheme === "colored" || theme?.docTheme === "minimal" ? theme.docTheme : "classic";
  return {
    ...base,
    // La mise en page se garde d'un devis à l'autre, l'identité vient des réglages.
    logoAlign: layout?.logoAlign ?? base.logoAlign,
    logoSize: layout?.logoSize ?? base.logoSize,
    logoX: layout?.logoX ?? base.logoX,
    logoY: layout?.logoY ?? base.logoY,
    logoVisible: layout?.logoVisible ?? base.logoVisible,
    logoWhite: layout?.logoWhite ?? base.logoWhite,
    headerHeight: layout?.headerHeight ?? base.headerHeight,
    blocks: layout?.blocks ?? base.blocks,

    logoUrl: pick(theme?.logoUrl, base.logoUrl),
    emitterName: pick(theme?.emitterName, base.emitterName),
    emitterAddress: pick(theme?.emitterAddress, base.emitterAddress),
    emitterRepresentative: pick(theme?.emitterRepresentative, base.emitterRepresentative),
    emitterEmail: pick(theme?.emitterEmail, base.emitterEmail),
    emitterPhone: pick(theme?.emitterPhone, base.emitterPhone),
    emitterSiret: pick(theme?.emitterSiret, base.emitterSiret),
    emitterTva: pick(theme?.emitterTva, base.emitterTva),
    emitterIban: pick(theme?.emitterIban, base.emitterIban),
    emitterBic: pick(theme?.emitterBic, base.emitterBic),
    emitterBank: pick(theme?.emitterBank, base.emitterBank),
    legalFootnote: pick(theme?.legalFootnote, base.legalFootnote),
    accentColor: accent,
    theme: themeDoc as DocTheme,
  };
}

// Complète n'importe quel objet partiel avec les valeurs par défaut (rétro-compat).
export function mergeBranding(raw: unknown): Branding {
  const base = defaultBranding();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
  const align = r.logoAlign === "center" || r.logoAlign === "right" || r.logoAlign === "left" ? (r.logoAlign as LogoAlign) : base.logoAlign;
  const size = typeof r.logoSize === "number" && r.logoSize > 0 ? r.logoSize : base.logoSize;
  const coord = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);
  const box = (v: unknown): BlockBox | null => {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    if (typeof o.x === "number" && typeof o.y === "number" && typeof o.w === "number") {
      return { x: o.x, y: o.y, w: o.w };
    }
    return null;
  };
  const rawBlocks = (r.blocks && typeof r.blocks === "object" ? r.blocks : {}) as Record<string, unknown>;
  const headerHeight = typeof r.headerHeight === "number" && r.headerHeight > 0 ? Math.min(180, Math.max(24, r.headerHeight)) : base.headerHeight;
  const accentColor = typeof r.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(r.accentColor) ? r.accentColor : base.accentColor;
  const theme: DocTheme = r.theme === "colored" || r.theme === "minimal" || r.theme === "classic" ? (r.theme as DocTheme) : base.theme;
  return {
    emitterName: str(r.emitterName, base.emitterName),
    emitterAddress: str(r.emitterAddress, base.emitterAddress),
    emitterRepresentative: str(r.emitterRepresentative, base.emitterRepresentative),
    emitterEmail: str(r.emitterEmail, base.emitterEmail),
    emitterPhone: str(r.emitterPhone, base.emitterPhone),
    emitterSiret: str(r.emitterSiret, base.emitterSiret),
    emitterTva: str(r.emitterTva, base.emitterTva),
    emitterIban: str(r.emitterIban, base.emitterIban),
    emitterBic: str(r.emitterBic, base.emitterBic),
    emitterBank: str(r.emitterBank, base.emitterBank),
    legalFootnote: str(r.legalFootnote, base.legalFootnote),
    logoUrl: str(r.logoUrl, base.logoUrl),
    logoWhite: typeof r.logoWhite === "boolean" ? r.logoWhite : base.logoWhite,
    logoVisible: typeof r.logoVisible === "boolean" ? r.logoVisible : base.logoVisible,
    logoAlign: align,
    logoSize: Math.min(40, Math.max(6, size)),
    logoX: coord(r.logoX),
    logoY: coord(r.logoY),
    headerHeight,
    blocks: {
      emitter: box(rawBlocks.emitter),
      client: box(rawBlocks.client),
      meta: box(rawBlocks.meta),
    },
    accentColor,
    theme,
  };
}

export type DiscountKind = "percent" | "amount";

export type QuoteItem = {
  id: string;
  designation: string;
  detail: string;
  qty: number;
  // Prix unitaire : HT en mode "tva20", TTC (prix de vente affiché) en "marge"/"exonere".
  unitPrice: number;
  unit?: string; // "" | forfait | jour | heure | mois | unité…
  discount?: number; // valeur de la remise (0 = aucune)
  discountKind?: DiscountKind; // percent (défaut) | amount
  vehicleId?: string;
};

export const UNIT_OPTIONS = ["", "forfait", "jour", "heure", "mois", "unité"] as const;

// ── Véhicule concerné ──
// Identité du véhicule telle qu'elle figure sur le document. Recopiée depuis la
// fiche du stock et le dossier d'immatriculation, puis FIGÉE : le devis de juin
// doit continuer d'afficher le kilométrage de juin, même si la voiture a roulé
// depuis, changé de plaque ou quitté le stock. C'est la règle déjà retenue pour
// les dossiers d'immatriculation, pour la même raison.
export type VehicleBlock = {
  show: boolean;
  label: string; // « BMW Série 3 320d — 2021 »
  vin: string; // numéro de série (17 caractères)
  plate: string; // immatriculation
  firstRegDate: string; // 1re mise en circulation, YYYY-MM-DD
  mileageKm: number;
  energy: string; // « Diesel · Automatique »
  color: string;
  origin: string; // provenance
  photoUrl: string;
};

export function emptyVehicleBlock(): VehicleBlock {
  return { show: false, label: "", vin: "", plate: "", firstRegDate: "", mileageKm: 0, energy: "", color: "", origin: "", photoUrl: "" };
}

export function mergeVehicleBlock(raw: unknown): VehicleBlock {
  const d = emptyVehicleBlock();
  if (!raw || typeof raw !== "object") return d;
  const v = raw as Record<string, unknown>;
  type TexteDuBloc = Exclude<keyof VehicleBlock, "show" | "mileageKm">;
  const str = (k: TexteDuBloc, max = 120) => (typeof v[k] === "string" ? (v[k] as string).slice(0, max) : d[k]);
  return {
    show: typeof v.show === "boolean" ? v.show : d.show,
    label: str("label"),
    // Un numéro de série s'écrit en capitales, sans espace : recopié d'un mail
    // ou d'une carte grise, il arrivait en minuscules et coupé par des espaces.
    vin: str("vin", 32).toUpperCase().replace(/\s+/g, ""),
    plate: str("plate", 16).toUpperCase().trim(),
    firstRegDate: str("firstRegDate", 10),
    mileageKm: typeof v.mileageKm === "number" && isFinite(v.mileageKm) ? Math.max(0, Math.round(v.mileageKm)) : d.mileageKm,
    energy: str("energy", 60),
    color: str("color", 40),
    origin: str("origin", 60),
    photoUrl: str("photoUrl", 400),
  };
}

// Vrai dès qu'une information mérite d'apparaître sur le document.
export function vehicleBlockFilled(v: VehicleBlock): boolean {
  return Boolean(v.label || v.vin || v.plate || v.firstRegDate || v.mileageKm > 0 || v.energy || v.color || v.origin || v.photoUrl);
}

// Numéro de série par groupes de lecture : 17 caractères d'affilée se
// recopient de travers, l'œil perd sa place.
export function formatVin(vin: string): string {
  const v = vin.replace(/\s+/g, "").toUpperCase();
  if (v.length < 12) return v;
  return `${v.slice(0, 3)} ${v.slice(3, 9)} ${v.slice(9)}`;
}

// ── Pays et TVA intracommunautaire ──
// Vendre une voiture à un professionnel belge sans TVA française suppose trois
// choses : que le client soit assujetti dans son pays, que son numéro de TVA
// soit valide, et que le véhicule quitte réellement la France. Le document doit
// porter la mention exacte, sinon l'administration requalifie et réclame la TVA
// au vendeur.

// États membres de l'Union, avec le format de leur numéro de TVA.
// Le préfixe vaut le code pays, sauf la Grèce (EL) et l'Irlande du Nord (XI).
export const EU_COUNTRIES: { code: string; name: string; vatPrefix: string; vatBody: RegExp }[] = [
  { code: "FR", name: "France", vatPrefix: "FR", vatBody: /^[0-9A-Z]{2}[0-9]{9}$/ },
  { code: "BE", name: "Belgique", vatPrefix: "BE", vatBody: /^[0-9]{10}$/ },
  { code: "LU", name: "Luxembourg", vatPrefix: "LU", vatBody: /^[0-9]{8}$/ },
  { code: "DE", name: "Allemagne", vatPrefix: "DE", vatBody: /^[0-9]{9}$/ },
  { code: "IT", name: "Italie", vatPrefix: "IT", vatBody: /^[0-9]{11}$/ },
  { code: "ES", name: "Espagne", vatPrefix: "ES", vatBody: /^[0-9A-Z][0-9]{7}[0-9A-Z]$/ },
  { code: "NL", name: "Pays-Bas", vatPrefix: "NL", vatBody: /^[0-9]{9}B[0-9]{2}$/ },
  { code: "PT", name: "Portugal", vatPrefix: "PT", vatBody: /^[0-9]{9}$/ },
  { code: "AT", name: "Autriche", vatPrefix: "AT", vatBody: /^U[0-9]{8}$/ },
  { code: "PL", name: "Pologne", vatPrefix: "PL", vatBody: /^[0-9]{10}$/ },
  { code: "IE", name: "Irlande", vatPrefix: "IE", vatBody: /^[0-9A-Z+*]{8,9}$/ },
  { code: "DK", name: "Danemark", vatPrefix: "DK", vatBody: /^[0-9]{8}$/ },
  { code: "SE", name: "Suède", vatPrefix: "SE", vatBody: /^[0-9]{12}$/ },
  { code: "FI", name: "Finlande", vatPrefix: "FI", vatBody: /^[0-9]{8}$/ },
  { code: "CZ", name: "Tchéquie", vatPrefix: "CZ", vatBody: /^[0-9]{8,10}$/ },
  { code: "SK", name: "Slovaquie", vatPrefix: "SK", vatBody: /^[0-9]{10}$/ },
  { code: "SI", name: "Slovénie", vatPrefix: "SI", vatBody: /^[0-9]{8}$/ },
  { code: "HU", name: "Hongrie", vatPrefix: "HU", vatBody: /^[0-9]{8}$/ },
  { code: "RO", name: "Roumanie", vatPrefix: "RO", vatBody: /^[0-9]{2,10}$/ },
  { code: "BG", name: "Bulgarie", vatPrefix: "BG", vatBody: /^[0-9]{9,10}$/ },
  { code: "GR", name: "Grèce", vatPrefix: "EL", vatBody: /^[0-9]{9}$/ },
  { code: "HR", name: "Croatie", vatPrefix: "HR", vatBody: /^[0-9]{11}$/ },
  { code: "LT", name: "Lituanie", vatPrefix: "LT", vatBody: /^([0-9]{9}|[0-9]{12})$/ },
  { code: "LV", name: "Lettonie", vatPrefix: "LV", vatBody: /^[0-9]{11}$/ },
  { code: "EE", name: "Estonie", vatPrefix: "EE", vatBody: /^[0-9]{9}$/ },
  { code: "CY", name: "Chypre", vatPrefix: "CY", vatBody: /^[0-9]{8}[A-Z]$/ },
  { code: "MT", name: "Malte", vatPrefix: "MT", vatBody: /^[0-9]{8}$/ },
];

export function countryName(code: string): string {
  return EU_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

// Noms anglais des États membres, pour le document remis à un client anglophone.
const COUNTRY_EN: Record<string, string> = {
  FR: "France", BE: "Belgium", LU: "Luxembourg", DE: "Germany", IT: "Italy",
  ES: "Spain", NL: "Netherlands", PT: "Portugal", AT: "Austria", PL: "Poland",
  IE: "Ireland", DK: "Denmark", SE: "Sweden", FI: "Finland", CZ: "Czechia",
  SK: "Slovakia", SI: "Slovenia", HU: "Hungary", RO: "Romania", BG: "Bulgaria",
  GR: "Greece", HR: "Croatia", LT: "Lithuania", LV: "Latvia", EE: "Estonia",
  CY: "Cyprus", MT: "Malta",
};

/** Nom du pays dans la langue du document. */
export function countryNameIn(lang: DocLang, code: string): string {
  if (lang === "en") return COUNTRY_EN[code] ?? code;
  return countryName(code);
}

export function isEuCountry(code: string): boolean {
  return EU_COUNTRIES.some((c) => c.code === code);
}

// Numéro de TVA nettoyé : capitales, sans espace ni point. Recopié d'un mail ou
// d'un en-tête de facture, il arrive en « BE 0123.456.749 ».
export function normalizeVat(raw: string): string {
  return String(raw ?? "").toUpperCase().replace(/[^0-9A-Z+*]/g, "");
}

/**
 * Ce qui empêche ce numéro de TVA d'être accepté, ou null s'il est plausible.
 * Contrôle de forme seulement : la validité réelle se vérifie auprès du service
 * européen VIES (voir /api/admin/tva-intracom).
 */
export function vatIssue(country: string, raw: string): string | null {
  const num = normalizeVat(raw);
  if (!num) return "Renseignez le numéro de TVA du client.";
  const pays = EU_COUNTRIES.find((c) => c.code === country);
  if (!pays) return "Choisissez un pays de l'Union européenne.";
  if (!num.startsWith(pays.vatPrefix)) {
    return `Un numéro ${pays.name} commence par ${pays.vatPrefix}.`;
  }
  if (!pays.vatBody.test(num.slice(pays.vatPrefix.length))) {
    return `Ce numéro ne correspond pas au format ${pays.name}.`;
  }
  return null;
}

// Numéro affiché sur le document : groupes de 4 après le préfixe pays, pour
// qu'un numéro à dix chiffres se relise et se recopie sans erreur.
export function formatVat(raw: string): string {
  const num = normalizeVat(raw);
  if (num.length < 5) return num;
  const prefix = num.slice(0, 2);
  const body = num.slice(2).replace(/(.{4})/g, "$1 ").trim();
  return `${prefix} ${body}`;
}

// ── Régime fiscal du document ──

export type FiscalRegime = {
  /** Mention obligatoire à imprimer sous le total. */
  mention: string;
  /** Sa traduction anglaise. Sur un document en anglais, les deux s'impriment :
   *  la version française reste celle qui fait foi. */
  mentionEn: string;
  /** Les montants du document s'entendent hors taxe. */
  htLabels: boolean;
  /** Le client doit déclarer la TVA chez lui. */
  reverseCharge: boolean;
  /** Ce qui bloque encore le régime choisi, à corriger avant d'envoyer. */
  blocking: string[];
  /** Avertissements à afficher au vendeur, sans bloquer. */
  warnings: string[];
};

export type FiscalInput = Pick<QuoteData, "tvaMode" | "clientCountry" | "clientVatNumber" | "clientCompany" | "issueDate" | "vehicle" | "kind">;

/**
 * Qualifie le régime de TVA du document : la phrase à imprimer, ce qui manque,
 * et les pièges. Un véhicule « neuf fiscalement » (moins de 6 mois OU moins de
 * 6 000 km) suit une règle à part : la TVA est due dans le pays de l'acheteur,
 * quel que soit son statut, y compris un particulier.
 */
export function fiscalRegime(q: FiscalInput): FiscalRegime {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const pays = q.clientCountry || "FR";
  const etranger = pays !== "FR" && isEuCountry(pays);

  // « Neuf fiscalement » : la même règle que les dossiers d'immatriculation,
  // jugée au jour près, en prenant la date d'émission comme référence.
  const vb = q.vehicle;
  const jour = /^\d{4}-\d{2}-\d{2}$/;
  const neufFiscal =
    q.kind === "vehicule" && jour.test(vb?.firstRegDate ?? "") && jour.test(q.issueDate) && vb.mileageKm > 0
      ? assessVat(vb.firstRegDate, vb.mileageKm, q.issueDate).regime === "neuf"
      : false;

  if (q.tvaMode === "intracom") {
    if (!etranger) {
      blocking.push("un client établi dans un autre État membre");
    }
    const souci = vatIssue(pays, q.clientVatNumber);
    if (souci) blocking.push("un numéro de TVA intracommunautaire valide");
    if (!q.clientCompany.trim()) {
      warnings.push("Une livraison intracommunautaire s'adresse à un professionnel : renseignez la raison sociale du client.");
    }
    warnings.push("Conservez la preuve que le véhicule a quitté la France (lettre de voiture, bon de livraison signé) et reportez la vente sur votre état récapitulatif.");
    return {
      mention: neufFiscal
        ? "Exonération de TVA — Moyen de transport neuf (art. 298 sexies du CGI). TVA due par l'acquéreur dans son État membre."
        : "Exonération de TVA — Livraison intracommunautaire (art. 262 ter I du CGI). Autoliquidation par le preneur.",
      mentionEn: neufFiscal
        ? "VAT exempt — New means of transport (Article 298 sexies of the French Tax Code). VAT payable by the purchaser in their own Member State."
        : "VAT exempt — Intra-Community supply (Article 262 ter I of the French Tax Code). Reverse charge applies to the customer.",
      htLabels: true,
      reverseCharge: true,
      blocking,
      warnings,
    };
  }

  if (q.tvaMode === "marge") {
    // Piège classique : le régime de la marge s'applique aux biens d'occasion.
    // Un véhicule neuf fiscalement en sort, la TVA est alors due sur le prix total.
    if (neufFiscal) {
      warnings.push("Ce véhicule est neuf fiscalement (moins de 6 mois ou moins de 6 000 km) : le régime de la marge ne s'y applique pas. Passez en TVA 20 %, ou en livraison intracommunautaire si l'acheteur est établi dans un autre État membre.");
    }
    if (etranger) {
      warnings.push(`Client ${countryName(pays)} : le régime de la marge exclut l'exonération intracommunautaire. La vente reste taxée en France sur la marge.`);
    }
    return {
      mention: "TVA sur marge — non récupérable (art. 297 A du CGI).",
      mentionEn: "Second-hand margin scheme — VAT not recoverable (Article 297 A of the French Tax Code).",
      htLabels: false,
      reverseCharge: false,
      blocking,
      warnings,
    };
  }

  if (q.tvaMode === "exonere") {
    if (etranger) {
      warnings.push(`Client ${countryName(pays)} : pour une exonération intracommunautaire en règle, choisissez « Livraison intracommunautaire ». « Exonéré » n'imprime aucune base légale.`);
    }
    return { mention: "Opération exonérée de TVA.", mentionEn: "Transaction exempt from VAT.", htLabels: false, reverseCharge: false, blocking, warnings };
  }

  // TVA 20 % : régime de droit commun.
  if (etranger) {
    warnings.push(`Client ${countryName(pays)} : si le véhicule quitte la France et que l'acheteur est assujetti, la vente s'exonère en livraison intracommunautaire.`);
  }
  return { mention: "", mentionEn: "", htLabels: true, reverseCharge: false, blocking, warnings };
}

export type QuoteData = {
  id?: string;
  number: string;
  kind: QuoteKind;
  status: QuoteStatus;
  docType: DocType;
  factureKind: FactureKind;
  paymentStatus: PaymentStatus;
  paidDate: string;
  sourceQuoteId?: string | null;
  // Numéro du document d'origine (facture créditée par un avoir). Servi pour
  // l'affichage seulement : il se lit sur l'autre ligne, il ne se recopie pas.
  sourceNumber?: string;
  clientId?: string | null; // lien CRM optionnel
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  // Pays du client (code à deux lettres) et numéro de TVA intracommunautaire :
  // ce qui décide si la vente peut sortir sans TVA française.
  clientCountry: string;
  clientVatNumber: string;
  // Langue du document remis au client (le back-office reste en français).
  docLang: DocLang;
  issueDate: string; // YYYY-MM-DD
  // Devis : durée de validité. Facture : délai de règlement, en jours.
  validityDays: number;
  items: QuoteItem[];
  tvaMode: TvaMode;
  tvaRate: number;
  depositMode: DepositMode;
  depositValue: number;
  paymentTerms: string;
  notes: string;
  vehicleId?: string | null;
  // Identité du véhicule imprimée sur le document, figée au devis.
  vehicle: VehicleBlock;
  branding: Branding;
};

// Ce qui manque à un devis pour pouvoir partir chez un client. Enregistrer un
// brouillon incomplet reste permis, c'est le travail en cours ; l'envoyer ou le
// facturer, non. Un devis vide à 0 € s'imprimait et se facturait sans un mot.
export function quoteIssues(
  q: Pick<QuoteData, "clientName" | "clientCompany" | "items" | "tvaMode" | "tvaRate" | "depositMode" | "depositValue"> &
    Partial<Pick<QuoteData, "clientCountry" | "clientVatNumber" | "issueDate" | "vehicle" | "kind">>,
): string[] {
  const manques: string[] = [];
  if (!q.clientName.trim() && !q.clientCompany.trim()) manques.push("le client");
  const lignes = q.items.filter((it) => it.designation.trim() !== "");
  if (lignes.length === 0) manques.push("au moins une ligne");
  else if (computeTotals(q).totalTTC <= 0) manques.push("un montant");
  // Une exonération intracommunautaire sans numéro de TVA valide se retourne
  // contre le vendeur : l'administration réclame la TVA française.
  if (q.tvaMode === "intracom") {
    manques.push(
      ...fiscalRegime({
        tvaMode: q.tvaMode,
        clientCountry: q.clientCountry ?? "FR",
        clientVatNumber: q.clientVatNumber ?? "",
        clientCompany: q.clientCompany,
        issueDate: q.issueDate ?? "",
        vehicle: q.vehicle ?? emptyVehicleBlock(),
        kind: q.kind ?? "vehicule",
      }).blocking,
    );
  }
  return manques;
}

// Formulation prête à afficher : « le client et au moins une ligne ».
export function issuesLabel(manques: readonly string[]): string {
  if (manques.length === 0) return "";
  if (manques.length === 1) return manques[0];
  return `${manques.slice(0, -1).join(", ")} et ${manques[manques.length - 1]}`;
}

export type QuoteTotals = {
  lineCount: number;
  discountTotal: number; // somme des remises de ligne
  subtotal: number; // somme qty × prix unitaire (HT en tva20, TTC sinon)
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
  deposit: number;
  // Acompte exprimé hors taxe, tel que la facture d'acompte le portera. Sans
  // lui, la route de facturation reconvertissait le TTC en HT de son côté et la
  // somme acompte + solde s'écartait du devis d'un centime.
  depositHT: number;
  balance: number;
  // Vrai quand le document détaille HT + TVA + TTC (régime de droit commun).
  showTva: boolean;
  // Vrai quand les montants s'entendent hors taxe, TVA détaillée ou pas :
  // couvre la livraison intracommunautaire, où la TVA est due chez l'acheteur.
  htLabels: boolean;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Total brut d'une ligne (avant remise).
export function lineGross(item: QuoteItem): number {
  return round2((Number(item.qty) || 0) * (Number(item.unitPrice) || 0));
}

// Montant de la remise appliquée à une ligne.
// Une ligne en déduction (reprise) ne porte pas de remise : la remise en
// pourcentage d'un montant négatif produirait une réduction négative.
export function lineDiscount(item: QuoteItem): number {
  const d = Number(item.discount) || 0;
  if (d <= 0) return 0;
  const gross = lineGross(item);
  if (gross <= 0) return 0;
  const amount = item.discountKind === "amount" ? d : gross * (d / 100);
  return round2(Math.min(gross, Math.max(0, amount)));
}

// Total net d'une ligne (après remise).
// Un total négatif est conservé tel quel : c'est une reprise, qui vient en
// déduction du devis. Le plancher à zéro reste sur les lignes positives, pour
// qu'une remise supérieure au montant ne fasse jamais basculer une vente.
export function lineTotal(item: QuoteItem): number {
  const gross = lineGross(item);
  if (gross < 0) return round2(gross);
  return round2(Math.max(0, gross - lineDiscount(item)));
}

export function computeTotals(q: Pick<QuoteData, "items" | "tvaMode" | "tvaRate" | "depositMode" | "depositValue">): QuoteTotals {
  const subtotal = round2(q.items.reduce((s, it) => s + lineTotal(it), 0));
  const showTva = q.tvaMode === "tva20";
  // En livraison intracommunautaire, aucune TVA française n'apparaît, mais les
  // montants sont bien hors taxe : c'est l'acheteur qui la déclare chez lui.
  const htLabels = showTva || q.tvaMode === "intracom";

  let totalHT: number, tvaAmount: number, totalTTC: number;
  if (showTva) {
    totalHT = subtotal;
    tvaAmount = round2(subtotal * (Number(q.tvaRate) || 0) / 100);
    totalTTC = round2(totalHT + tvaAmount);
  } else {
    // "marge" et "exonéré" : le prix saisi est le prix de vente final, pas de ligne TVA.
    totalHT = subtotal;
    tvaAmount = 0;
    totalTTC = subtotal;
  }

  // L'acompte reste borné entre 0 et le total : un montant fixe saisi au-dessus
  // du prix du véhicule imprimait jusqu'ici un solde négatif sur le document.
  let rawDeposit = 0;
  if (q.depositMode === "percent") rawDeposit = totalTTC * (Number(q.depositValue) || 0) / 100;
  else if (q.depositMode === "amount") rawDeposit = Number(q.depositValue) || 0;
  let deposit = round2(Math.min(Math.max(0, rawDeposit), Math.max(0, totalTTC)));
  // En TVA 20 %, l'acompte se pose d'abord en HT puis se recompose en TTC :
  // c'est le seul moyen que la facture d'acompte et la facture de solde
  // retombent exactement sur le total du devis.
  const rate = showTva ? (Number(q.tvaRate) || 0) / 100 : 0;
  const depositHT = showTva ? round2(deposit / (1 + rate)) : deposit;
  if (showTva) deposit = round2(depositHT * (1 + rate));
  const balance = round2(totalTTC - deposit);

  return {
    lineCount: q.items.length,
    discountTotal: round2(q.items.reduce((s, it) => s + lineDiscount(it), 0)),
    subtotal,
    totalHT,
    tvaAmount,
    totalTTC,
    deposit,
    depositHT,
    balance,
    showTva,
    htLabels,
  };
}

// Mise en forme monétaire : espace VISIBLE entre milliers + 2 décimales (cohérent avec format.ts).
export function formatEuro(n: number): string {
  return (
    (Number(n) || 0)
      .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/[  \s]/g, " ") + " €"
  );
}

export const TVA_MODE_LABEL: Record<TvaMode, string> = {
  marge: "TVA sur marge (art. 297 A du CGI)",
  tva20: "TVA 20 %",
  exonere: "Exonéré de TVA",
  intracom: "Livraison intracommunautaire (autoliquidation)",
};

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
};

// Titre du document A4 selon le type.
export function docTitle(docType: DocType, factureKind: FactureKind): string {
  if (docType === "devis") return "DEVIS";
  if (docType === "avoir") return "AVOIR";
  if (factureKind === "acompte") return "FACTURE D'ACOMPTE";
  if (factureKind === "solde") return "FACTURE DE SOLDE";
  return "FACTURE";
}

export const FACTURE_KIND_LABEL: Record<FactureKind, string> = {
  complete: "Facture",
  acompte: "Facture d'acompte",
  solde: "Facture de solde",
};

// ── Le document en français ou en anglais ──
// Vendre à un acheteur néerlandophone ou anglophone suppose un document qu'il
// lise. Seule la feuille remise au client bascule : le back-office reste en
// français. Les montants gardent le format français (« 15 490,00 € ») : c'est
// un document français, et deux formats de nombre sur un même dossier
// s'annulent en confusion.
export type DocTexts = ReturnType<typeof docTexts>;

export function docTexts(lang: DocLang) {
  if (lang === "en") {
    return {
      devis: "QUOTATION", facture: "INVOICE", avoir: "CREDIT NOTE",
      acompteSuffix: "DEPOSIT", soldeSuffix: "BALANCE",
      number: "No.", date: "Date", validity: "Valid until", dueDate: "Due date",
      onInvoice: "Against invoice",
      client: "Customer", clientPlaceholder: "Customer details…",
      paid: "PAID",
      vehicle: "Vehicle concerned",
      vin: "Chassis number", plate: "Registration", firstReg: "First registered",
      mileage: "Mileage", energy: "Fuel", colour: "Colour", origin: "Imported from",
      designation: "Description", qty: "Qty", unitPrice: "Unit price", unitPriceHT: "Unit price excl. VAT",
      lineTotal: "Amount", lineTotalHT: "Amount excl. VAT",
      emptyLines: "Add a line (vehicle from stock, fees, or free text)…",
      discount: "Discount",
      totalHT: "Total excl. VAT", vat: "VAT", vatFrance: "French VAT",
      totalTTC: "Total incl. VAT", total: "Total",
      netToPay: "Amount payable", balanceToPay: "Balance payable", creditAmount: "Credit note amount",
      depositPercent: "Deposit", depositToPay: "Deposit payable",
      remaining: "Remaining due", balanceOnDelivery: "Balance on delivery",
      depositInvoiced: "Deposit already invoiced",
      conditions: "Terms", reason: "Reason", payment: "Payment", notes: "Notes",
      lateMention:
        "After the due date, any late payment incurs interest at the statutory rate increased as provided by law, together with a fixed recovery indemnity of €40 (Articles L441-10 and D441-5 of the French Commercial Code). No discount for early payment.",
      creditNote: "Amount to be deducted from your payment, or refunded if the invoice has already been settled.",
      signatureFor: "For", agreement: "Approved — Customer", signatureHint: "Date, signature and stamp",
      emitter: "Issuer", legal: "Legal notices",
      siret: "Company no.", vatNo: "VAT no.", iban: "IBAN", bic: "BIC",
    };
  }
  return {
    devis: "DEVIS", facture: "FACTURE", avoir: "AVOIR",
    acompteSuffix: "D'ACOMPTE", soldeSuffix: "DE SOLDE",
    number: "N°", date: "Date", validity: "Validité", dueDate: "Échéance",
    onInvoice: "Sur facture",
    client: "Client", clientPlaceholder: "Coordonnées du client…",
    paid: "PAYÉE",
    vehicle: "Véhicule concerné",
    vin: "N° de série", plate: "Immatriculation", firstReg: "1re mise en circulation",
    mileage: "Kilométrage", energy: "Énergie", colour: "Couleur", origin: "Provenance",
    designation: "Désignation", qty: "Qté", unitPrice: "P.U.", unitPriceHT: "P.U. HT",
    lineTotal: "Total", lineTotalHT: "Total HT",
    emptyLines: "Ajoutez une ligne (véhicule du stock, frais, ou ligne libre)…",
    discount: "Remise",
    totalHT: "Total HT", vat: "TVA", vatFrance: "TVA française",
    totalTTC: "Total TTC", total: "Total",
    netToPay: "Net à payer", balanceToPay: "Solde à payer", creditAmount: "Montant de l'avoir",
    depositPercent: "Acompte", depositToPay: "Acompte à verser",
    remaining: "Reste dû", balanceOnDelivery: "Solde à la livraison",
    depositInvoiced: "Acompte déjà facturé",
    conditions: "Conditions", reason: "Motif", payment: "Règlement", notes: "Notes",
    lateMention:
      "Passé la date d'échéance, tout règlement en retard donne lieu à des pénalités calculées au taux d'intérêt légal majoré, ainsi qu'à une indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce). Escompte pour paiement anticipé : néant.",
    creditNote: "Montant à déduire de votre règlement, ou remboursé si la facture est déjà réglée.",
    signatureFor: "Pour", agreement: "Bon pour accord — Le client", signatureHint: "Date, signature et cachet",
    emitter: "Émetteur", legal: "Mentions",
    siret: "SIRET", vatNo: "TVA", iban: "IBAN", bic: "BIC",
  };
}

/** Titre du document dans la langue choisie. */
export function docTitleIn(lang: DocLang, docType: DocType, factureKind: FactureKind): string {
  const t = docTexts(lang);
  if (docType === "devis") return t.devis;
  if (docType === "avoir") return t.avoir;
  if (factureKind === "acompte") return `${t.facture} ${t.acompteSuffix}`;
  if (factureKind === "solde") return `${t.facture} ${t.soldeSuffix}`;
  return t.facture;
}

// Numéro suivant d'une série annuelle, calculé sur le plus GRAND numéro déjà
// attribué et jamais sur un comptage : supprimer un document faisait redescendre
// le compteur et le numéro proposé entrait en collision avec un numéro existant.
export function nextNumber(prefix: string, existing: readonly string[]): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}(\\d+)$`);
  let max = 0;
  for (const n of existing) {
    const m = re.exec((n || "").trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

// Préfixes des trois séries annuelles.
export const quotePrefix = (year: number) => `${year}-`;
export const facturePrefix = (year: number) => `FAC-${year}-`;
// Les avoirs tiennent leur propre série continue : mélangés aux factures, ils
// créaient des trous dans la numérotation, ce que la comptabilité refuse.
export const avoirPrefix = (year: number) => `AV-${year}-`;

// Numéro de facture continu par année : FAC-2026-001.
export function factureNumber(year: number, existing: readonly string[]): string {
  return nextNumber(facturePrefix(year), existing);
}

// Numéro d'avoir continu par année : AV-2026-001.
export function avoirNumber(year: number, existing: readonly string[]): string {
  return nextNumber(avoirPrefix(year), existing);
}

// ── Avoirs rattachés aux factures ──

export type AvoirLike = {
  sourceQuoteId: string | null;
  items: string; // JSON des lignes, tel qu'il est stocké
  tvaMode: string;
  tvaRate: number;
  depositMode: string;
  depositValue: number;
};

/**
 * Montant crédité par facture. Une facture créditée en totalité cesse d'être une
 * créance : elle sort de l'encours impayé et du centre de relances, sinon on
 * réclame de l'argent sur une facture qu'on a soi-même annulée.
 */
export function creditsByInvoice(avoirs: readonly AvoirLike[]): Map<string, number> {
  const par = new Map<string, number>();
  for (const a of avoirs) {
    if (!a.sourceQuoteId) continue;
    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(a.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* un avoir abîmé compte pour zéro plutôt que de casser la page */
    }
    const montant = computeTotals({
      items,
      tvaMode: a.tvaMode as TvaMode,
      tvaRate: a.tvaRate,
      depositMode: a.depositMode as DepositMode,
      depositValue: a.depositValue,
    }).totalTTC;
    par.set(a.sourceQuoteId, round2((par.get(a.sourceQuoteId) ?? 0) + montant));
  }
  return par;
}

/** Reste dû sur une facture, une fois les avoirs déduits. Jamais négatif. */
export function remainingDue(facture: number, credite: number): number {
  return Math.max(0, round2(facture - credite));
}

// Date YYYY-MM-DD -> "11 juin 2026"
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function formatDateFr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || "").trim());
  if (!m) return iso || "";
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} ${MONTHS[parseInt(mo, 10) - 1]} ${y}`;
}

/** Date dans la langue du document : « 11 juin 2026 » ou « 11 June 2026 ». */
export function formatDateIn(lang: DocLang, iso: string): string {
  if (lang === "fr") return formatDateFr(iso);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || "").trim());
  if (!m) return iso || "";
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} ${MONTHS_EN[parseInt(mo, 10) - 1]} ${y}`;
}

// Ajoute N jours à une date ISO et renvoie "11 juin 2026".
export function validUntilFr(issueDate: string, days: number): string {
  return validUntilIn("fr", issueDate, days);
}

/** Échéance dans la langue du document. */
export function validUntilIn(lang: DocLang, issueDate: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((issueDate || "").trim());
  if (!m) return "";
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  dt.setUTCDate(dt.getUTCDate() + (Number(days) || 0));
  return formatDateIn(lang, dt.toISOString().slice(0, 10));
}

// Valeurs par défaut dépendant du type de devis.
export function kindDefaults(kind: QuoteKind): { tvaMode: TvaMode; paymentTerms: string } {
  if (kind === "prestation") {
    return {
      tvaMode: "tva20",
      paymentTerms: "Acompte de 30 % à la commande, solde à la livraison du projet.",
    };
  }
  return {
    tvaMode: "marge",
    paymentTerms: "Acompte à la commande, solde à la livraison du véhicule.",
  };
}

export function emptyQuote(number: string, issueDate: string, branding?: Branding, kind: QuoteKind = "vehicule"): QuoteData {
  const d = kindDefaults(kind);
  return {
    number,
    kind,
    status: "brouillon",
    docType: "devis",
    factureKind: "complete",
    paymentStatus: "impayee",
    paidDate: "",
    sourceQuoteId: null,
    clientId: null,
    clientName: "",
    clientCompany: "",
    clientAddress: "",
    clientEmail: "",
    clientPhone: "",
    clientCountry: "FR",
    clientVatNumber: "",
    docLang: "fr",
    issueDate,
    validityDays: 30,
    items: [],
    tvaMode: d.tvaMode,
    tvaRate: 20,
    depositMode: "percent",
    depositValue: 30,
    paymentTerms: d.paymentTerms,
    notes: "",
    vehicleId: null,
    vehicle: emptyVehicleBlock(),
    branding: branding ?? defaultBranding(),
  };
}
