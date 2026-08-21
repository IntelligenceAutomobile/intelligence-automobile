// La saisie de la fiche, traduite en document imprimable.
//
// L'aperçu de la fiche et la page d'impression rendent le MÊME composant : ce
// convertisseur est le seul écart entre les deux, le temps que les valeurs
// tapées à l'écran deviennent les colonnes de la base.
//
// Rien ne bloque ici : une valeur illisible vaut zéro et laisse le champ vide
// sur le papier. L'aperçu accompagne la frappe, il ne la corrige pas — les
// contrôles se font à l'enregistrement et à l'envoi.
import { lireMontantEuros, lireEntier } from "@/lib/format";
import { KM_MAX } from "@/lib/reprise-serialize";
import type { MandatForm } from "@/lib/mandat-form";
import type { PrintMandat } from "./imprimer/MandatDocument";

function cents(v: string): number {
  const lu = lireMontantEuros(v);
  return typeof lu === "number" ? lu * 100 : 0;
}

function entier(v: string, max: number): number {
  const lu = lireEntier(v, max);
  return typeof lu === "number" ? lu : 0;
}

export type SignatureApercu = {
  signerName: string;
  signedAt: string;
  signedIp: string;
};

export function mandatFormToPrint(
  f: MandatForm,
  createdOn: string,
  signature?: SignatureApercu,
): PrintMandat {
  return {
    reference: f.reference,
    createdOn,

    ownerName: f.ownerName,
    ownerBirthDate: f.ownerBirthDate,
    ownerAddress: f.ownerAddress,
    ownerEmail: f.ownerEmail,
    ownerPhone: f.ownerPhone,
    ownerIdNumber: f.ownerIdNumber,

    rcPolicy: f.rcPolicy,
    rcInsurer: f.rcInsurer,

    make: f.make,
    model: f.model,
    version: f.version,
    power: f.power,
    plate: f.plate,
    vin: f.vin,
    firstRegDate: f.firstRegDate,
    mileageKm: entier(f.mileageKm, KM_MAX),
    fuel: f.fuel,
    color: f.color,
    keys: entier(f.keys, 10),
    ctDate: f.ctDate,
    ctStatus: f.ctStatus,
    lastServiceKm: f.lastServiceKm,
    disclosures: f.disclosures,

    priceCents: cents(f.priceEuros),
    floorCents: cents(f.floorEuros),
    feeFormula: f.feeFormula,
    packCents: cents(f.packEuros),

    searchSpec: f.searchSpec,
    budgetCents: cents(f.budgetEuros),
    mileageMaxKm: entier(f.mileageMaxKm, KM_MAX),
    regMinYear: entier(f.regMinYear, 2100),
    listingUrl: f.listingUrl,
    countryOrigin: f.countryOrigin,
    feeCents: cents(f.feeEuros),

    startDate: f.startDate,
    durationDays: entier(f.durationDays, 365),

    custody: f.custody,
    custodyDate: f.custodyDate,

    signMode: f.signMode,
    immediateExecution: f.immediateExecution,
    signPlace: f.signPlace,
    signedOn: f.signedOn,

    signerName: signature?.signerName ?? "",
    signedAt: signature?.signedAt ?? "",
    signedIp: signature?.signedIp ?? "",
  };
}
