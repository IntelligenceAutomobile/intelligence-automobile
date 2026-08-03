// Forme du formulaire d'estimation, partagée par la page serveur qui le
// prépare et le composant client qui le rend.
//
// Ce module reste « partagé » (aucun "use client") : une fonction déclarée dans
// un fichier client ne peut pas être appelée depuis le serveur, et la page de
// saisie a justement besoin d'une estimation vierge avant tout rendu.
//
// Les valeurs chiffrées voyagent en texte : le champ accepte « 118 000 » comme
// « 118000 », et la lecture se fait à l'enregistrement, par les règles communes
// de src/lib/format.ts.
import type { RepriseStatus } from "./reprises";
import { VALIDITE_JOURS_DEFAUT } from "./reprises";

export type RepriseForm = {
  id: string;
  reference: string;
  status: RepriseStatus;
  clientId: string | null;
  leadId: string | null;
  vehicleId: string | null;

  ownerName: string;
  ownerCompany: string;
  ownerEmail: string;
  ownerPhone: string;

  make: string;
  model: string;
  version: string;
  year: string;
  mileageKm: string;
  fuel: string;
  transmission: string;
  color: string;
  plate: string;
  vin: string;
  firstRegDate: string;

  ctDate: string;
  ctStatus: string;
  owners: string;
  serviceBook: string;
  keys: string;
  creditPending: boolean;
  creditEuros: string;
  titleInName: boolean;
  condition: string;

  resaleEuros: string;
  reconditionEuros: string;
  offerEuros: string;
  offerDate: string;
  validityDays: string;
  refusalReason: string;
  nextActionAt: string;
  nextActionLabel: string;
  notes: string;
  /** URL des clichés du véhicule évalué. */
  photos: string[];
};

/** Valeurs de départ d'une estimation vierge, au jour civil de Paris. */
export function repriseVierge(today: string): RepriseForm {
  return {
    id: "", reference: "", status: "brouillon", clientId: null, leadId: null, vehicleId: null,
    ownerName: "", ownerCompany: "", ownerEmail: "", ownerPhone: "",
    make: "", model: "", version: "", year: "", mileageKm: "",
    fuel: "Essence", transmission: "Manuelle", color: "", plate: "", vin: "", firstRegDate: "",
    ctDate: "", ctStatus: "", owners: "", serviceBook: "", keys: "",
    creditPending: false, creditEuros: "", titleInName: true, condition: "",
    resaleEuros: "", reconditionEuros: "", offerEuros: "", offerDate: today, validityDays: String(VALIDITE_JOURS_DEFAUT), refusalReason: "",
    nextActionAt: "", nextActionLabel: "", notes: "", photos: [],
  };
}
