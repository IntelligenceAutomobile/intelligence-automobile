import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotals, creditsByInvoice, remainingDue, DOCS_HORS_DEVIS, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { relanceDue, daysSince, parisDayOf } from "@/lib/relances";
import { blockedByRedList, ajoutsListeRouge } from "@/lib/mailer";
import { parisDay } from "@/lib/vehicules";
import RelancesClient, { type RelanceItem, type HistoryEntry } from "./RelancesClient";

export default async function RelancesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  // Jour civil de Paris, comme la liste des devis : le runtime tourne en UTC
  // et les deux pages divergeaient d'un jour en soirée.
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  const [candidates, avoirs, logs] = await Promise.all([
    prisma.quote.findMany({
      where: {
        OR: [
          // Un avoir porte le statut « accepté » : sans exclusion explicite, il
          // remontait ici comme un devis en attente de réponse.
          { docType: { notIn: [...DOCS_HORS_DEVIS] }, status: "envoye" },
          { docType: "facture", paymentStatus: "impayee" },
        ],
      },
      orderBy: { issueDate: "asc" },
    }),
    // Avoirs émis : une facture créditée en totalité sort du centre de relances.
    prisma.quote.findMany({
      where: { docType: "avoir" },
      select: { sourceQuoteId: true, items: true, tvaMode: true, tvaRate: true, depositMode: true, depositValue: true },
    }),
    // Journal des actions : la question « est-ce que la relance est partie ? »
    // se répond ici, y compris pour les documents sortis de la liste.
    prisma.relanceLog.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
  ]);

  const devis: RelanceItem[] = [];
  const factures: RelanceItem[] = [];
  const credits = creditsByInvoice(avoirs);
  // Liste rouge : la ligne annonce l'envoi impossible au lieu de le découvrir au clic.
  const ajoutsRouge = await ajoutsListeRouge();

  for (const r of candidates) {
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
    const facture = r.factureKind === "solde" ? totals.balance : totals.totalTTC;
    const credite = credits.get(r.id) ?? 0;

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
        fullyCredited: r.docType === "facture" && credite > 0 && remainingDue(facture, credite) <= 0,
      },
      today,
    );
    if (!due) continue;

    // Sur une facture partiellement créditée, on réclame ce qui reste dû, pas
    // le montant d'origine.
    const amount = due.kind === "facture" ? remainingDue(facture, credite) : totals.totalTTC;

    const item: RelanceItem = {
      id: r.id,
      number: r.number,
      client: r.clientCompany || r.clientName || "",
      clientEmail: r.clientEmail,
      clientPhone: r.clientPhone,
      amount,
      kind: due.kind,
      sinceDays: due.sinceDays,
      relanceCount: r.relanceCount,
      lastRelanceDate: r.lastRelanceDate,
      // Point de départ affiché : l'envoi réel pour un devis (jour de Paris), l'émission sinon.
      startDate: (r.sentAt ? parisDayOf(r.sentAt) : "") || r.issueDate,
      // Un devis dont la validité est passée mérite un renvoi plutôt qu'une relance.
      expired: due.kind === "devis" && r.validityDays > 0 && daysSince(r.issueDate, today) > r.validityDays,
      // Destinataire en liste rouge : la relance par email est impossible.
      blocked: Boolean(r.clientEmail) && blockedByRedList(r.clientEmail, process.env, ajoutsRouge).length > 0,
    };
    if (due.kind === "facture") factures.push(item);
    else devis.push(item);
  }

  // Les plus urgents d'abord : l'œil tombe sur ce qui attend depuis le plus longtemps.
  devis.sort((a, b) => b.sinceDays - a.sinceDays);
  factures.sort((a, b) => b.sinceDays - a.sinceDays);

  const history: HistoryEntry[] = logs.map((l) => ({
    id: l.id,
    quoteId: l.quoteId,
    number: l.number,
    client: l.client,
    action: l.action,
    detail: l.detail,
    author: l.author,
    at: l.createdAt.toISOString(),
  }));

  return <RelancesClient devis={devis} factures={factures} history={history} />;
}
