import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotals, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { relanceDue } from "@/lib/relances";
import RelancesClient, { type RelanceItem } from "./RelancesClient";

export default async function RelancesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const today = new Date().toISOString().slice(0, 10);

  const candidates = await prisma.quote.findMany({
    where: { OR: [{ docType: { not: "facture" }, status: "envoye" }, { docType: "facture", paymentStatus: "impayee" }] },
    orderBy: { issueDate: "asc" },
  });

  const devis: RelanceItem[] = [];
  const factures: RelanceItem[] = [];

  for (const r of candidates) {
    const due = relanceDue(
      { docType: r.docType, status: r.status, paymentStatus: r.paymentStatus, issueDate: r.issueDate, lastRelanceDate: r.lastRelanceDate, relanceSnoozeUntil: r.relanceSnoozeUntil },
      today,
    );
    if (!due) continue;

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
    const amount = due.kind === "facture" && r.factureKind === "solde" ? totals.balance : totals.totalTTC;

    const item: RelanceItem = {
      id: r.id,
      number: r.number,
      client: r.clientCompany || r.clientName || "",
      hasEmail: Boolean(r.clientEmail),
      amount,
      sinceDays: due.sinceDays,
      relanceCount: r.relanceCount,
    };
    if (due.kind === "facture") factures.push(item);
    else devis.push(item);
  }

  return <RelancesClient devis={devis} factures={factures} />;
}
