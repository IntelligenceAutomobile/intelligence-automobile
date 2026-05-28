import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehiculeForm from "@/components/VehiculeForm";

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
    status: v.status,
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0B1930", color: "#F0F5FF" }}
    >
      <div
        className="border-b px-6 py-4 flex items-center gap-4"
        style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
      >
        <Link href="/admin/vehicules" className="text-xs tracking-widest uppercase" style={{ color: "#8AABD4" }}>
          ← Stock
        </Link>
        <span className="text-sm font-semibold" style={{ color: "#F0F5FF" }}>
          Modifier : {v.make} {v.model}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <VehiculeForm data={vehiculeData} />
      </div>
    </div>
  );
}
