// Forme du formulaire de mandat, partagée par la page serveur qui le prépare
// et le composant client qui le rend, comme src/lib/reprise-form.ts.
//
// Ce module reste « partagé » (aucun "use client") : la page de saisie a
// besoin d'un mandat vierge avant tout rendu, et la fiche d'un véhicule ou
// d'un client pré-remplit ces mêmes champs côté serveur.
//
// Les valeurs chiffrées voyagent en texte : le champ accepte « 15 490 » comme
// « 15490 », et la lecture se fait à l'enregistrement, par les règles communes
// de src/lib/format.ts.
import type { MandatDoc, MandatStatus, MandatType } from "./mandats";
import { DUREE_JOURS_DEFAUT } from "./mandats";

export type MandatForm = {
  id: string;
  reference: string;
  type: MandatType;
  status: MandatStatus;
  clientId: string | null;
  leadId: string | null;
  vehicleId: string | null;

  ownerName: string;
  ownerBirthDate: string;
  ownerAddress: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerIdNumber: string;

  rcPolicy: string;
  rcInsurer: string;

  make: string;
  model: string;
  version: string;
  power: string;
  plate: string;
  vin: string;
  firstRegDate: string;
  mileageKm: string;
  fuel: string;
  color: string;
  keys: string;
  ctDate: string;
  ctStatus: string;
  lastServiceKm: string;
  disclosures: string;

  priceEuros: string;
  floorEuros: string;
  feeFormula: string;
  packEuros: string;

  searchSpec: string;
  budgetEuros: string;
  mileageMaxKm: string;
  regMinYear: string;
  listingUrl: string;
  countryOrigin: string;
  feeEuros: string;
  registrationId: string | null;

  startDate: string;
  durationDays: string;

  custody: string;
  custodyDate: string;

  signMode: string;
  immediateExecution: boolean;
  signPlace: string;
  signedOn: string;

  soldOn: string;
  soldPriceEuros: string;
  feeFinalEuros: string;
  outcomeNote: string;

  notes: string;
  /** Pièces du dossier : mandat signé scanné, carte grise, contrôle technique. */
  documents: MandatDoc[];
};

/** Valeurs de départ d'un mandat vierge, au jour civil de Paris. */
export function mandatVierge(today: string, type: MandatType = "vente"): MandatForm {
  return {
    id: "", reference: "", type, status: "brouillon",
    clientId: null, leadId: null, vehicleId: null,
    ownerName: "", ownerBirthDate: "", ownerAddress: "", ownerEmail: "", ownerPhone: "", ownerIdNumber: "",
    rcPolicy: "", rcInsurer: "",
    make: "", model: "", version: "", power: "", plate: "", vin: "", firstRegDate: "",
    mileageKm: "", fuel: "Essence", color: "", keys: "",
    ctDate: "", ctStatus: "", lastServiceKm: "", disclosures: "",
    priceEuros: "", floorEuros: "", feeFormula: "acquereur", packEuros: "",
    searchSpec: "", budgetEuros: "", mileageMaxKm: "", regMinYear: "",
    listingUrl: "", countryOrigin: type === "import" ? "Allemagne" : "", feeEuros: "", registrationId: null,
    startDate: today, durationDays: String(DUREE_JOURS_DEFAUT),
    custody: "vendeur", custodyDate: "",
    signMode: type === "vente" ? "domicile" : "distance", immediateExecution: false, signPlace: "", signedOn: "",
    soldOn: "", soldPriceEuros: "", feeFinalEuros: "", outcomeNote: "",
    notes: "", documents: [],
  };
}
