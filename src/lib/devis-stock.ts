import { prisma } from "@/lib/prisma";

// Le stock tel que l'éditeur de devis en a besoin : la fiche commerciale, le
// coût de revient (pour la marge affichée au vendeur), et l'identité
// administrative du véhicule (numéro de série, plaque, 1re mise en
// circulation), qui vit dans le dossier d'immatriculation.
export type StockVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  transmission: string;
  power: number | null;
  status?: string;
  color: string;
  origin: string;
  costCents: number;
  // Recopiés du dossier d'immatriculation quand il existe.
  vin: string;
  plate: string;
  firstRegDate: string;
  photoUrl: string;
};

function firstImage(raw: string): string {
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && typeof list[0] === "string") return list[0];
  } catch {
    /* une fiche sans photo reste une fiche valide */
  }
  return "";
}

/**
 * Stock complet pour l'éditeur de devis, dans l'ordre d'ajout décroissant.
 * Une seule fonction pour les deux écrans (nouveau devis et devis existant) :
 * la requête était recopiée des deux côtés et divergeait.
 */
export async function loadStockForQuotes(): Promise<StockVehicle[]> {
  const [vehicles, costs] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, make: true, model: true, year: true, mileage: true, price: true,
        fuel: true, transmission: true, power: true, status: true, color: true,
        origin: true, images: true,
      },
    }),
    prisma.vehicleCost.groupBy({ by: ["vehicleId"], _sum: { amountCents: true } }),
  ]);

  const costByVehicle = new Map(costs.map((c) => [c.vehicleId, c._sum.amountCents ?? 0]));

  // Dossier d'immatriculation le plus récent par véhicule : c'est là que vivent
  // le numéro de série et la plaque, jamais sur la fiche commerciale.
  const dossiers = await prisma.registration.findMany({
    where: { vehicleId: { in: vehicles.map((v) => v.id) } },
    orderBy: { updatedAt: "desc" },
    select: { vehicleId: true, vin: true, plateFinal: true, plateForeign: true, firstRegDate: true, countryOrigin: true },
  });
  const dossierByVehicle = new Map<string, (typeof dossiers)[number]>();
  for (const d of dossiers) {
    if (d.vehicleId && !dossierByVehicle.has(d.vehicleId)) dossierByVehicle.set(d.vehicleId, d);
  }

  return vehicles.map((v) => {
    const d = dossierByVehicle.get(v.id);
    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      mileage: v.mileage,
      price: v.price,
      fuel: v.fuel,
      transmission: v.transmission,
      power: v.power,
      status: v.status,
      color: v.color,
      origin: v.origin,
      costCents: costByVehicle.get(v.id) ?? 0,
      vin: d?.vin ?? "",
      // La plaque française obtenue prime sur l'immatriculation d'origine.
      plate: d?.plateFinal || d?.plateForeign || "",
      firstRegDate: d?.firstRegDate ?? "",
      photoUrl: firstImage(v.images),
    };
  });
}
