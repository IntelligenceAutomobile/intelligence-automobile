import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuoteData, QuoteItem, TvaMode, DepositMode, QuoteStatus } from "@/lib/devis";
import { T, AdminPage, PageHeader } from "../../ui";
import DevisEditor from "../DevisEditor";

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

  const initial: QuoteData = {
    id: row.id,
    number: row.number,
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
  };

  return (
    <AdminPage>
      <Link href="/admin/devis" className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }}>
        ← Devis
      </Link>
      <PageHeader title={`Devis ${row.number}`} subtitle={row.clientCompany || row.clientName || "Sans client"} />
      <DevisEditor initial={initial} vehicles={vehicles} isEdit />
    </AdminPage>
  );
}
