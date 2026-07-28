// Types et calculs partagés du devis (module neutre : importable côté serveur ET client).
// Aucune dépendance React/Next ici.
import { COMPANY } from "./company";

export type TvaMode = "marge" | "tva20" | "exonere";
export type DepositMode = "percent" | "amount" | "none";
export const QUOTE_STATUSES = ["brouillon", "envoye", "accepte", "refuse"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type DocType = "devis" | "facture";
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
type ClientLines = Pick<QuoteData, "clientName" | "clientCompany" | "clientAddress" | "clientEmail" | "clientPhone">;
function clientBoxHeight(q: ClientLines): number {
  const lines =
    (q.clientCompany ? 1 : 0) +
    (q.clientName ? 1 : 0) +
    q.clientAddress.split("\n").map((l) => l.trim()).filter(Boolean).length +
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
  clientId?: string | null; // lien CRM optionnel
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
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
  branding: Branding;
};

export type QuoteTotals = {
  lineCount: number;
  discountTotal: number; // somme des remises de ligne
  subtotal: number; // somme qty × prix unitaire (HT en tva20, TTC sinon)
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
  deposit: number;
  balance: number;
  showTva: boolean;
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
  const deposit = round2(Math.min(Math.max(0, rawDeposit), Math.max(0, totalTTC)));
  const balance = round2(totalTTC - deposit);

  return {
    lineCount: q.items.length,
    discountTotal: round2(q.items.reduce((s, it) => s + lineDiscount(it), 0)),
    subtotal,
    totalHT,
    tvaAmount,
    totalTTC,
    deposit,
    balance,
    showTva,
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
  if (factureKind === "acompte") return "FACTURE D'ACOMPTE";
  if (factureKind === "solde") return "FACTURE DE SOLDE";
  return "FACTURE";
}

export const FACTURE_KIND_LABEL: Record<FactureKind, string> = {
  complete: "Facture",
  acompte: "Facture d'acompte",
  solde: "Facture de solde",
};

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

// Préfixes des deux séries annuelles.
export const quotePrefix = (year: number) => `${year}-`;
export const facturePrefix = (year: number) => `FAC-${year}-`;

// Numéro de facture continu par année : FAC-2026-001.
export function factureNumber(year: number, existing: readonly string[]): string {
  return nextNumber(facturePrefix(year), existing);
}

// Date YYYY-MM-DD -> "11 juin 2026"
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function formatDateFr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || "").trim());
  if (!m) return iso || "";
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} ${MONTHS[parseInt(mo, 10) - 1]} ${y}`;
}

// Ajoute N jours à une date ISO et renvoie "11 juin 2026".
export function validUntilFr(issueDate: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((issueDate || "").trim());
  if (!m) return "";
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  dt.setUTCDate(dt.getUTCDate() + (Number(days) || 0));
  const iso = dt.toISOString().slice(0, 10);
  return formatDateFr(iso);
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
    branding: branding ?? defaultBranding(),
  };
}
