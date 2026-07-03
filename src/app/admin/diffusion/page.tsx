import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firstImage } from "../ui";
import DiffusionClient, { type DiffVehicle, type ListingRow } from "./DiffusionClient";

export default async function DiffusionPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [vehicles, listings] = await Promise.all([
    prisma.vehicle.findMany({
      where: { isPublished: true, status: { in: ["disponible", "reserve"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.findMany(),
  ]);

  const rows: DiffVehicle[] = vehicles.map((v) => ({
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    price: v.price,
    image: firstImage(v.images),
  }));

  const listingRows: ListingRow[] = listings.map((l) => ({
    vehicleId: l.vehicleId,
    portal: l.portal,
    status: l.status,
    publishedAt: l.publishedAt ? l.publishedAt.toISOString() : null,
  }));

  return <DiffusionClient vehicles={rows} listings={listingRows} />;
}
