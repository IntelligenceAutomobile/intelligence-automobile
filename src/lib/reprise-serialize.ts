// Lecture d'un corps de requête vers les colonnes d'une estimation de reprise.
// Partagé par la création et la modification : une seule règle de nettoyage,
// donc un champ se comporte pareil des deux côtés.
//
// Rien ne fait confiance à ce qui arrive : les textes sont taillés, les dates
// contrôlées, les entiers bornés. Une valeur illisible retombe sur le défaut de
// la colonne plutôt que de casser l'écriture.
import { isCtStatus, isServiceBook, REPRISE_FUELS, REPRISE_TRANSMISSIONS, VALIDITE_JOURS_DEFAUT } from "./reprises";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Jour YYYY-MM-DD, ou chaîne vide. */
export function asDate(v: unknown): string {
  return DATE_RE.test(String(v)) ? String(v) : "";
}

function texte(v: unknown, max = 400): string {
  return String(v ?? "").trim().slice(0, max);
}

function majuscules(v: unknown, max = 40): string {
  return texte(v, max).toUpperCase();
}

function entier(v: unknown, max: number): number {
  const n = Math.round(Number(v) || 0);
  return Math.min(Math.max(0, n), max);
}

// Une année aberrante vaut mieux vide qu'à côté : « 19 » tapé à la volée
// donnait 19 après conversion, et se relisait comme une année valide.
function annee(v: unknown): number {
  const n = Math.round(Number(v) || 0);
  return n >= 1950 && n <= new Date().getFullYear() + 1 ? n : 0;
}

function drapeau(v: unknown, defaut: boolean): boolean {
  return typeof v === "boolean" ? v : defaut;
}

function dansLaListe(v: unknown, liste: readonly string[], defaut: string): string {
  const s = texte(v, 40);
  return liste.includes(s) ? s : defaut;
}

export const KM_MAX = 2_000_000;
export const CENTIMES_MAX = 500_000_00;

/** Toutes les colonnes métier d'une estimation, lues depuis un corps JSON. */
export function repriseFromBody(body: Record<string, unknown>) {
  return {
    ownerName: texte(body.ownerName, 120),
    ownerCompany: texte(body.ownerCompany, 120),
    ownerEmail: texte(body.ownerEmail, 160).toLowerCase(),
    ownerPhone: texte(body.ownerPhone, 40),

    make: texte(body.make, 60),
    model: texte(body.model, 80),
    version: texte(body.version, 120),
    year: annee(body.year),
    mileageKm: entier(body.mileageKm, KM_MAX),
    fuel: dansLaListe(body.fuel, REPRISE_FUELS, "Essence"),
    transmission: dansLaListe(body.transmission, REPRISE_TRANSMISSIONS, "Manuelle"),
    color: texte(body.color, 40),
    plate: majuscules(body.plate, 15),
    vin: majuscules(body.vin, 25),
    firstRegDate: asDate(body.firstRegDate),

    ctDate: asDate(body.ctDate),
    ctStatus: isCtStatus(body.ctStatus) ? body.ctStatus : "",
    owners: entier(body.owners, 20),
    serviceBook: isServiceBook(body.serviceBook) ? body.serviceBook : "",
    keys: entier(body.keys, 10),
    creditPending: drapeau(body.creditPending, false),
    creditCents: entier(body.creditCents, CENTIMES_MAX),
    titleInName: drapeau(body.titleInName, true),
    condition: texte(body.condition, 2000),

    resaleCents: entier(body.resaleCents, CENTIMES_MAX),
    reconditionCents: entier(body.reconditionCents, CENTIMES_MAX),
    offerCents: entier(body.offerCents, CENTIMES_MAX),

    offerDate: asDate(body.offerDate),
    validityDays: Math.min(Math.max(1, Math.round(Number(body.validityDays) || VALIDITE_JOURS_DEFAUT)), 180),

    nextActionAt: asDate(body.nextActionAt),
    nextActionLabel: texte(body.nextActionLabel, 120),

    notes: texte(body.notes, 2000),
  };
}

export type RepriseInput = ReturnType<typeof repriseFromBody>;

/**
 * Les seuls champs réellement envoyés, normalisés de la même façon.
 *
 * La fiche enregistre d'un bloc et passe tout, une action rapide de la liste
 * envoie le seul statut. Sans ce tri, ce second envoi remettrait chaque colonne
 * absente à sa valeur par défaut, et une estimation perdrait sa voiture pour
 * avoir été marquée « acceptée » depuis la liste.
 */
export function repriseChangesFromBody(body: Record<string, unknown>): Partial<RepriseInput> {
  const complet = repriseFromBody(body);
  const partiel: Record<string, unknown> = {};
  for (const cle of Object.keys(complet)) {
    if (cle in body) partiel[cle] = complet[cle as keyof RepriseInput];
  }
  return partiel as Partial<RepriseInput>;
}

/** Ce qui manque pour qu'une estimation tienne debout. Vide = elle passe. */
export function manquesAlaCreation(input: RepriseInput): string[] {
  const manques: string[] = [];
  if (!input.ownerName) manques.push("le nom du vendeur");
  if (!input.make) manques.push("la marque");
  if (!input.model) manques.push("le modèle");
  return manques;
}
