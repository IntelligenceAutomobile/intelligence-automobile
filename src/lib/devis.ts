// Types et calculs partagés du devis (module neutre : importable côté serveur ET client).
// Aucune dépendance React/Next ici.
import { COMPANY } from "./company";

export type TvaMode = "marge" | "tva20" | "exonere";
export type DepositMode = "percent" | "amount" | "none";
export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse";
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
export const DEFAULT_BLOCK_BOX: Record<HeaderBlockId, BlockBox> = {
  emitter: { x: 0, y: 22, w: 95 },
  meta: { x: 108, y: 22, w: 70 },
  client: { x: 0, y: 48, w: 95 },
};
export const DEFAULT_HEADER_HEIGHT = 74; // mm

// Prestations proposées en ajout rapide (mode « Prestation »).
export const PRESTATION_PRESETS: { designation: string; detail: string }[] = [
  { designation: "Création de site internet vitrine", detail: "Conception, développement responsive, mise en ligne" },
  { designation: "Développement web sur-mesure", detail: "Application / fonctionnalités spécifiques" },
  { designation: "Intégration d'un outil / agent IA", detail: "Mise en place et intégration" },
  { designation: "Reprise / refonte de site existant", detail: "" },
  { designation: "Maintenance & support", detail: "Forfait mensuel" },
  { designation: "Hébergement & nom de domaine", detail: "Forfait annuel" },
  { designation: "Rédaction de contenu / SEO", detail: "" },
];

// Personnalisation de l'en-tête : identité émetteur + réglages du logo.
export type Branding = {
  emitterName: string;
  emitterAddress: string; // multiligne
  emitterRepresentative: string;
  emitterEmail: string;
  emitterPhone: string;
  emitterSiret: string;
  emitterTva: string;
  logoVisible: boolean;
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

// Boîte effective d'un bloc (valeur enregistrée ou défaut).
export function blockBox(b: Branding, id: HeaderBlockId): BlockBox {
  return b.blocks[id] ?? DEFAULT_BLOCK_BOX[id];
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
    logoVisible: true,
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
  clientId?: string | null; // lien CRM optionnel
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  issueDate: string; // YYYY-MM-DD
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
export function lineDiscount(item: QuoteItem): number {
  const d = Number(item.discount) || 0;
  if (d <= 0) return 0;
  const gross = lineGross(item);
  const amount = item.discountKind === "amount" ? d : gross * (d / 100);
  return round2(Math.min(gross, Math.max(0, amount)));
}

// Total net d'une ligne (après remise).
export function lineTotal(item: QuoteItem): number {
  return round2(Math.max(0, lineGross(item) - lineDiscount(item)));
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

  let deposit = 0;
  if (q.depositMode === "percent") deposit = round2(totalTTC * (Number(q.depositValue) || 0) / 100);
  else if (q.depositMode === "amount") deposit = round2(Number(q.depositValue) || 0);
  const balance = round2(totalTTC - deposit);

  return {
    lineCount: q.items.length,
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
