// Lecture d'un corps de requête vers les colonnes d'un mandat. Partagé par la
// création et la modification : une seule règle de nettoyage, donc un champ se
// comporte pareil des deux côtés, comme src/lib/reprise-serialize.ts.
//
// Rien ne fait confiance à ce qui arrive : les textes sont taillés, les dates
// contrôlées, les entiers bornés. Une valeur illisible retombe sur le défaut de
// la colonne plutôt que de casser l'écriture.
import { asDate, KM_MAX, CENTIMES_MAX } from "./reprise-serialize";
import { isCtStatus, REPRISE_FUELS } from "./reprises";
import {
  isMandatType, isFeeFormula, isSignMode, isCustody,
  DUREE_JOURS_DEFAUT,
} from "./mandats";

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

function drapeau(v: unknown, defaut: boolean): boolean {
  return typeof v === "boolean" ? v : defaut;
}

function dansLaListe(v: unknown, liste: readonly string[], defaut: string): string {
  const s = texte(v, 40);
  return liste.includes(s) ? s : defaut;
}

/** Toutes les colonnes métier d'un mandat, lues depuis un corps JSON. */
export function mandatFromBody(body: Record<string, unknown>) {
  return {
    type: isMandatType(body.type) ? body.type : "vente",

    ownerName: texte(body.ownerName, 120),
    ownerBirthDate: asDate(body.ownerBirthDate),
    ownerAddress: texte(body.ownerAddress, 300),
    ownerEmail: texte(body.ownerEmail, 160).toLowerCase(),
    ownerPhone: texte(body.ownerPhone, 40),
    ownerIdNumber: texte(body.ownerIdNumber, 60),

    rcPolicy: texte(body.rcPolicy, 80),
    rcInsurer: texte(body.rcInsurer, 120),

    make: texte(body.make, 60),
    model: texte(body.model, 80),
    version: texte(body.version, 120),
    power: texte(body.power, 40),
    plate: majuscules(body.plate, 15),
    vin: majuscules(body.vin, 25),
    firstRegDate: asDate(body.firstRegDate),
    mileageKm: entier(body.mileageKm, KM_MAX),
    fuel: dansLaListe(body.fuel, REPRISE_FUELS, "Essence"),
    color: texte(body.color, 40),
    keys: entier(body.keys, 10),
    ctDate: asDate(body.ctDate),
    ctStatus: isCtStatus(body.ctStatus) ? body.ctStatus : "",
    lastServiceKm: texte(body.lastServiceKm, 60),
    disclosures: texte(body.disclosures, 2000),

    priceCents: entier(body.priceCents, CENTIMES_MAX),
    floorCents: entier(body.floorCents, CENTIMES_MAX),
    feeFormula: isFeeFormula(body.feeFormula) ? body.feeFormula : "acquereur",
    packCents: entier(body.packCents, CENTIMES_MAX),

    searchSpec: texte(body.searchSpec, 2000),
    budgetCents: entier(body.budgetCents, CENTIMES_MAX),
    mileageMaxKm: entier(body.mileageMaxKm, KM_MAX),
    // Une année de mise en circulation aberrante vaut mieux vide qu'à côté.
    regMinYear: (() => {
      const n = Math.round(Number(body.regMinYear) || 0);
      return n >= 1950 && n <= new Date().getFullYear() + 1 ? n : 0;
    })(),
    listingUrl: texte(body.listingUrl, 500),
    countryOrigin: texte(body.countryOrigin, 60),
    feeCents: entier(body.feeCents, CENTIMES_MAX),

    startDate: asDate(body.startDate),
    durationDays: Math.min(Math.max(1, Math.round(Number(body.durationDays) || DUREE_JOURS_DEFAUT)), 365),

    custody: isCustody(body.custody) ? body.custody : "vendeur",
    custodyDate: asDate(body.custodyDate),

    signMode: isSignMode(body.signMode) ? body.signMode : "domicile",
    immediateExecution: drapeau(body.immediateExecution, false),
    signPlace: texte(body.signPlace, 80),
    signedOn: asDate(body.signedOn),

    soldOn: asDate(body.soldOn),
    soldPriceCents: entier(body.soldPriceCents, CENTIMES_MAX),
    feeFinalCents: entier(body.feeFinalCents, CENTIMES_MAX),
    outcomeNote: texte(body.outcomeNote, 1000),

    notes: texte(body.notes, 2000),

    // Les pièces se rangent en JSON, assainies : seules des entrées complètes
    // entrent, et le tableau reste borné.
    documents: JSON.stringify(
      (Array.isArray(body.documents) ? body.documents : [])
        .filter(
          (d): d is { label: string; url: string; uploadedAt?: string } =>
            !!d && typeof d === "object" &&
            typeof (d as { url?: unknown }).url === "string" &&
            String((d as { url: string }).url).trim() !== "",
        )
        .map((d) => ({
          label: texte(d.label, 120) || "Pièce",
          url: String(d.url).trim().slice(0, 500),
          uploadedAt: texte(d.uploadedAt, 30),
        }))
        .slice(0, 30),
    ),
  };
}

export type MandatInput = ReturnType<typeof mandatFromBody>;

/**
 * Les seuls champs réellement envoyés, normalisés de la même façon.
 *
 * La fiche enregistre d'un bloc et passe tout, un dépôt de pièce envoie le
 * seul champ documents. Sans ce tri, ce second envoi remettrait chaque colonne
 * absente à sa valeur par défaut, et un mandat perdrait son vendeur pour avoir
 * reçu une pièce jointe.
 */
export function mandatChangesFromBody(body: Record<string, unknown>): Partial<MandatInput> {
  const complet = mandatFromBody(body);
  const partiel: Record<string, unknown> = {};
  for (const cle of Object.keys(complet)) {
    if (cle in body) partiel[cle] = complet[cle as keyof MandatInput];
  }
  return partiel as Partial<MandatInput>;
}

/** Ce qui manque pour qu'un mandat tienne debout. Vide = il passe.
    Une recherche ou un import démarre parfois d'un cahier des charges libre :
    la marque cible OU les critères écrits suffisent alors. */
export function manquesAlaCreation(input: MandatInput): string[] {
  const manques: string[] = [];
  if (!input.ownerName) manques.push("le nom du client");
  if (input.type === "vente") {
    if (!input.make) manques.push("la marque");
    if (!input.model) manques.push("le modèle");
  } else if (!input.make && !input.searchSpec && !input.listingUrl) {
    manques.push("la marque recherchée ou le cahier des charges");
  }
  return manques;
}
