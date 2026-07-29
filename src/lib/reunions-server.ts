// Photo de la situation de l'agence, prise au moment où une réunion est créée.
// Côté serveur uniquement (accès base) : la partie neutre vit dans reunions.ts.
import { prisma } from "./prisma";
import { computeTotals, type QuoteItem, type TvaMode, type DepositMode } from "./devis";
import { PIPELINE_STAGES, type Stage } from "./crm";
import { type MeetingSnapshot } from "./reunions";

function itemsOf(raw: string): QuoteItem[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    // Une ligne abîmée laisse le document lisible, avec un total à zéro.
    return [];
  }
}

type QuoteRow = {
  items: string;
  tvaMode: string;
  tvaRate: number;
  depositMode: string;
  depositValue: number;
  factureKind: string;
};

function totalOf(r: QuoteRow, useBalance: boolean): number {
  const t = computeTotals({
    items: itemsOf(r.items),
    tvaMode: r.tvaMode as TvaMode,
    tvaRate: r.tvaRate,
    depositMode: r.depositMode as DepositMode,
    depositValue: r.depositValue,
  });
  return useBalance && r.factureKind === "solde" ? t.balance : t.totalTTC;
}

// Les chiffres repris de la lecture du tableau de bord : ce sont ceux que le
// gérant regarde tous les jours, donc ceux qu'il cherchera en relisant une réunion.
// Les filtres sont volontairement IDENTIQUES à ceux du tableau de bord (stock
// « disponible » pour le compte comme pour la valeur, src/app/admin/page.tsx),
// sinon la photo d'une réunion contredirait l'écran d'accueil du même jour.
//
// Renvoie null quand la base bronche : la création prime sur le comptage, et une
// photo absente se replie proprement là où une photo de zéros ferait croire à une
// agence vide en relisant la réunion des années plus tard.
export async function buildSnapshot(today: string): Promise<MeetingSnapshot | null> {
  try {
    const [stock, pendingQuotes, unpaidInvoices, leads] = await Promise.all([
      prisma.vehicle.findMany({
        where: { status: "disponible" },
        select: { price: true },
      }),
      prisma.quote.findMany({
        where: { docType: { not: "facture" }, status: "envoye" },
        select: { items: true, tvaMode: true, tvaRate: true, depositMode: true, depositValue: true, factureKind: true },
      }),
      prisma.quote.findMany({
        where: { docType: "facture", paymentStatus: "impayee" },
        select: { items: true, tvaMode: true, tvaRate: true, depositMode: true, depositValue: true, factureKind: true },
      }),
      prisma.lead.findMany({ select: { stage: true } }),
    ]);

    return {
      takenOn: today,
      stockCount: stock.length,
      stockValue: stock.reduce((s, v) => s + (v.price ?? 0), 0),
      quotesPendingCount: pendingQuotes.length,
      quotesPending: pendingQuotes.reduce((s, q) => s + totalOf(q, false), 0),
      unpaid: unpaidInvoices.reduce((s, f) => s + totalOf(f, true), 0),
      activeLeads: leads.filter((l) => PIPELINE_STAGES.includes(l.stage as Stage)).length,
    };
  } catch {
    return null;
  }
}
