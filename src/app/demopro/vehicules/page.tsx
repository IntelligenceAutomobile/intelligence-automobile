// Liste du stock de la démonstration publique /demopro.
// Reproduit la page « Gestion du stock » du back-office, alimentée par les
// données d'exemple figées (src/lib/demo-data.ts). Aucun accès base.
import { Plus } from "lucide-react";
import { AdminPage, PageHeader, firstImage, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoVehicles } from "@/lib/demo-data";
import DemoActionButton from "../DemoActionButton";
import DemoStockList, { type DemoStockItem } from "./DemoStockList";

const VALID_FILTERS = ["disponible", "reserve", "vendu"];

export default async function DemoVehiculesList({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const initialFilter = statut && VALID_FILTERS.includes(statut) ? statut : "all";

  const items: DemoStockItem[] = getDemoVehicles()
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((v) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      mileage: v.mileage,
      price: v.price,
      fuel: v.fuel,
      origin: v.origin,
      status: v.status,
      image: firstImage(v.images),
      isPublished: v.isPublished,
    }));

  return (
    <AdminPage>
      <PageHeader
        title="Gestion du stock"
        subtitle="Toutes vos annonces, publiées ou masquées."
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Ajouter
          </DemoActionButton>
        }
      />
      <DemoStockList vehicles={items} initialFilter={initialFilter} />
    </AdminPage>
  );
}
