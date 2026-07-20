import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRegType, isVatRegime } from "@/lib/immatriculation";
import DossierDocument, { type PrintDossier } from "./DossierDocument";
import PrintToolbar from "./PrintToolbar";

// CSS d'impression : masque l'habillage admin et la barre d'outils, papier A4
// plein cadre. Même approche que la page d'impression des devis.
const PRINT_CSS = `
@media print {
  header, aside, nav { display: none !important; }
  .adm-root .lg\\:hidden { display: none !important; }
  .adm-root { display: block !important; background: #fff !important; min-height: 0 !important; }
  .dossier-no-print { display: none !important; }
  .dossier-screen-bg { background: #fff !important; padding: 0 !important; }
  html, body { background: #fff !important; }
  @page { size: A4; margin: 0; }
  /* Chaque feuille occupe une page ; 3mm de mou évitent qu'un arrondi de rendu
     ne fasse déborder sur une page supplémentaire. */
  .dossier-sheet { min-height: 294mm !important; margin: 0 !important; break-after: page; }
  .dossier-sheet:last-child { break-after: auto; }
  .dossier-avoid-break { break-inside: avoid; }
}
`;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.registration.findUnique({ where: { id }, select: { reference: true, vehicleLabel: true } });
  const title = `${row?.reference ?? "Dossier"}${row?.vehicleLabel ? ` - ${row.vehicleLabel}` : ""}`;
  return { title };
}

export default async function ImprimerDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [row, theme] = await Promise.all([
    prisma.registration.findUnique({ where: { id } }),
    prisma.brandTheme.findUnique({ where: { id: "default" }, select: { name: true } }),
  ]);
  if (!row) notFound();

  const d: PrintDossier = {
    reference: row.reference,
    type: isRegType(row.type) ? row.type : "import_ue",
    vehicleLabel: row.vehicleLabel,
    vin: row.vin,
    plateForeign: row.plateForeign,
    plateFinal: row.plateFinal,
    countryOrigin: row.countryOrigin,
    firstRegDate: row.firstRegDate,
    mileageKm: row.mileageKm,
    holderName: row.holderName,
    holderAddress: row.holderAddress,
    acquiredOn: row.acquiredOn,
    deliveredOn: row.deliveredOn,
    registeredOn: row.registeredOn,
    vatRegime: isVatRegime(row.vatRegime) ? row.vatRegime : "occasion",
    quitusRef: row.quitusRef,
    quitusDate: row.quitusDate,
    sivRef: row.sivRef,
    documents: JSON.parse(row.documents || "[]") as string[],
    notes: row.notes,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PrintToolbar />
      <DossierDocument d={d} emitter={theme?.name ?? "Intelligence Automobile"} today={new Date().toISOString().slice(0, 10)} />
    </>
  );
}
