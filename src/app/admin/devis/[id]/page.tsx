import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeBranding, computeTotals, FACTURE_KIND_LABEL, type QuoteData, type QuoteItem, type TvaMode, type DepositMode, type QuoteStatus, type QuoteKind, type DocType, type FactureKind, type PaymentStatus } from "@/lib/devis";
import { T, AdminPage, PageHeader } from "../../ui";
import DevisEditor from "../DevisEditor";
import ConvertActions from "../ConvertActions";

export default async function EditDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id } });
  if (!row) notFound();

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, make: true, model: true, year: true, mileage: true, price: true, fuel: true, transmission: true, power: true },
  });

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

  const initial: QuoteData = {
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
    branding: mergeBranding(brandingRaw),
  };

  const isFacture = row.docType === "facture";
  const backHref = isFacture ? "/admin/factures" : "/admin/devis";
  const docLabel = isFacture ? (FACTURE_KIND_LABEL[row.factureKind as FactureKind] ?? "Facture") : "Devis";

  const totals = computeTotals({
    items,
    tvaMode: row.tvaMode as TvaMode,
    tvaRate: row.tvaRate,
    depositMode: row.depositMode as DepositMode,
    depositValue: row.depositValue,
  });

  return (
    <AdminPage>
      <Link href={backHref} className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }}>
        ← {isFacture ? "Factures" : "Devis"}
      </Link>
      <PageHeader
        title={`${docLabel} ${row.number}`}
        subtitle={row.clientCompany || row.clientName || "Sans client"}
        action={isFacture ? undefined : <ConvertActions quoteId={row.id} hasDeposit={totals.deposit > 0} />}
      />
      <DevisEditor initial={initial} vehicles={vehicles} isEdit />
    </AdminPage>
  );
}
