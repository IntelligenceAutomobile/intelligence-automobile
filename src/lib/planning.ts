// Planning atelier : constantes et helpers partagés (types de RDV, créneaux, semaine).
// Module sans hook, importable côté serveur et client.

export const APPOINTMENT_TYPES = ["essai", "livraison", "preparation", "ct", "mecanique", "indispo", "autre"] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const TYPE_LABEL: Record<AppointmentType, string> = {
  essai: "Essai client",
  livraison: "Livraison",
  preparation: "Préparation",
  ct: "Contrôle technique",
  mecanique: "Mécanique",
  indispo: "Indisponibilité",
  autre: "Autre",
};

// Couleurs d'affichage des blocs (fond translucide + accent), alignées sur la charte.
export const TYPE_COLOR: Record<AppointmentType, { bg: string; bd: string; fg: string }> = {
  essai: { bg: "rgba(107,159,238,0.14)", bd: "rgba(107,159,238,0.45)", fg: "#8BB8F5" },
  livraison: { bg: "rgba(78,209,161,0.12)", bd: "rgba(78,209,161,0.45)", fg: "#4ED1A1" },
  preparation: { bg: "rgba(199,211,232,0.10)", bd: "rgba(199,211,232,0.38)", fg: "#C7D3E8" },
  ct: { bg: "rgba(240,180,90,0.12)", bd: "rgba(240,180,90,0.45)", fg: "#F0B45A" },
  mecanique: { bg: "rgba(75,127,216,0.16)", bd: "rgba(75,127,216,0.50)", fg: "#7FA6E8" },
  indispo: { bg: "rgba(124,146,181,0.10)", bd: "rgba(124,146,181,0.40)", fg: "#7C92B5" },
  autre: { bg: "rgba(200,216,238,0.07)", bd: "#1B3055", fg: "#C8D8EE" },
};

export function isAppointmentType(v: unknown): v is AppointmentType {
  return typeof v === "string" && (APPOINTMENT_TYPES as readonly string[]).includes(v);
}

/* ── Signature : qui a créé l'événement ── */
// Teintes sourdes prises hors des couleurs de type (bleus, verts, ambres) : sur
// un même bloc, « quel type » et « qui l'a écrit » restent deux lectures distinctes.
const AUTHOR_PALETTE = [
  "#A594D0", // mauve
  "#D493A8", // rose poudré
  "#8FC2C8", // bleu-vert pâle
  "#C6B37E", // sable
  "#9AAFD9", // bleu ardoise
  "#C0968C", // terre rosée
] as const;

// César et Fab gardent une teinte fixe (les deux orthographes mènent à la même
// couleur) ; toute autre signature reçoit une couleur stable, dérivée de son nom.
const AUTHOR_FIXED: Record<string, string> = {
  "césar": AUTHOR_PALETTE[0],
  "cesar": AUTHOR_PALETTE[0],
  "fab": AUTHOR_PALETTE[1],
};

const AUTHOR_FALLBACK = "#7C92B5";

export function authorColor(name: string): string {
  const key = name.trim().toLowerCase();
  if (!key) return AUTHOR_FALLBACK;
  if (AUTHOR_FIXED[key]) return AUTHOR_FIXED[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return AUTHOR_PALETTE[hash % AUTHOR_PALETTE.length];
}

// Nom affiché sur un événement : l'auteur enregistré à la création. Les
// événements antérieurs à la signature retombent sur « person », qui était
// pré-rempli avec le nom d'Atelier au moment de la saisie.
export function signatureOf(a: { author?: string; person?: string }): string {
  return (a.author ?? "").trim() || (a.person ?? "").trim();
}

/* ── Grille horaire ── */
export const DAY_START_MIN = 8 * 60; // 08:00
export const DAY_END_MIN = 19 * 60; // 19:00

// 60 px par heure : en dessous, un créneau de 30 min ne loge pas ses deux lignes
// et un quart d'heure devient trop fin pour être visé à la souris.
export const PX_PER_HOUR = 60;
export const GRID_H = ((DAY_END_MIN - DAY_START_MIN) / 60) * PX_PER_HOUR;

// Pas d'aimantation des gestes et des listes de saisie.
export const SNAP_MIN = 15;

// Bornes communes à la création et à la modification.
export const MIN_DURATION_MIN = 15;
export const MAX_DURATION_MIN = 12 * 60;
export const FULL_DAY_MIN = DAY_END_MIN - DAY_START_MIN;

export function snapTo(min: number, step: number = SNAP_MIN): number {
  return Math.round(min / step) * step;
}

// Ramène un début dans la journée affichée, en gardant la durée visible en entier.
export function clampStart(startMin: number, durationMin: number): number {
  return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - durationMin, startMin));
}

export function clampDuration(durationMin: number): number {
  return Math.max(MIN_DURATION_MIN, Math.min(MAX_DURATION_MIN, Math.round(durationMin)));
}

export function isValidStartMin(v: unknown): v is number {
  return Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 23 * 60;
}

export const DURATIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1 h 30" },
  { value: 120, label: "2 h" },
  { value: 180, label: "3 h" },
  { value: 240, label: "4 h" },
  { value: FULL_DAY_MIN, label: "Journée" },
] as const;

// Durée standard par prestation : une création part de la bonne valeur au lieu
// d'une heure systématique, corrigée ensuite à la main.
export const TYPE_DURATION: Record<AppointmentType, number> = {
  essai: 60,
  livraison: 90,
  preparation: 240,
  ct: 30,
  mecanique: 120,
  indispo: FULL_DAY_MIN,
  autre: 60,
};

export function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

// Durée en toutes lettres : « 1 h 30 », « 45 min ».
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/* ── Répartition en colonnes des événements simultanés ── */
// Sans cela, deux RDV à la même heure occupent le même rectangle : celui du
// dessous devient invisible ET inclicable.
export type DayLayout = { col: number; cols: number; span: number };

type Placed = { id: string; start: number; end: number; col: number };

export function layoutDay(
  events: readonly { id: string; startMin: number; durationMin: number }[],
): Map<string, DayLayout> {
  const out = new Map<string, DayLayout>();

  // Tri stable : à heure égale, le plus long passe devant, puis l'identifiant
  // départage. Sans ce dernier critère l'empilement change d'un chargement à l'autre.
  const sorted = [...events].sort(
    (a, b) => a.startMin - b.startMin || b.durationMin - a.durationMin || a.id.localeCompare(b.id),
  );

  let cluster: Placed[] = [];
  let clusterEnd = -Infinity;

  function flush() {
    if (cluster.length === 0) return;
    const cols = Math.max(...cluster.map((p) => p.col)) + 1;
    for (const p of cluster) {
      // Extension vers la droite : un bloc s'élargit tant qu'aucun voisin ne le
      // recoupe. Sans cette étape, une longue préparation et deux essais courts
      // gaspillent la moitié de la largeur.
      let span = 1;
      for (let c = p.col + 1; c < cols; c++) {
        const busy = cluster.some((q) => q.col === c && q.start < p.end && q.end > p.start);
        if (busy) break;
        span++;
      }
      out.set(p.id, { col: p.col, cols, span });
    }
    cluster = [];
    clusterEnd = -Infinity;
  }

  for (const e of sorted) {
    const start = e.startMin;
    const end = e.startMin + e.durationMin;
    if (start >= clusterEnd) flush();
    let col = 0;
    while (cluster.some((p) => p.col === col && p.end > start)) col++;
    cluster.push({ id: e.id, start, end, col });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();

  return out;
}

/* ── Charge d'une journée ── */
// Les plages qui se recouvrent comptent une seule fois : deux RDV simultanés
// occupent une heure de l'atelier, pas deux.
export function dayLoadMin(events: readonly { startMin: number; durationMin: number }[]): number {
  const ranges = [...events]
    .map((e) => [e.startMin, e.startMin + e.durationMin] as const)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let cursor = -Infinity;
  for (const [start, end] of ranges) {
    const from = Math.max(start, cursor);
    if (end > from) {
      total += end - from;
      cursor = end;
    }
  }
  return total;
}

/* ── Semaine (lundi → samedi) ── */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function weekDays(monday: Date): { key: string; date: Date }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { key: toDateKey(d), date: d };
  });
}

export function formatDayFr(d: Date): string {
  const raw = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
