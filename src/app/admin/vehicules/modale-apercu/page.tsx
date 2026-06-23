import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPage, PageHeader, T } from "@/app/admin/ui";
import ModaleApercuClient from "./ModaleApercuClient";
import type { Vehicle } from "./modalData";

export const metadata = {
  title: "Aperçu ancienne modale — Admin",
};

export default async function ModaleApercuPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const rows = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, make: true, model: true, year: true, mileage: true,
      price: true, fuel: true, transmission: true, color: true, images: true,
      features: true, featuresEn: true, status: true, origin: true,
      power: true, description: true, descriptionEn: true,
    },
  });
  const vehicles = rows as Vehicle[];

  return (
    <AdminPage>
      <PageHeader
        title="Aperçu ancienne modale"
        subtitle="La fenêtre véhicule retirée du site public, conservée ici pour référence."
        action={
          <Link
            href="/admin/vehicules"
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ color: T.accent }}
          >
            ← Retour au stock
          </Link>
        }
      />
      <ModaleApercuClient vehicles={vehicles} />
    </AdminPage>
  );
}
