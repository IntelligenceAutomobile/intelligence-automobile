import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeBranding, mergeVehicleBlock, type QuoteData, type QuoteItem, type TvaMode, type DepositMode, type QuoteStatus, type QuoteKind, type DocType, type FactureKind, type PaymentStatus } from "@/lib/devis";
import DevisDocument from "../../DevisDocument";
import PrintToolbar from "./PrintToolbar";

// CSS d'impression : masque l'habillage admin + la barre d'outils, papier A4 plein cadre.
const PRINT_CSS = `
@media print {
  /* Habillage admin : Topbar (header), Sidebar (aside), et la bande mobile
     logo + nav (la largeur papier est sous le breakpoint lg, c'est donc elle
     qui s'imprimait au-dessus du devis et poussait le pied en page 2). */
  header, aside, nav { display: none !important; }
  .adm-root .lg\\:hidden { display: none !important; }
  .adm-root { display: block !important; background: #fff !important; min-height: 0 !important; }
  .devis-no-print { display: none !important; }
  .devis-screen-bg { background: #fff !important; padding: 0 !important; }
  html, body { background: #fff !important; }
  /* Les marges sont portées par la PAGE et non par la feuille : posées sur la
     feuille, elles ne valaient que pour la première page et le texte des pages
     suivantes démarrait au ras du bord, dans la zone que les imprimantes rognent. */
  @page { size: A4; margin: 15mm 16mm; }
  .devis-sheet {
    padding: 0 !important;
    width: auto !important;
    /* Hauteur utile de la page moins les marges, avec un peu de mou : un devis
       courant tient sur une feuille, un devis long pagine proprement. */
    min-height: 262mm !important;
  }
  tr, .devis-avoid-break { break-inside: avoid; }
}
`;

// Titre de l'onglet = nom de fichier proposé par le navigateur pour le PDF.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id }, select: { number: true, clientCompany: true, clientName: true, docType: true } });
  const client = row?.clientCompany || row?.clientName || "";
  const doc = row?.docType === "facture" ? "Facture" : "Devis";
  const title = `${doc} ${row?.number ?? ""}${client ? ` - ${client}` : ""}`.trim();
  return { title: title || doc };
}

export default async function ImprimerDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id } });
  if (!row) notFound();

  let items: QuoteItem[] = [];
  try {
    const p = JSON.parse(row.items);
    if (Array.isArray(p)) items = p;
  } catch {
    /* ignore */
  }
  let brandingRaw: unknown = {};
  try {
    brandingRaw = JSON.parse(row.branding ?? "{}");
  } catch {
    /* ignore */
  }
  let vehicleRaw: unknown = {};
  try {
    vehicleRaw = JSON.parse(row.vehicleInfo ?? "{}");
  } catch {
    /* repli sur un encart vide */
  }


  const quote: QuoteData = {
    id: row.id,
    number: row.number,
    kind: row.kind as QuoteKind,
    status: row.status as QuoteStatus,
    docType: row.docType as DocType,
    factureKind: row.factureKind as FactureKind,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paidDate: row.paidDate,
    sourceQuoteId: row.sourceQuoteId,
    clientName: row.clientName,
    clientCompany: row.clientCompany,
    clientAddress: row.clientAddress,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    issueDate: row.issueDate,
    validityDays: row.validityDays,
    items,
    tvaMode: row.tvaMode as TvaMode,
    tvaRate: row.tvaRate,
    depositMode: row.depositMode as DepositMode,
    depositValue: row.depositValue,
    paymentTerms: row.paymentTerms,
    notes: row.notes,
    vehicleId: row.vehicleId,
    vehicle: mergeVehicleBlock(vehicleRaw),
    branding: mergeBranding(brandingRaw),
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PrintToolbar />
      <div className="devis-screen-bg flex justify-center" style={{ backgroundColor: "#5b6472", padding: "24px 0" }}>
        <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
          <DevisDocument quote={quote} />
        </div>
      </div>
    </>
  );
}
