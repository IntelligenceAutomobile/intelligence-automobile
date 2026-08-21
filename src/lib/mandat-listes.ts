// Ce que le back-office sait déjà, pour remplir un mandat plus vite.
//
// Deux aides distinctes :
//
//   • les LISTES : les valeurs déjà saisies ailleurs (marques du stock,
//     modèles des reprises, couleurs, pays d'achat…), proposées en menu
//     déroulant sous les champs. Le champ reste libre : la liste suggère, elle
//     n'impose pas — une marque nouvelle se tape comme avant.
//
//   • les REPÈRES : ce qui ne change pas d'un mandat à l'autre (le numéro de
//     police d'assurance, l'assureur, la ville de signature, la formule
//     d'honoraires habituelle). Repris du dernier mandat, ils s'écrivent une
//     fois et se réécrivent tout seuls ensuite.
//
// Les listes sont classées par fréquence : la marque qu'on saisit tous les
// jours arrive en tête, l'exception reste accessible plus bas.
import { prisma } from "./prisma";
import { MANDAT_TYPES, type MandatType } from "./mandats";
import { MAKES_COURANTES, MODELS_BY_MAKE, getModelsForMake, normalizeLabel } from "./vehicle-catalog";

export type ListesMandat = {
  marques: string[];
  modeles: string[];
  /** Les modèles rangés par marque, la clé étant la marque sans accent ni casse. */
  modelesParMarque: Record<string, string[]>;
  versions: string[];
  couleurs: string[];
  energies: string[];
  pays: string[];
  lieux: string[];
  assureurs: string[];
};

// Les pays d'où viennent les imports, proposés même quand aucun mandat
// n'existe encore : la liste doit servir dès le premier contrat.
const PAYS_SEMES = [
  "Allemagne", "Belgique", "Espagne", "Italie", "Pays-Bas",
  "Luxembourg", "Autriche", "Portugal", "Pologne", "Suède", "Danemark",
];

const LIMITE = 60;
/** Les listes de modèles sont plus longues : un catalogue de marque les remplit. */
const LIMITE_MODELES = 120;

/**
 * Classe par nombre d'occurrences, puis par l'ordre de la liste semée, puis
 * par ordre alphabétique.
 *
 * Le rang de semis compte : « Allemagne » ouvre les pays d'import et « Audi »
 * les marques parce qu'ils arrivent en tête de leur liste, sans attendre qu'un
 * dossier les ait fait remonter.
 */
function parFrequence(
  valeurs: (string | null | undefined)[],
  semees: string[] = [],
  limite = LIMITE,
): string[] {
  const compte = new Map<string, number>();
  for (const brut of valeurs) {
    const v = (brut ?? "").trim();
    if (v === "" || v.length > 60) continue;
    // « audi » et « Audi » comptent ensemble, la forme la plus vue l'emporte.
    const cle = v.toLowerCase();
    compte.set(cle, (compte.get(cle) ?? 0) + 1);
  }
  const formes = new Map<string, string>();
  for (const brut of valeurs) {
    const v = (brut ?? "").trim();
    if (v === "") continue;
    if (!formes.has(v.toLowerCase())) formes.set(v.toLowerCase(), v);
  }
  const rang = new Map<string, number>();
  semees.forEach((s, i) => {
    const cle = s.toLowerCase();
    if (!compte.has(cle)) compte.set(cle, 0);
    if (!formes.has(cle)) formes.set(cle, s);
    if (!rang.has(cle)) rang.set(cle, i);
  });
  const SANS_RANG = Number.MAX_SAFE_INTEGER;
  return [...compte.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        (rang.get(a[0]) ?? SANS_RANG) - (rang.get(b[0]) ?? SANS_RANG) ||
        a[0].localeCompare(b[0], "fr"),
    )
    .map(([cle]) => formes.get(cle) ?? cle)
    .slice(0, limite);
}

/**
 * Les valeurs déjà connues, à proposer sous les champs du mandat.
 *
 * Trois sources : le stock, les estimations de reprise et les mandats
 * eux-mêmes. Seules les colonnes utiles remontent.
 */
export async function listesMandat(): Promise<ListesMandat> {
  const [vehicules, reprises, mandats] = await Promise.all([
    prisma.vehicle.findMany({ select: { make: true, model: true, color: true, fuel: true } }),
    prisma.reprise.findMany({ select: { make: true, model: true, version: true, color: true, fuel: true } }),
    prisma.mandat.findMany({
      select: {
        make: true, model: true, version: true, color: true, fuel: true,
        countryOrigin: true, signPlace: true, rcInsurer: true,
      },
    }),
  ]);

  const tout = [...vehicules, ...reprises, ...mandats] as {
    make?: string; model?: string; version?: string; color?: string; fuel?: string;
  }[];

  // Les modèles se rangent sous leur marque : choisir « Renault » doit
  // proposer la Clio et le Captur, pas les Q5 du stock. Ce que la maison a
  // déjà vendu passe devant le catalogue.
  const vus = new Map<string, string[]>();
  for (const v of tout) {
    const marque = normalizeLabel(v.make ?? "");
    const modele = (v.model ?? "").trim();
    if (marque === "" || modele === "") continue;
    vus.set(marque, [...(vus.get(marque) ?? []), modele]);
  }
  const modelesParMarque: Record<string, string[]> = {};
  for (const marque of new Set([...vus.keys(), ...Object.keys(MODELS_BY_MAKE).map(normalizeLabel)])) {
    modelesParMarque[marque] = parFrequence(
      vus.get(marque) ?? [],
      getModelsForMake(marque),
      LIMITE_MODELES,
    );
  }

  return {
    marques: parFrequence(tout.map((v) => v.make), MAKES_COURANTES),
    modeles: parFrequence(tout.map((v) => v.model)),
    modelesParMarque,
    versions: parFrequence(tout.map((v) => v.version)),
    couleurs: parFrequence(tout.map((v) => v.color)),
    energies: parFrequence(tout.map((v) => v.fuel)),
    pays: parFrequence(mandats.map((m) => m.countryOrigin), PAYS_SEMES),
    lieux: parFrequence(mandats.map((m) => m.signPlace)),
    assureurs: parFrequence(mandats.map((m) => m.rcInsurer)),
  };
}

export type RepereMandat = {
  rcPolicy: string;
  rcInsurer: string;
  signPlace: string;
  feeFormula: string;
  custody: string;
  durationDays: number;
};

/**
 * Ce qui se répète d'un mandat au suivant, relevé sur les derniers contrats.
 *
 * Champ par champ, on garde la dernière valeur RENSEIGNÉE : un mandat où la
 * police d'assurance a été oubliée ne fait pas perdre celle d'avant. C'est ce
 * qui évite de retaper à chaque contrat une assurance qui ne change jamais.
 */
export async function repereMandat(type: MandatType): Promise<RepereMandat> {
  const derniers = await prisma.mandat.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      type: true, rcPolicy: true, rcInsurer: true, signPlace: true,
      feeFormula: true, custody: true, durationDays: true,
    },
  });

  const dernierRempli = (lire: (m: (typeof derniers)[number]) => string): string => {
    for (const m of derniers) {
      const v = lire(m).trim();
      if (v !== "") return v;
    }
    return "";
  };

  // La formule d'honoraires et la garde se lisent sur les mandats DU MÊME
  // TYPE : une vente n'a rien à apprendre d'un import sur ce point.
  const memeType = derniers.filter((m) => m.type === type);
  const dernierDuType = memeType[0];

  return {
    rcPolicy: dernierRempli((m) => m.rcPolicy),
    rcInsurer: dernierRempli((m) => m.rcInsurer),
    signPlace: dernierRempli((m) => m.signPlace),
    feeFormula: dernierDuType?.feeFormula ?? "acquereur",
    custody: dernierDuType?.custody ?? "vendeur",
    durationDays: dernierDuType?.durationDays ?? 60,
  };
}

/** Les fiches clients proposées au choix, les plus récemment actives d'abord. */
export async function clientsPourMandat() {
  const rows = await prisma.client.findMany({
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: { id: true, name: true, company: true, email: true, phone: true },
  });
  return rows.filter((c) => (c.company || c.name).trim() !== "");
}

/** Les véhicules du parc encore à vendre, pour partir d'une fiche existante. */
export async function vehiculesPourMandat() {
  return prisma.vehicle.findMany({
    where: { status: { in: ["disponible", "reserve"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, make: true, model: true, year: true, mileage: true,
      fuel: true, color: true, price: true, power: true, status: true,
    },
  });
}

/** Les trois références proposées, une par type de mandat. */
export function referencesProposees(
  refsPrises: readonly string[],
  annee: string,
  prefixe: (t: MandatType, a: string) => string,
  suivante: (p: string, prises: readonly string[]) => string,
): Record<MandatType, string> {
  return Object.fromEntries(
    MANDAT_TYPES.map((t) => [t, suivante(prefixe(t, annee), refsPrises)]),
  ) as Record<MandatType, string>;
}
