import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firstImage } from "../../../ui";
import SuiviClient, { type CostRow, type NoteRow } from "./SuiviClient";

export default async function SuiviPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [vehicle, costs, notes, reprise] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id } }),
    prisma.vehicleCost.findMany({ where: { vehicleId: id }, orderBy: { date: "desc" } }),
    prisma.vehicleNote.findMany({ where: { vehicleId: id }, orderBy: { createdAt: "desc" } }),
    // D'où vient cette voiture : une reprise client garde le lien vers son
    // estimation, où vivent l'état constaté le jour de l'évaluation et le
    // vendeur, information dont le dossier d'immatriculation a besoin.
    prisma.reprise.findFirst({
      where: { vehicleId: id },
      select: { id: true, reference: true, ownerName: true, ownerCompany: true, clientId: true },
    }),
  ]);
  if (!vehicle) notFound();

  const costRows: CostRow[] = costs.map((c) => ({
    id: c.id,
    category: c.category,
    label: c.label,
    amountCents: c.amountCents,
    date: c.date,
  }));
  const noteRows: NoteRow[] = notes.map((n) => ({
    id: n.id,
    type: n.type,
    content: n.content,
    resolved: n.resolved,
    author: n.author,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <SuiviClient
      vehicle={{
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        status: vehicle.status,
        image: firstImage(vehicle.images),
      }}
      costs={costRows}
      notes={noteRows}
      origine={
        reprise
          ? {
              repriseId: reprise.id,
              reference: reprise.reference,
              vendeur: reprise.ownerCompany || reprise.ownerName,
              clientId: reprise.clientId,
            }
          : null
      }
    />
  );
}
