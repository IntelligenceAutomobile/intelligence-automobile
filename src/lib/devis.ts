// Types et calculs partagés du devis (module neutre : importable côté serveur ET client).
// Aucune dépendance React/Next ici.

export type TvaMode = "marge" | "tva20" | "exonere";
export type DepositMode = "percent" | "amount" | "none";
export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse";

export type QuoteItem = {
  id: string;
  designation: string;
  detail: string;
  qty: number;
  // Prix unitaire : HT en mode "tva20", TTC (prix de vente affiché) en "marge"/"exonere".
  unitPrice: number;
  vehicleId?: string;
};

export type QuoteData = {
  id?: string;
  number: string;
  status: QuoteStatus;
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

export function lineTotal(item: QuoteItem): number {
  return round2((Number(item.qty) || 0) * (Number(item.unitPrice) || 0));
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

export function emptyQuote(number: string, issueDate: string): QuoteData {
  return {
    number,
    status: "brouillon",
    clientName: "",
    clientCompany: "",
    clientAddress: "",
    clientEmail: "",
    clientPhone: "",
    issueDate,
    validityDays: 30,
    items: [],
    tvaMode: "marge",
    tvaRate: 20,
    depositMode: "percent",
    depositValue: 30,
    paymentTerms: "Acompte à la commande, solde à la livraison du véhicule.",
    notes: "",
    vehicleId: null,
  };
}
