// Types, constantes et calculs du module « Comptes associés ».
// Module neutre (pas de dépendance React/Prisma) : importable côté serveur ET client.
import { formatNumber } from "./format";
import { formatEuro, formatDateFr } from "./devis";

/* ── Les deux associés ── */
export const PARTNERS = ["César", "Fab"] as const;
export type Partner = (typeof PARTNERS)[number];

export function isPartner(v: unknown): v is Partner {
  return v === "César" || v === "Fab";
}

export function otherPartner(p: Partner): Partner {
  return p === "César" ? "Fab" : "César";
}

// Couleurs d'identité (réutilisées pour les badges « payé par » et la barre du solde).
export const PARTNER_COLOR: Record<Partner, string> = {
  "César": "#6B9FEE",
  "Fab": "#A78BFA",
};

/* ── Bénéficiaire d'une écriture ── */
// "commun" = dépense partagée ; un prénom = dépense/avance au bénéfice de cette personne.
export type Scope = "commun" | Partner;

export function isScope(v: unknown): v is Scope {
  return v === "commun" || isPartner(v);
}

/* ── Catégories (chips colorées) ── */
export type Category = { id: string; label: string; color: string };

export const CATEGORIES: Category[] = [
  { id: "abonnement",    label: "Abonnements / logiciels", color: "#A78BFA" },
  { id: "api",           label: "API & IA",                color: "#6B9FEE" },
  { id: "salaire",       label: "Salaire / avance",        color: "#F0A55A" },
  { id: "vehicule",      label: "Véhicules",               color: "#4EB87B" },
  { id: "apport",        label: "Apport",                  color: "#4ED1A1" },
  { id: "remboursement", label: "Remboursement",           color: "#8BB8F5" },
  { id: "bancaire",      label: "Frais bancaires",         color: "#E5635A" },
  { id: "autre",         label: "Autre",                   color: "#C8D8EE" },
];

const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export function category(id: string): Category {
  return CATEGORY_BY_ID[id] ?? { id: "autre", label: "Autre", color: "#C8D8EE" };
}

// Catégorie utilisée par le bouton « Régler les comptes ».
export const SETTLE_CATEGORY = "remboursement";

// Libellés récurrents proposés en autocomplétion (saisie rapide).
export const LABEL_SUGGESTIONS = [
  "Claude Code",
  "API Anthropic",
  "API OpenAI",
  "Abonnement Vercel",
  "Nom de domaine",
  "Base de données Turso",
  "Resend (emails)",
  "Avance sur salaire",
  "Frais bancaires",
  "Carte grise",
  "Transport véhicule",
];

/* ── L'écriture (objet applicatif ; montant en centimes) ── */
export type LedgerEntry = {
  id: string;
  date: string;        // YYYY-MM-DD
  label: string;
  category: string;
  amountCents: number;
  paidBy: Partner;
  scope: Scope;
  share: number;       // 0..100 : part du payeur quand scope = "commun"
  note: string;
  createdAt?: string;
  updatedAt?: string;
};

function clampShare(n: unknown): number {
  if (n === null || n === undefined || n === "") return 50;
  const v = Math.round(Number(n));
  if (!isFinite(v)) return 50;
  return Math.min(100, Math.max(0, v));
}

/* ── Cœur du calcul : effet d'une écriture sur le solde ── */
// Montant (centimes) que l'AUTRE associé doit au payeur du fait de cette écriture.
//  - commun         : l'autre doit la part qu'il n'a pas supportée.
//  - perso (payeur) : aucun effet (dépense purement personnelle, simplement journalisée).
//  - avance/transfert (l'autre) : l'autre doit la totalité.
export function otherOwesPayer(
  e: Pick<LedgerEntry, "amountCents" | "scope" | "paidBy" | "share">,
): number {
  const amount = Math.max(0, Math.round(Number(e.amountCents) || 0));
  if (amount === 0) return 0;
  if (e.scope === "commun") {
    return Math.round((amount * (100 - clampShare(e.share))) / 100);
  }
  return e.scope === e.paidBy ? 0 : amount;
}

export type Balance = {
  // delta (centimes) : > 0 → Fab doit à César ; < 0 → César doit à Fab ; 0 → équilibré.
  delta: number;
  settled: boolean;
  debtor: Partner | null;
  creditor: Partner | null;
  amountCents: number;                 // montant dû (>= 0)
  disbursed: Record<Partner, number>;  // total déboursé par chacun (centimes)
};

export function computeBalance(entries: LedgerEntry[]): Balance {
  let delta = 0; // (+) en faveur de César
  const disbursed: Record<Partner, number> = { "César": 0, "Fab": 0 };

  for (const e of entries) {
    const amount = Math.max(0, Math.round(Number(e.amountCents) || 0));
    if (isPartner(e.paidBy)) disbursed[e.paidBy] += amount;

    const x = otherOwesPayer(e);
    if (x === 0) continue;
    if (e.paidBy === "César") delta += x;      // Fab doit à César
    else if (e.paidBy === "Fab") delta -= x;   // César doit à Fab
  }

  const amountCents = Math.abs(delta);
  const settled = amountCents === 0;
  return {
    delta,
    settled,
    debtor: settled ? null : delta > 0 ? "Fab" : "César",
    creditor: settled ? null : delta > 0 ? "César" : "Fab",
    amountCents,
    disbursed,
  };
}

/* ── Mise en forme ── */
// Centimes -> "1 240 €" (montant rond) ou "14,50 €" (avec décimales). Espace milliers visible.
export function formatEuroCents(cents: number): string {
  const c = Math.round(Number(cents) || 0);
  const euros = c / 100;
  return c % 100 === 0 ? `${formatNumber(euros)} €` : formatEuro(euros);
}

// "14,50" / "14.50" / "1 490" / "1.490,50" / "29 €" -> centimes. null si invalide.
// Le dernier séparateur suivi de 1 à 2 chiffres est traité comme la décimale ;
// les autres points/virgules sont des séparateurs de milliers et sont retirés.
export function parseAmountToCents(input: string): number | null {
  let s = (input || "").replace(/[^0-9.,]/g, "");
  if (s === "") return null;
  const lastSep = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  const decimals = lastSep >= 0 ? s.length - lastSep - 1 : -1;
  if (decimals >= 1 && decimals <= 2) {
    s = `${s.slice(0, lastSep).replace(/[.,]/g, "")}.${s.slice(lastSep + 1)}`;
  } else {
    s = s.replace(/[.,]/g, "");
  }
  if (s === "" || s === ".") return null;
  const v = Number(s);
  if (!isFinite(v)) return null;
  return Math.round(v * 100);
}

// Phrase courte décrivant l'effet d'une écriture (affichée dans le journal).
export function effectLabel(e: Pick<LedgerEntry, "scope" | "paidBy" | "share">): string {
  if (e.scope === "commun") {
    const s = clampShare(e.share);
    return s === 50 ? "Commun · 50/50" : `Commun · ${s}/${100 - s}`;
  }
  if (e.scope === e.paidBy) return `Perso · ${e.paidBy}`;
  return `${e.paidBy} → ${e.scope}`;
}

/* ── Dates ── */
const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function monthKey(iso: string): string {
  return (iso || "").slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  const name = MONTHS_FR[parseInt(m[2], 10) - 1] ?? m[2];
  return `${name} ${m[1]}`;
}

// "2026-06-12" -> "12/06"
export function dayMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}` : iso;
}

// Réexport pour les composants (date longue : "12 juin 2026").
export { formatDateFr };

/* ── Validation côté serveur ── */
export type LedgerInput = {
  date: string;
  label: string;
  category: string;
  amountCents: number;
  paidBy: Partner;
  scope: Scope;
  share: number;
  note: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Vraie date calendaire (rejette 2026-13-32, 2026-02-30, etc.).
function isRealISODate(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// Normalise un corps de requête en données prêtes pour Prisma. null si invalide.
export function sanitizeEntryInput(
  body: Record<string, unknown>,
  todayISO: string,
): LedgerInput | null {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const paidBy = s(body.paidBy);
  if (!isPartner(paidBy)) return null;

  const amountCents = Math.round(Number(body.amountCents));
  if (!isFinite(amountCents) || amountCents <= 0) return null;

  const rawScope = s(body.scope);
  if (rawScope !== "" && !isScope(rawScope)) return null;
  const scope: Scope = isScope(rawScope) ? rawScope : "commun";

  const catId = s(body.category);
  const cat = CATEGORY_BY_ID[catId] ? catId : "autre";
  const rawDate = s(body.date);
  const date = isRealISODate(rawDate) ? rawDate : todayISO;
  const share = scope === "commun" ? clampShare(body.share) : 50;

  return {
    date,
    label: s(body.label).slice(0, 200),
    category: cat,
    amountCents,
    paidBy,
    scope,
    share,
    note: s(body.note).slice(0, 1000),
  };
}
