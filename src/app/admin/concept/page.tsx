import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firstImage } from "../ui";
import ConceptClient from "./ConceptClient";

// Maquette jetable : dashboard cible (sidebar, KPIs animés, graphiques, halos).
// Données de graphiques factices ; seules les photos véhicules sont réelles.
export default async function ConceptPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const recent = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" }, take: 4 });
  const vehicles = recent.map((v) => ({
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    price: v.price,
    status: v.status,
    image: firstImage(v.images),
  }));

  return <ConceptClient vehicles={vehicles} />;
}
