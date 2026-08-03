import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { brandingFromTheme } from "@/lib/devis";
import { repriseLabel } from "@/lib/reprises";
import RepriseDocument, { type PrintReprise, type Emetteur } from "./RepriseDocument";
import PrintToolbar from "./PrintToolbar";

// CSS d'impression : masque l'habillage admin et la barre d'outils, papier A4
// plein cadre. Même approche que les dossiers d'immatriculation. Le nom de
// classe est le seul lien entre ces règles et le document.
const PRINT_CSS = `
@media print {
  header, aside, nav { display: none !important; }
  .adm-root .lg\\:hidden { display: none !important; }
  .adm-root { display: block !important; background: #fff !important; min-height: 0 !important; }
  .reprise-no-print { display: none !important; }
  .reprise-screen-bg { background: #fff !important; padding: 0 !important; }
  html, body { background: #fff !important; }
  @page { size: A4; margin: 0; }
  /* La feuille occupe une page ; 3 mm de mou évitent qu'un arrondi de rendu
     ne fasse déborder sur une page supplémentaire. */
  .reprise-sheet { min-height: 294mm !important; margin: 0 !important; }
  .reprise-avoid-break { break-inside: avoid; }
}
`;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.reprise.findUnique({
    where: { id },
    select: { reference: true, make: true, model: true, version: true, year: true },
  });
  // Le titre du document sert de nom de fichier au PDF enregistré.
  return { title: r ? `${r.reference} - ${repriseLabel(r)}` : "Offre de reprise" };
}

export default async function ImprimerReprisePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [row, theme] = await Promise.all([
    prisma.reprise.findUnique({ where: { id } }),
    prisma.brandTheme.findUnique({ where: { id: "default" } }),
  ]);
  if (!row) notFound();

  // L'identité complète vient des réglages de marque, avec les valeurs de la
  // société en repli : ce papier sort de la maison, il porte ses mentions.
  const b = brandingFromTheme(theme);
  const emetteur: Emetteur = {
    name: b.emitterName,
    address: b.emitterAddress,
    representative: b.emitterRepresentative,
    email: b.emitterEmail,
    phone: b.emitterPhone,
    siret: b.emitterSiret,
    tva: b.emitterTva,
    footnote: b.legalFootnote,
  };

  const r: PrintReprise = {
    reference: row.reference,
    ownerName: row.ownerName,
    ownerCompany: row.ownerCompany,
    ownerEmail: row.ownerEmail,
    ownerPhone: row.ownerPhone,
    make: row.make,
    model: row.model,
    version: row.version,
    year: row.year,
    mileageKm: row.mileageKm,
    fuel: row.fuel,
    transmission: row.transmission,
    color: row.color,
    plate: row.plate,
    vin: row.vin,
    firstRegDate: row.firstRegDate,
    ctDate: row.ctDate,
    ctStatus: row.ctStatus,
    owners: row.owners,
    serviceBook: row.serviceBook,
    keys: row.keys,
    creditPending: row.creditPending,
    titleInName: row.titleInName,
    condition: row.condition,
    offerCents: row.offerCents,
    offerDate: row.offerDate,
    validityDays: row.validityDays,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PrintToolbar />
      <RepriseDocument r={r} emetteur={emetteur} today={parisDay(new Date()).toISOString().slice(0, 10)} />
    </>
  );
}
