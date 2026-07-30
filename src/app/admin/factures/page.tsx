import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { computeTotals, creditsByInvoice, remainingDue, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import FacturesClient, { type FactureRow } from "./FacturesClient";

export default async function FacturesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  // Les avoirs vivent avec les factures : ce sont les mêmes pièces comptables,
  // et un avoir isolé de la facture qu'il corrige ne se retrouve plus.
  const rows = await prisma.quote.findMany({
    where: { docType: { in: ["facture", "avoir"] } },
    orderBy: { updatedAt: "desc" },
  });

  const avoirs = rows.filter((r) => r.docType === "avoir");
  const credits = creditsByInvoice(avoirs);
  // Numéro de la facture créditée, pour l'afficher sur la ligne de l'avoir.
  const numberById = new Map(rows.map((r) => [r.id, r.number]));

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
    const credite = credits.get(r.id) ?? 0;
    return {
      id: r.id,
      number: r.number,
      docType: r.docType,
      client: r.clientCompany || r.clientName || "",
      issueDate: r.issueDate,
      factureKind: r.factureKind,
      paymentStatus: r.paymentStatus,
      paidDate: r.paidDate,
      total: due,
      // Ce qui reste réellement à encaisser, avoirs déduits.
      credite,
      restant: remainingDue(due, credite),
      // Facture créditée : sur la ligne de l'avoir, on cite la facture d'origine.
      sourceNumber: r.docType === "avoir" && r.sourceQuoteId ? numberById.get(r.sourceQuoteId) ?? "" : "",
    };
  });

  return <FacturesClient factures={factures} canCredit={can(asRole(session.admin.role), "finances")} />;
}
