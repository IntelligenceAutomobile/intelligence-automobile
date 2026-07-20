import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { checklistFor, checklistProgress, deadlines, isRegType, isVatRegime, type RegStatus } from "@/lib/immatriculation";
import ImmatriculationsClient, { type RegRow, type StockVehicle } from "./ImmatriculationsClient";

export default async function ImmatriculationsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  const canDelete = can(asRole(session.admin.role), "delete");

  const today = new Date().toISOString().slice(0, 10);
  const [rows, stock] = await Promise.all([
    prisma.registration.findMany({ orderBy: { createdAt: "desc" } }),
    // Le stock alimente le pré-remplissage du dossier : marque, modèle, année,
    // kilométrage et pays d'origine sont déjà saisis sur la fiche véhicule.
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true, mileage: true, origin: true },
    }),
  ]);

  const registrations: RegRow[] = rows.map((r) => {
    const type = isRegType(r.type) ? r.type : "import_ue";
    const regime = isVatRegime(r.vatRegime) ? r.vatRegime : "occasion";
    const provided = JSON.parse(r.documents || "[]") as string[];
    const progress = checklistProgress(checklistFor(type, regime), provided);
    // L'échéance affichée est la plus urgente parmi celles encore ouvertes.
    const open = deadlines(
      { type, deliveredOn: r.deliveredOn, acquiredOn: r.acquiredOn, registeredOn: r.registeredOn, quitusDate: r.quitusDate },
      today,
    ).filter((d) => d.key !== "archivage" && d.tone !== "success");

    return {
      id: r.id,
      reference: r.reference,
      type,
      status: r.status as RegStatus,
      vehicleLabel: r.vehicleLabel,
      holderName: r.holderName,
      countryOrigin: r.countryOrigin,
      plateFinal: r.plateFinal,
      vatRegime: regime,
      done: progress.done,
      total: progress.total,
      nextDeadline: open.length > 0 ? open.sort((a, b) => a.daysLeft - b.daysLeft)[0] : null,
    };
  });

  const vehicles: StockVehicle[] = stock.map((v) => ({
    id: v.id,
    label: `${v.make} ${v.model} (${v.year})`,
    mileage: v.mileage,
    origin: v.origin,
  }));

  return <ImmatriculationsClient registrations={registrations} vehicles={vehicles} canDelete={canDelete} />;
}
