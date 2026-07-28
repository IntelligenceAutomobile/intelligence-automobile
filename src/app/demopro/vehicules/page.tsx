// Liste du stock de la démonstration publique /demopro.
// Rend le MÊME composant que le back-office (src/app/admin/vehicules/StockList),
// alimenté par les données d'exemple figées. Le mode démonstration remplace
// chaque écriture par un message : rien ne part, rien ne s'enregistre.
// Aucun accès base, conformément au garde-fou de eslint.config.mjs.
import { Plus } from "lucide-react";
import { AdminPage, PageHeader, firstImage, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import StockList, { type StockItem } from "@/app/admin/vehicules/StockList";
import { completeness, missingEssentials, daysBetween } from "@/lib/vehicules";
import { computeMargin } from "@/lib/vehicle-tracking";
import { getDemoVehicles, getDemoVehicleCosts, getDemoVehicleNotes } from "@/lib/demo-data";
import DemoActionButton from "../DemoActionButton";
import { DEMO_BASE, DEMO_MSG } from "../demo";

const VALID_FILTERS = ["disponible", "reserve", "vendu", "a-completer", "dorment"];

function countJson(raw: string): number {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v) => v !== null && v !== "").length : 0;
  } catch {
    return 0;
  }
}

export default async function DemoVehiculesList({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; tri?: string }>;
}) {
  const { statut, q, tri } = await searchParams;
  const initialFilter = statut && VALID_FILTERS.includes(statut) ? statut : "all";

  const now = new Date();

  const items: StockItem[] = getDemoVehicles()
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((v) => {
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

      const costs = getDemoVehicleCosts(v.id);
      const total = costs.reduce((sum, c) => sum + c.amountCents, 0);
      const hasPurchase = costs.some((c) => c.category === "achat");

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
        marginCents: hasPurchase ? computeMargin(v.price, total).marginCents : null,
        openProblems: getDemoVehicleNotes(v.id).filter((n) => n.type === "probleme" && !n.resolved).length,
        completeness: health.score,
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
          `${items.length} véhicule${items.length > 1 ? "s" : ""} · ${available.length} disponible${available.length > 1 ? "s" : ""}` +
          (hidden > 0 ? `, ${hidden} masqué${hidden > 1 ? "s" : ""}` : "")
        }
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Ajouter
          </DemoActionButton>
        }
      />
      <StockList
        vehicles={items}
        initialFilter={initialFilter}
        initialQuery={q ?? ""}
        initialSort={tri ?? "recent"}
        canDelete
        demoMessage={DEMO_MSG}
        // Les fiches de la démo restent dans la démo, et ses véhicules n'ont
        // pas d'annonce publique puisque ce sont des exemples.
        base={`${DEMO_BASE}/vehicules`}
        publicBase={null}
      />
    </AdminPage>
  );
}
