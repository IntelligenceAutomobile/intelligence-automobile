import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPage, PageHeader, firstImage, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import StockList, { type StockItem } from "./StockList";

export default async function AdminVehiculesList() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

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
  }));

  return (
    <AdminPage>
      <PageHeader
        title="Gestion du stock"
        subtitle="Toutes vos annonces, publiées ou masquées."
        action={
          <Link href="/admin/vehicules/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>
            + Ajouter
          </Link>
        }
      />
      <StockList vehicles={items} />
    </AdminPage>
  );
}
