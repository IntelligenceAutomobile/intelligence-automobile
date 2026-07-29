// Réunions : vocabulaire et règles partagées entre la page serveur, la liste,
// la fiche et le compte rendu imprimable. Module neutre, sans hook et sans accès
// base, pour rester importable des deux côtés.
import { formatDateFr } from "./devis";

/* ── Types de réunion ── */
export const MEETING_KINDS = ["interne", "banque", "partenaire", "fournisseur", "client", "autre"] as const;
export type MeetingKind = (typeof MEETING_KINDS)[number];

export const KIND_LABEL: Record<MeetingKind, string> = {
  interne: "Interne",
  banque: "Banque",
  partenaire: "Partenaire",
  fournisseur: "Fournisseur",
  client: "Client",
  autre: "Autre",
};

// Tonalité de l'étiquette. Les valeurs reprennent les clés de TONE (ui.tsx) sans
// l'importer : ce module doit rester libre de toute dépendance React.
export type MeetingTone = "accent" | "success" | "warning" | "danger" | "muted";

export const KIND_TONE: Record<MeetingKind, MeetingTone> = {
  interne: "accent",
  banque: "warning",
  partenaire: "success",
  fournisseur: "muted",
  client: "accent",
  autre: "muted",
};

export function isMeetingKind(v: unknown): v is MeetingKind {
  return typeof v === "string" && (MEETING_KINDS as readonly string[]).includes(v);
}

/* ── Lignes : décisions et actions ── */
export const ITEM_TYPES = ["decision", "action"] as const;
export type MeetingItemType = (typeof ITEM_TYPES)[number];

export const ITEM_STATUSES = ["a_faire", "fait"] as const;
export type MeetingItemStatus = (typeof ITEM_STATUSES)[number];

export function isItemType(v: unknown): v is MeetingItemType {
  return typeof v === "string" && (ITEM_TYPES as readonly string[]).includes(v);
}

export function isItemStatus(v: unknown): v is MeetingItemStatus {
  return typeof v === "string" && (ITEM_STATUSES as readonly string[]).includes(v);
}

/* ── Photo de la situation, figée à la création ── */
// Cette liste est gravée : une réunion de mars doit montrer les chiffres de mars.
// Ajouter un champ plus tard laissera les anciennes réunions sans lui, d'où les
// replis à zéro de parseSnapshot ; en retirer un perdrait un chiffre déjà écrit.
export type MeetingSnapshot = {
  // Jour où les chiffres ont été relevés. Il vaut la date de création, qui peut
  // différer de la date de la réunion quand celle-ci est saisie après coup :
  // étiqueter la carte avec la date de la réunion faisait alors mentir la photo.
  takenOn: string;
  stockCount: number; // véhicules encore en stock (hors vendus)
  stockValue: number; // valeur du stock en euros
  quotesPendingCount: number; // devis envoyés en attente de réponse
  quotesPending: number; // montant TTC de ces devis, en euros
  unpaid: number; // encours des factures impayées, en euros
  activeLeads: number; // leads encore dans le pipeline
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Renvoie null quand la photo est absente ou illisible : la carte « Où on en
// était » se replie au lieu d'afficher une rangée de zéros trompeuse.
export function parseSnapshot(raw: string | null | undefined): MeetingSnapshot | null {
  if (!raw) return null;
  try {
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== "object" || Array.isArray(p)) return null;
    const o = p as Record<string, unknown>;
    if (Object.keys(o).length === 0) return null;
    return {
      // Les réunions créées avant l'ajout de ce champ le laissent vide :
      // l'affichage retombe alors sur la date de la réunion.
      takenOn: isDateKey(o.takenOn) ? o.takenOn : "",
      stockCount: num(o.stockCount),
      stockValue: num(o.stockValue),
      quotesPendingCount: num(o.quotesPendingCount),
      quotesPending: num(o.quotesPending),
      unpaid: num(o.unpaid),
      activeLeads: num(o.activeLeads),
    };
  } catch {
    return null;
  }
}

/* ── Colonnes JSON ── */
// Une colonne abîmée laisse la réunion lisible, sans participant ni pièce jointe.
export function parseAttendees(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p: unknown = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    return p.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim());
  } catch {
    return [];
  }
}

export type MeetingAttachment = { label: string; url: string };

export function parseAttachments(raw: string | null | undefined): MeetingAttachment[] {
  if (!raw) return [];
  try {
    const p: unknown = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    return p
      .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
      .filter((v) => typeof v.url === "string" && v.url.trim() !== "")
      .map((v) => ({ url: String(v.url).trim(), label: String(v.label ?? "").trim() || "Document" }));
  } catch {
    return [];
  }
}

/* ── Dates ── */
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Le gabarit seul laissait passer « 2026-13-45 », qui ressortait en « NaN » dans
// le médaillon du fil : on vérifie que la date existe vraiment au calendrier.
export function isDateKey(v: unknown): v is string {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Clé de regroupement mensuel du fil de l'année : "2026-07".
export function monthKeyOf(date: string): string {
  return (date || "").slice(0, 7);
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// "2026-07" → "Juillet 2026". L'année reste visible : le fil traverse plusieurs
// exercices dès qu'on retire le filtre d'année.
export function monthLabel(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  return `${MONTHS[parseInt(m[2], 10) - 1] ?? ""} ${m[1]}`.trim();
}

export function yearOf(date: string): string {
  return (date || "").slice(0, 4);
}

/* ── Choix d'une échéance à la souris ──
   Le calendrier du sélecteur d'échéance se construit ici : les dates de ce
   module sont des chaînes AAAA-MM-JJ, jamais des objets Date locaux, sinon un
   clic sur « 1er août » à 23 h donnerait le 31 juillet. */

export const MONTH_LABELS = MONTHS;

// Jours de la semaine, lundi en tête comme le planning atelier.
export const WEEKDAY_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

export function dateKeyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Décale une date d'un nombre de jours, en restant sur des jours calendaires.
export function addDaysToKey(date: string, days: number): string {
  if (!isDateKey(date)) return "";
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dateKeyOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Dernier jour du mois de la date donnée.
export function endOfMonthKey(date: string): string {
  if (!isDateKey(date)) return "";
  const [y, m] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return dateKeyOf(y, m - 1, last);
}

// Semaines du mois, lundi en première colonne. Les cases vides valent null.
export function monthMatrix(year: number, month: number): (number | null)[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // getUTCDay() met dimanche à 0 : on décale pour commencer le lundi.
  const offset = (first.getUTCDay() + 6) % 7;

  const cells: (number | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// « 20 août » : format court du bouton d'échéance. L'année s'ajoute dès qu'elle
// diffère de celle du jour, pour qu'une échéance lointaine reste sans ambiguïté.
export function shortDateFr(date: string, today?: string): string {
  const m = DATE_RE.exec(date || "");
  if (!m) return "";
  const [y, mo, d] = date.split("-").map(Number);
  const label = `${d} ${(MONTHS[mo - 1] ?? "").toLowerCase()}`;
  return today && yearOf(today) !== String(y) ? `${label} ${y}` : label;
}

// Médaillon de date du fil : « 12 » + « VEN ». Construit en UTC pour que le jour
// affiché reste celui qui est écrit en base, quel que soit le fuseau du poste.
export function dayParts(date: string): { day: string; weekday: string } {
  const m = DATE_RE.exec(date || "");
  if (!m) return { day: "—", weekday: "" };
  const d = new Date(`${date}T00:00:00Z`);
  const weekday = d
    .toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" })
    .replace(/\./g, "")
    .toUpperCase();
  return { day: String(d.getUTCDate()), weekday };
}

// Mois abrégé pour le médaillon : « SEPT ». Sert quand la liste n'est PAS
// groupée par mois (les actions, rangées par urgence) : le jour de la semaine
// y serait ambigu, « MAR » se lisant aussi bien mardi que mars.
export function monthShortFr(date: string): string {
  if (!DATE_RE.test(date || "")) return "";
  return new Date(`${date}T00:00:00Z`)
    .toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" })
    .replace(/\./g, "")
    .toUpperCase();
}

// Écart en jours entre deux jours calendaires, sans passer par l'heure locale.
export function daysBetweenKeys(from: string, to: string): number {
  if (!isDateKey(from) || !isDateKey(to)) return 0;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

// Une action est en retard quand son échéance est passée et qu'elle reste à faire.
// Une action sans échéance ne peut jamais l'être : elle attend, elle ne traîne pas.
export function isOverdue(dueDate: string, today: string): boolean {
  return isDateKey(dueDate) && isDateKey(today) && dueDate < today;
}

export function lateLabel(dueDate: string, today: string): string {
  const n = daysBetweenKeys(dueDate, today);
  if (n <= 0) return "";
  return n === 1 ? "En retard d'un jour" : `En retard de ${n} jours`;
}

// Phrase d'échéance prête à afficher, retard compris. Elle est construite ici
// d'un bloc : composer « Pour le » avec un libellé relatif donnait « Pour le
// aujourd'hui » les jours où une action arrivait à terme.
export function dueSentence(dueDate: string, today: string): string {
  if (!isDateKey(dueDate)) return "";
  const n = daysBetweenKeys(today, dueDate);
  if (n < 0) return lateLabel(dueDate, today);
  if (n === 0) return "Échéance aujourd'hui";
  if (n === 1) return "Échéance demain";
  return `Pour le ${formatDateFr(dueDate)}`;
}

/* ── Libellés ── */
// Une réunion sans titre garde une identité lisible partout : liste, fil
// d'Ariane, compte rendu imprimé, nom du fichier PDF.
export function meetingTitle(m: { title: string; date: string }): string {
  const t = (m.title ?? "").trim();
  if (t) return t;
  const d = formatDateFr(m.date);
  return d ? `Réunion du ${d}` : "Réunion";
}

// Texte fouillé par la recherche : titre, type, participants, lieu, synthèse et
// contenu des décisions et actions. Chercher « banque » doit retrouver la réunion
// où le mot apparaît dans une décision, pas seulement celles de type Banque.
export function meetingHaystack(m: {
  title: string;
  date: string;
  kind: string;
  attendees: string[];
  location: string;
  summary: string;
  items: { content: string; owner: string }[];
}): string {
  const kindLabel = isMeetingKind(m.kind) ? KIND_LABEL[m.kind] : m.kind;
  return [
    meetingTitle(m),
    kindLabel,
    m.location,
    m.summary,
    m.attendees.join(" "),
    m.items.map((i) => `${i.content} ${i.owner}`).join(" "),
    formatDateFr(m.date),
  ]
    .filter(Boolean)
    .join(" ");
}
