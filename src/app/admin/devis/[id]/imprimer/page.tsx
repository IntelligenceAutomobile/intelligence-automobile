import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeBranding, type QuoteData, type QuoteItem, type TvaMode, type DepositMode, type QuoteStatus, type QuoteKind } from "@/lib/devis";
import DevisDocument from "../../DevisDocument";
import PrintToolbar from "./PrintToolbar";

// CSS d'impression : masque la nav admin + la barre d'outils, papier A4 plein cadre.
const PRINT_CSS = `
@media print {
  header { display: none !important; }
  .devis-no-print { display: none !important; }
  .devis-screen-bg { background: #fff !important; padding: 0 !important; }
  html, body { background: #fff !important; }
  @page { size: A4; margin: 0; }
}
`;

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

  const quote: QuoteData = {
    id: row.id,
    number: row.number,
    kind: row.kind as QuoteKind,
    status: row.status as QuoteStatus,
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
