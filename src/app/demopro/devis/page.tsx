// Liste des devis de la démonstration /demopro (lecture seule).
// Reprend TEL QUEL l'écran du back-office (DevisList), alimenté par des données
// d'exemple figées (src/lib/demo-data.ts) et verrouillé en lecture : le prospect
// voit exactement l'outil, sans qu'aucune action ne parte en base.
import { computeTotals, STATUS_LABEL, type QuoteItem, type QuoteStatus, type TvaMode, type DepositMode } from "@/lib/devis";
import { relanceDue, daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { AdminPage, PageHeader } from "@/app/admin/ui";
import DevisList, { type DevisRow } from "@/app/admin/devis/DevisList";
import { getDemoQuotes, getDemoVehicles, type DemoQuoteItem } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";

// Validité par défaut des devis d'exemple, alignée sur celle du back-office.
const VALIDITY_DAYS = 30;

function toQuoteItems(items: DemoQuoteItem[]): QuoteItem[] {
  return items.map((it) => ({ id: it.id, designation: it.designation, detail: it.detail ?? "", qty: it.qty, unitPrice: it.unitPrice }));
}

export default function DemoDevisListPage() {
  const todayIso = parisDay(new Date()).toISOString().slice(0, 10);
  const quotes = getDemoQuotes();
  const vehicles = getDemoVehicles();
  const vehicleById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));

  const factureByQuote = new Map<string, string>();
  for (const f of quotes) {
    if (f.docType !== "facture") continue;
    // Les factures d'exemple citent leur devis d'origine dans le détail de la ligne.
    const source = quotes.find((q) => q.docType === "devis" && f.items.some((it) => it.detail.includes(q.number)));
    if (source && !factureByQuote.has(source.id)) factureByQuote.set(source.id, f.number);
  }

  const devis: DevisRow[] = quotes
    .filter((q) => q.docType === "devis")
    .map((q) => {
      const totals = computeTotals({
        items: toQuoteItems(q.items),
        tvaMode: q.tvaMode as TvaMode,
        tvaRate: q.tvaRate,
        depositMode: q.depositMode as DepositMode,
        depositValue: q.depositValue,
      });
      const ageDays = daysSince(q.issueDate, todayIso);
      const daysLeft = VALIDITY_DAYS - ageDays;
      const relance = relanceDue(
        { docType: q.docType, status: q.status, paymentStatus: q.paymentStatus ?? "impayee", issueDate: q.issueDate, lastRelanceDate: "", relanceSnoozeUntil: "" },
        todayIso,
      );
      return {
        id: q.id,
        number: q.number,
        client: q.clientCompany || q.clientName || "",
        vehicle: q.vehicleId ? vehicleById.get(q.vehicleId) ?? "" : "",
        issueDate: q.issueDate,
        status: q.status,
        statusLabel: STATUS_LABEL[q.status as QuoteStatus] ?? q.status,
        total: totals.totalTTC,
        deposit: totals.deposit,
        lineCount: totals.lineCount,
        ageDays,
        daysLeft,
        expired: q.status === "envoye" && daysLeft < 0,
        factureNumber: factureByQuote.get(q.id) ?? null,
        relanceDue: relance !== null,
        relanceSinceDays: relance?.sinceDays ?? null,
        relanceCount: 0,
        // La démonstration montre aussi le suivi de lecture : le devis envoyé
        // au client belge a été ouvert, celui de Sophie Marchand jamais.
        sentAt: q.status === "brouillon" ? "" : q.issueDate,
        viewedDays: q.id === "q-041" ? 2 : null,
        viewCount: q.id === "q-041" ? 3 : 0,
        signerName: q.id === "q-038" ? "Karim Benali" : "",
        hasEmail: !!q.clientEmail,
        updatedAt: q.updatedAt.toISOString(),
      };
    });

  return (
    <AdminPage>
      <PageHeader title="Devis" subtitle={`${devis.length} devis au total.`} />
      <DevisList devis={devis} canDelete={false} readOnly basePath={`${DEMO_BASE}/devis`} />
    </AdminPage>
  );
}
