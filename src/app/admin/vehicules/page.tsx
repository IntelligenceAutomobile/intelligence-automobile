import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPage, PageHeader, firstImage, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import StockList, { type StockItem } from "./StockList";

const VALID_FILTERS = ["disponible", "reserve", "vendu"];

export default async function AdminVehiculesList({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { statut } = await searchParams;
  const initialFilter = statut && VALID_FILTERS.includes(statut) ? statut : "all";

  const vehicules = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  const items: StockItem[] = vehicules.map((v) => ({
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
          <div className="flex items-center gap-3">
            <Link href="/admin/vehicules/modale-apercu" className={btnGhostClass} style={btnGhostStyle}>
              Aperçu ancienne modale
            </Link>
            <Link href="/admin/vehicules/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>
              + Ajouter
            </Link>
          </div>
        }
      />
      <StockList vehicles={items} initialFilter={initialFilter} />
    </AdminPage>
  );
}
