// Stock véhicules : constantes et règles partagées entre le serveur, la liste du
// stock et le tableau de bord. Module neutre, sans hook et sans accès base, pour
// rester importable des deux côtés.

/* ── Statuts ── */
// La liste vivait en cinq exemplaires dans le dépôt : ici, la page de stock,
// le formulaire véhicule, le thème et la réplique de démonstration.
export const VEHICLE_STATUSES = ["disponible", "reserve", "vendu"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
  vendu: "Vendu",
};

// Ordre du cycle de vente, pour trier une colonne de statuts.
export const STATUS_ORDER: Record<string, number> = {
  disponible: 0,
  reserve: 1,
  vendu: 2,
};

export function isVehicleStatus(v: unknown): v is VehicleStatus {
  return typeof v === "string" && (VEHICLE_STATUSES as readonly string[]).includes(v);
}

/* ── Ancienneté en stock ── */
// Repères du métier : revue à 60 jours, repositionnement du prix à 90.
export const AGE_WATCH_DAYS = 60;
export const AGE_URGENT_DAYS = 90;

export function ageTone(days: number): "muted" | "warning" | "danger" {
  if (days >= AGE_URGENT_DAYS) return "danger";
  if (days >= AGE_WATCH_DAYS) return "warning";
  return "muted";
}

/* ── Santé d'une fiche ── */
// Une seule définition de « fiche à compléter », appelée par la liste du stock
// et par le tableau de bord : les deux écrans donnaient jusqu'ici des comptes
// différents, et pouvaient se contredire sur la même voiture.
export type VehicleHealthInput = {
  image: string | null;
  price: number;
  photoCount: number;
  hasDescription: boolean;
  featureCount: number;
  documentCount: number;
};

// Manques bloquants, dans l'ordre de gravité d'affichage.
export function missingEssentials(v: Pick<VehicleHealthInput, "image" | "price">): string[] {
  const out: string[] = [];
  if (!v.image) out.push("Sans photo");
  if (!v.price || v.price <= 0) out.push("Prix à définir");
  return out;
}

// Note de complétude sur 4, dans l'esprit du « Pièces 4/7 » des dossiers
// d'immatriculation. Les seuils restent volontairement bas : la note doit
// distinguer une fiche travaillée d'une fiche à peine créée.
export const COMPLETENESS_TOTAL = 4;
export const MIN_PHOTOS = 6;
export const MIN_FEATURES = 4;

export function completeness(v: VehicleHealthInput): { score: number; missing: string[] } {
  const missing: string[] = [];
  if (v.photoCount >= MIN_PHOTOS) { /* atteint */ } else missing.push(`${MIN_PHOTOS} photos`);
  if (v.hasDescription) { /* atteint */ } else missing.push("description");
  if (v.featureCount >= MIN_FEATURES) { /* atteint */ } else missing.push("équipements");
  if (v.documentCount >= 1) { /* atteint */ } else missing.push("documents");
  return { score: COMPLETENESS_TOTAL - missing.length, missing };
}

/* ── Recherche ── */
// Insensible à la casse, aux accents et à la ponctuation : « mercedes benz »
// retrouve « Mercedes-Benz », « q5 40 tdi » retrouve « Q5 40 TDI ».
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Tous les termes saisis doivent se retrouver dans le texte, dans n'importe
// quel ordre : « bmw 2021 » et « 2021 bmw » donnent le même résultat.
export function matchesSearch(haystack: string, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const h = normalizeSearch(haystack);
  return q.split(" ").every((term) => h.includes(term));
}

/* ── Format ── */
// « 3 j », « 2 mois », « 1 an » : formulation courte pour une colonne étroite.
// Le seuil se teste en jours et non en mois arrondis : à 350 jours l'arrondi
// donnait 12 mois, la branche année prenait la main et affichait « 0 an ».
export function formatDays(days: number): string {
  if (days <= 0) return "auj.";
  if (days < 31) return `${days} j`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  const years = Math.floor(days / 365);
  return `${years} an${years > 1 ? "s" : ""}`;
}

/* ── Jour civil à Paris ── */
// Le runtime tourne en UTC : sans cette conversion, une fiche créée le soir
// gagne un jour d'ancienneté, définitivement.
export function parisDay(d: Date): Date {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((parisDay(to).getTime() - parisDay(from).getTime()) / 86_400_000));
}
