import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { warrantyStatus, daysUntil } from "@/lib/warranties";
import GarantiesClient, { type WarrantyRow } from "./GarantiesClient";

export default async function GarantiesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  const canDelete = can(asRole(session.admin.role), "delete");

  const today = new Date().toISOString().slice(0, 10);
  const rows = await prisma.warranty.findMany({ orderBy: { endDate: "asc" } });

  const warranties: WarrantyRow[] = rows.map((w) => ({
    id: w.id,
    clientName: w.clientName,
    vehicleLabel: w.vehicleLabel,
    type: w.type,
    startDate: w.startDate,
    endDate: w.endDate,
    status: warrantyStatus(w.endDate, today),
    daysUntil: daysUntil(w.endDate, today),
  }));

  return <GarantiesClient warranties={warranties} canDelete={canDelete} />;
}
