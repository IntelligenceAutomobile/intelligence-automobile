import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRegType, isVatRegime, type RegStatus } from "@/lib/immatriculation";
import DossierClient, { type Dossier } from "./DossierClient";

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const r = await prisma.registration.findUnique({ where: { id } });
  if (!r) notFound();

  const dossier: Dossier = {
    id: r.id,
    reference: r.reference,
    type: isRegType(r.type) ? r.type : "import_ue",
    status: r.status as RegStatus,
    vehicleLabel: r.vehicleLabel,
    vin: r.vin,
    plateForeign: r.plateForeign,
    plateFinal: r.plateFinal,
    countryOrigin: r.countryOrigin,
    firstRegDate: r.firstRegDate,
    mileageKm: r.mileageKm,
    holderName: r.holderName,
    holderAddress: r.holderAddress,
    acquiredOn: r.acquiredOn,
    deliveredOn: r.deliveredOn,
    registeredOn: r.registeredOn,
    vatRegime: isVatRegime(r.vatRegime) ? r.vatRegime : "occasion",
    purchaseCents: r.purchaseCents,
    quitusRef: r.quitusRef,
    quitusDate: r.quitusDate,
    sivRef: r.sivRef,
    archiveRef: r.archiveRef,
    archivedAt: r.archivedAt,
    documents: JSON.parse(r.documents || "[]") as string[],
    notes: r.notes,
  };

  return <DossierClient dossier={dossier} today={new Date().toISOString().slice(0, 10)} />;
}
