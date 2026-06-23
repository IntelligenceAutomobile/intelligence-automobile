// Données pour la modale véhicule (archivée côté admin).
// Auparavant dans src/app/vehicules/VehiculesList.tsx — déplacé ici quand la
// modale a été retirée du public au profit de la fiche /vehicules/[id].
import type { ModalVehicle } from "./VehiculeModal";

// Véhicule source (sous-ensemble des colonnes DB nécessaires à toModal).
export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  transmission: string;
  color: string;
  images: string;
  features: string;
  featuresEn: string;
  status: string;
  origin: string;
  power?: number | null;
  description?: string;
  descriptionEn?: string;
};

// ── Enrichissements pour véhicules réels (maintenance, dossierUrl) ───────────
// Keyed par vehicle.id — appliqués dans toModal()
export const VEHICLE_ENRICHMENTS: Record<string, Partial<ModalVehicle>> = {
  "audi-tt-mk3-sline-2014": {
    factures: [
      "/audi-tt-mk3-sline-2014/factures/batterie-invoice-1.jpg",
      "/audi-tt-mk3-sline-2014/factures/batterie-invoice-2.jpg",
      "/audi-tt-mk3-sline-2014/factures/ct-belge.jpg",
      "/audi-tt-mk3-sline-2014/factures/carnet-entretien.jpg",
      "/audi-tt-mk3-sline-2014/factures/car-pass.jpg",
      "/audi-tt-mk3-sline-2014/factures/carte-grise-belge.jpg",
      "/audi-tt-mk3-sline-2014/factures/demande-immat.jpg",
      "/audi-tt-mk3-sline-2014/factures/coc-audi.jpg",
    ],
    maintenance: [
      { date: "Fév. 2026", km: "~147 000 km", operation: "Bougies neuves, service Haldex quattro, remplacement pneus Michelin" },
      { date: "Mars 2025", km: "—", operation: "Batterie VARTA A6 AGM neuve + montage en atelier", amount: "301,89 €" },
    ],
  },
  "audi-tt-mk2-sline-2010": {
    dossierUrl: "/Audi%20TT%203/Dossier_Audi_TT_Intelligence_Automobile.pdf",
    maintenance: [
      { date: "Janv. 2026", km: "151 042 km", operation: "Contrôle technique FAVORABLE — valide 28/01/2028 (Autosur Tremblay · PV N° 26049227)" },
      { date: "Juil. 2025", km: "≈ 151 000 km", operation: "Disques AV+AR neufs, plaquettes AV+AR neuves, filtres air et habitacle", amount: "276,96 €" },
      { date: "Nov. 2024", km: "145 762 km", operation: "Entretien intermédiaire huile 5W40 + diagnostic électronique complet (Midas Paris 17)", amount: "109,00 €" },
      { date: "Août 2024", km: "140 168 km", operation: "Contrôle technique FAVORABLE (Securitest Mandelieu · PV N° 24073569)" },
      { date: "Déc. 2023", km: "134 073 km", operation: "Kit distribution, courroie multi-V, bougies, plaquettes AV (ByMyCar Vaucluse)", amount: "355,72 €" },
      { date: "Déc. 2023", km: "138 653 km", operation: "Vidange moteur, filtres" },
      { date: "Avr. 2021", km: "134 073 km", operation: "Vidange moteur, filtres, contrôles (La Chaume Carpentras)" },
      { date: "Août 2019", km: "130 874 km", operation: "Inspection, vidange, filtres air et habitacle, Haldex (Link Gengenbach GmbH DE)" },
      { date: "Sept. 2018", km: "125 334 km", operation: "Inspection, vidange, filtres, Zahnriemen (ACTU GmbH Hannover DE)" },
      { date: "Août 2017", km: "115 176 km", operation: "Inspection, vidange moteur 5W30LL, filtres (Audi Wolfsburg DE)" },
      { date: "Août 2016", km: "105 885 km", operation: "Vidange moteur, huile 5W30LL (Audi Wolfsburg DE)" },
      { date: "Avr. 2015", km: "90 010 km", operation: "Inspection + vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Juil. 2014", km: "78 735 km", operation: "Inspection + vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Août 2013", km: "61 225 km", operation: "Vidange moteur, filtres, contrôles (Glinicke Bad Oeynhausen DE)" },
      { date: "Mai 2013", km: "55 432 km", operation: "Vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Oct. 2012", km: "41 930 km", operation: "Vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Mai 2012", km: "30 234 km", operation: "Vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Oct. 2011", km: "21 215 km", operation: "Inspection Audi, vidange moteur, remplacement filtres (Glinicke Bad Oeynhausen DE)" },
    ],
  },
};

// Convertit un véhicule DB → format modale (priceOnRequest vient de t, passé en param)
export function toModal(v: Vehicle, priceOnRequest: string): ModalVehicle {
  const images = (() => { try { return JSON.parse(v.images) as string[]; } catch { return []; } })();
  const features = (() => { try { return JSON.parse(v.features) as string[]; } catch { return []; } })();
  const featuresEn = (() => { try { return JSON.parse(v.featuresEn) as string[]; } catch { return []; } })();
  const enrichment = VEHICLE_ENRICHMENTS[v.id] ?? {};
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: `${v.mileage.toLocaleString("fr-FR")} km`,
    fuel: v.fuel,
    price: v.price > 0 ? `${v.price.toLocaleString("fr-FR")} €` : priceOnRequest,
    images,
    transmission: v.transmission,
    color: v.color,
    origin: v.origin,
    power: v.power ?? undefined,
    description: v.description,
    descriptionEn: v.descriptionEn,
    features,
    featuresEn,
    status: v.status,
    layoutVariant: "v2",
    ...enrichment,
  };
}
