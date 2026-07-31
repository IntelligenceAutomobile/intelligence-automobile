import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { isRepriseStatus, repriseLabel } from "@/lib/reprises";
import ReprisesClient, { type RepriseRow } from "./ReprisesClient";

export default async function ReprisesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  // Classement sur la date de l'offre : une estimation de mars rouverte ce
  // matin restait sinon en tête, avec la mention « il y a 2 min ».
  const reprises = await prisma.reprise.findMany({
    orderBy: [{ offerDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, reference: true, status: true, clientId: true,
      make: true, model: true, version: true, year: true,
      plate: true, vin: true, mileageKm: true, fuel: true,
      ownerName: true, ownerCompany: true,
      offerCents: true, offerDate: true, createdAt: true,
    },
  });

  // Une seule heure de référence pour toute la page, comme le carnet clients.
  const maintenant = new Date();

  const lignes: RepriseRow[] = reprises.map((r) => ({
    id: r.id,
    reference: r.reference,
    status: isRepriseStatus(r.status) ? r.status : "brouillon",
    clientId: r.clientId,
    vehicule: repriseLabel(r),
    vendeur: r.ownerCompany || r.ownerName,
    plate: r.plate,
    vin: r.vin,
    make: r.make,
    model: r.model,
    version: r.version,
    mileageKm: r.mileageKm,
    fuel: r.fuel,
    offerCents: r.offerCents,
    offerDate: r.offerDate,
    anciennete: timeAgo((r.offerDate ? new Date(`${r.offerDate}T12:00:00Z`) : r.createdAt).toISOString(), maintenant),
  }));

  return <ReprisesClient reprises={lignes} />;
}
