import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { completeness, missingEssentials, daysBetween } from "@/lib/vehicules";
import { computeMargin } from "@/lib/vehicle-tracking";
import { AdminPage, PageHeader, firstImage } from "../ui";
import StockList, { type StockItem } from "./StockList";

const VALID_FILTERS = ["disponible", "reserve", "vendu", "a-completer", "dorment"];
// Les clés de tri acceptées dans l'adresse : une valeur inconnue retombe sur
// l'ordre par défaut au lieu d'être passée telle quelle au composant.
const VALID_SORTS = [
  "recent", "age-desc", "age-asc", "vehicule-asc", "vehicule-desc",
  "prix-desc", "prix-asc", "km-asc", "km-desc", "marge-desc", "marge-asc",
  "statut-asc", "statut-desc",
];

// Nombre d'entrées d'une colonne JSON, sans jamais lever sur une valeur abîmée.
function countJson(raw: string): number {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v) => v !== null && v !== "").length : 0;
  } catch {
    return 0;
  }
}

export default async function AdminVehiculesList({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; tri?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  const canDelete = can(asRole(session.admin.role), "delete");

  const { statut, q, tri } = await searchParams;
  const initialFilter = statut && VALID_FILTERS.includes(statut) ? statut : "all";
  const initialSort = tri && VALID_SORTS.includes(tri) ? tri : "recent";

  const [vehicules, costs, openNotes] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    // Frais par véhicule : donnent la marge, déjà calculée dans l'écran de suivi
    // mais invisible là où se prennent les décisions de prix.
    prisma.vehicleCost.findMany({ select: { vehicleId: true, category: true, amountCents: true } }),
    // Problèmes constatés restés à régler, remontés du journal d'enquête.
    prisma.vehicleNote.findMany({ where: { type: "probleme", resolved: false }, select: { vehicleId: true } }),
  ]);

  const costsByVehicle = new Map<string, { total: number; hasPurchase: boolean }>();
  for (const c of costs) {
    const entry = costsByVehicle.get(c.vehicleId) ?? { total: 0, hasPurchase: false };
    entry.total += c.amountCents;
    if (c.category === "achat") entry.hasPurchase = true;
    costsByVehicle.set(c.vehicleId, entry);
  }

  const problemsByVehicle = new Map<string, number>();
  for (const n of openNotes) {
    problemsByVehicle.set(n.vehicleId, (problemsByVehicle.get(n.vehicleId) ?? 0) + 1);
  }

  const now = new Date();

  const items: StockItem[] = vehicules.map((v) => {
    const image = firstImage(v.images);
    const photoCount = countJson(v.images);
    const health = completeness({
      image,
      price: v.price,
      photoCount,
      hasDescription: v.description.trim().length >= 200,
      featureCount: countJson(v.features),
      documentCount: countJson(v.documents),
    });
    const cost = costsByVehicle.get(v.id);

    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      mileage: v.mileage,
      price: v.price,
      fuel: v.fuel,
      origin: v.origin,
      color: v.color,
      power: v.power,
      status: v.status,
      image,
      photoCount,
      isPublished: v.isPublished,
      daysInStock: daysBetween(v.createdAt, now),
      // La marge n'a de sens qu'avec un prix d'achat saisi : sinon le chiffre
      // soustrait des frais d'une voiture qu'on croit gratuite.
      marginCents: cost?.hasPurchase ? computeMargin(v.price, cost.total).marginCents : null,
      openProblems: problemsByVehicle.get(v.id) ?? 0,
      completeness: health.score,
      // « blocking » sert au compte et au filtre « à compléter », avec la même
      // règle que le tableau de bord. « todo » n'alimente que l'infobulle et la
      // note « Fiche x/4 » : mélanger les deux faisait diverger les compteurs.
      blocking: missingEssentials({ image, price: v.price }),
      todo: health.missing,
    };
  });

  const available = items.filter((v) => v.status === "disponible");
  const hidden = items.filter((v) => !v.isPublished).length;

  return (
    <AdminPage>
      <PageHeader
        title="Gestion du stock"
        subtitle={
          items.length === 0
            ? "Vos annonces, publiées ou masquées."
            : `${items.length} véhicule${items.length > 1 ? "s" : ""} · ${available.length} disponible${available.length > 1 ? "s" : ""}` +
              (hidden > 0 ? `, ${hidden} masqué${hidden > 1 ? "s" : ""}` : "")
        }
      />
      <StockList
        vehicles={items}
        initialFilter={initialFilter}
        initialQuery={q ?? ""}
        initialSort={initialSort}
        canDelete={canDelete}
        facturation
      />
    </AdminPage>
  );
}
