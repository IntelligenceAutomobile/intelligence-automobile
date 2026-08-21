import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { voitMandats } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { COMPANY } from "@/lib/company";
import { MANDAT_TYPE_LABEL, isMandatType, mandatVehiculeLabel } from "@/lib/mandats";
import MandatDocument, { type PrintMandat, type Emetteur } from "./MandatDocument";
import MandatDocumentRecherche from "./MandatDocumentRecherche";
import MandatDocumentImport from "./MandatDocumentImport";
import PrintToolbar from "./PrintToolbar";
import DocAdapte from "./DocAdapte";

// CSS d'impression : masque l'habillage admin et la barre d'outils, papier A4
// plein cadre. Même approche que les offres de reprise, avec une différence :
// le mandat tient sur trois feuilles, chacune pousse la suivante sur sa page.
const PRINT_CSS = `
@media print {
  header, aside, nav { display: none !important; }
  .adm-root .lg\\:hidden { display: none !important; }
  .adm-root { display: block !important; background: #fff !important; min-height: 0 !important; }
  .mandat-no-print { display: none !important; }
  .mandat-screen-bg { background: #fff !important; padding: 0 !important; gap: 0 !important; }
  html, body { background: #fff !important; }
  @page { size: A4; margin: 0; }
  /* Chaque feuille occupe une page ; 3 mm de mou évitent qu'un arrondi de
     rendu ne fasse déborder sur une page supplémentaire. */
  .mandat-sheet { min-height: 294mm !important; margin: 0 !important; break-after: page; }
  .mandat-sheet:last-child { break-after: auto; }
  .mandat-avoid-break { break-inside: avoid; }
}
`;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.mandat.findUnique({
    where: { id },
    select: { reference: true, type: true, make: true, model: true, version: true },
  });
  // Le titre du document sert de nom de fichier au PDF enregistré.
  if (!m) return { title: "Mandat" };
  const typeLabel = MANDAT_TYPE_LABEL[isMandatType(m.type) ? m.type : "vente"];
  return { title: `${m.reference} - ${typeLabel} ${mandatVehiculeLabel(m)}` };
}

export default async function ImprimerMandatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Lancement nominatif du 21 août 2026 : Fab, puis César à 16 h.
  const collab = await getCollabSession();
  if (!voitMandats(session.admin.email, collab?.name)) redirect("/admin");

  const { id } = await params;
  const row = await prisma.mandat.findUnique({ where: { id } });
  if (!row) notFound();

  // Un contrat se signe au nom réel : l'identité vient de la société, jamais
  // des réglages de marque blanche. Ceux-ci habillent les devis ; un mandat
  // dont le pied de page dirait autre chose que l'article 1 serait incohérent.
  const emetteur: Emetteur = {
    name: COMPANY.legalName,
    address: COMPANY.addressLines.join("\n"),
    representative: COMPANY.representative,
    email: COMPANY.email,
    phone: COMPANY.phone,
    siret: COMPANY.siret,
    tva: COMPANY.tvaNumber,
  };

  const m: PrintMandat = {
    reference: row.reference,
    createdOn: parisDay(row.createdAt).toISOString().slice(0, 10),
    ownerName: row.ownerName,
    ownerBirthDate: row.ownerBirthDate,
    ownerAddress: row.ownerAddress,
    ownerEmail: row.ownerEmail,
    ownerPhone: row.ownerPhone,
    ownerIdNumber: row.ownerIdNumber,
    rcPolicy: row.rcPolicy,
    rcInsurer: row.rcInsurer,
    make: row.make,
    model: row.model,
    version: row.version,
    power: row.power,
    plate: row.plate,
    vin: row.vin,
    firstRegDate: row.firstRegDate,
    mileageKm: row.mileageKm,
    fuel: row.fuel,
    color: row.color,
    keys: row.keys,
    ctDate: row.ctDate,
    ctStatus: row.ctStatus,
    lastServiceKm: row.lastServiceKm,
    disclosures: row.disclosures,
    priceCents: row.priceCents,
    floorCents: row.floorCents,
    feeFormula: row.feeFormula,
    packCents: row.packCents,
    searchSpec: row.searchSpec,
    budgetCents: row.budgetCents,
    mileageMaxKm: row.mileageMaxKm,
    regMinYear: row.regMinYear,
    listingUrl: row.listingUrl,
    countryOrigin: row.countryOrigin,
    feeCents: row.feeCents,
    startDate: row.startDate,
    durationDays: row.durationDays,
    custody: row.custody,
    custodyDate: row.custodyDate,
    signMode: row.signMode,
    immediateExecution: row.immediateExecution,
    signPlace: row.signPlace,
    signedOn: row.signedOn,
    signerName: row.signerName,
    signedAt: row.signedAt,
    signedIp: row.signedIp,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PrintToolbar />
      <DocAdapte>
        {row.type === "recherche" ? (
          <MandatDocumentRecherche m={m} emetteur={emetteur} />
        ) : row.type === "import" ? (
          <MandatDocumentImport m={m} emetteur={emetteur} />
        ) : (
          <MandatDocument m={m} emetteur={emetteur} />
        )}
      </DocAdapte>
    </>
  );
}
