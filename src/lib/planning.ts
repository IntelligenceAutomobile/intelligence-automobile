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

/* ── Grille horaire ── */
export const DAY_START_MIN = 8 * 60; // 08:00
export const DAY_END_MIN = 19 * 60; // 19:00

export function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
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
