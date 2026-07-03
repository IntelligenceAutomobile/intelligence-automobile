import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotals, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import FacturesClient, { type FactureRow } from "./FacturesClient";

export default async function FacturesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const rows = await prisma.quote.findMany({ where: { docType: "facture" }, orderBy: { updatedAt: "desc" } });

  const factures: FactureRow[] = rows.map((r) => {
    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(r.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* ignore */
    }
    const totals = computeTotals({
      items,
      tvaMode: r.tvaMode as TvaMode,
      tvaRate: r.tvaRate,
      depositMode: r.depositMode as DepositMode,
      depositValue: r.depositValue,
    });
    const due = r.factureKind === "solde" ? totals.balance : totals.totalTTC;
    return {
      id: r.id,
      number: r.number,
      client: r.clientCompany || r.clientName || "",
      issueDate: r.issueDate,
      factureKind: r.factureKind,
      paymentStatus: r.paymentStatus,
      paidDate: r.paidDate,
      total: due,
    };
  });

  return <FacturesClient factures={factures} />;
}
