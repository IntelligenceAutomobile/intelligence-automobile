// Compteur des relances dues : badge de la navigation et bandeau du tableau
// de bord. Même règle de détection que le centre de relances (src/lib/relances).
import { cache } from "react";
import { prisma } from "./prisma";
import { computeTotals, type QuoteItem, type TvaMode, type DepositMode } from "./devis";
import { relanceDue } from "./relances";
import { parisDay } from "./vehicules";

// cache() : le layout et le tableau de bord appellent tous deux ce compteur
// dans la même passe de rendu, une seule requête part.
export const relancesDues = cache(async (): Promise<{ count: number; total: number }> => {
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const candidates = await prisma.quote.findMany({
    where: { OR: [{ docType: { not: "facture" }, status: "envoye" }, { docType: "facture", paymentStatus: "impayee" }] },
    select: {
      docType: true,
      status: true,
      paymentStatus: true,
      issueDate: true,
      sentAt: true,
      validityDays: true,
      lastRelanceDate: true,
      relanceSnoozeUntil: true,
      factureKind: true,
      items: true,
      tvaMode: true,
      tvaRate: true,
      depositMode: true,
      depositValue: true,
    },
  });

  let count = 0;
  let total = 0;
  for (const r of candidates) {
    const due = relanceDue(
      {
        docType: r.docType,
        status: r.status,
        paymentStatus: r.paymentStatus,
        issueDate: r.issueDate,
        sentAt: r.sentAt,
        validityDays: r.validityDays,
        lastRelanceDate: r.lastRelanceDate,
        relanceSnoozeUntil: r.relanceSnoozeUntil,
      },
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
    count++;
    total += due.kind === "facture" && r.factureKind === "solde" ? totals.balance : totals.totalTTC;
  }
  return { count, total };
});
