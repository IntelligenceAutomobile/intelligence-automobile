import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehiculeForm from "@/components/VehiculeForm";
import { T, AdminPage, PageHeader } from "../../ui";

export default async function EditVehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) notFound();

  const vehiculeData = {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    color: v.color,
    transmission: v.transmission,
    fuel: v.fuel,
    power: v.power,
    origin: v.origin,
    description: v.description,
    features: JSON.parse(v.features) as string[],
    images: JSON.parse(v.images) as string[],
    conditionFacts: JSON.parse(v.conditionFacts || "[]"),
    maintenanceHistory: JSON.parse(v.maintenanceHistory || "[]"),
    maintenanceHighlights: JSON.parse(v.maintenanceHighlights || "[]"),
    documents: JSON.parse(v.documents || "[]"),
    status: v.status,
    isPublished: v.isPublished,
  };

  return (
    <AdminPage width="wide">
      <Link
        href="/admin/vehicules"
        className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        ← Stock
      </Link>
      <PageHeader title={`${v.make} ${v.model}`} subtitle="Modifier la fiche du véhicule." />
      <VehiculeForm data={vehiculeData} />
    </AdminPage>
  );
}
