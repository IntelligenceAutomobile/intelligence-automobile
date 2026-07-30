// Centre de relances de la démonstration /demopro (lecture seule).
//
// L'habillage vient du module partagé avec le back-office
// (src/app/admin/relances/presentation.tsx) : ce qui change là-bas change ici,
// sans recopie. Seules les données (exemples figés de src/lib/demo-data.ts) et
// les actions (boutons de démonstration) diffèrent.
import { Send, Clock, FileText, ReceiptText, ChevronDown } from "lucide-react";
import {
  computeTotals,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
} from "@/lib/devis";
import { relanceDue, daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { T, AdminPage, PageHeader } from "@/app/admin/ui";
import { HistorySection } from "@/app/admin/relances/RelanceHistory";
import {
  RelanceLine,
  RelanceSection,
  relancesSubtitle,
  ghostBtnClass,
  ghostBorder,
  primaryBtnClass,
  RELANCES_VIDE,
  HINT_DEVIS,
  HINT_FACTURES,
  type RelanceView,
  type HistoryView,
} from "@/app/admin/relances/presentation";
import { getDemoQuotes, getDemoRelanceLog, type DemoQuoteItem } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import DemoActionButton from "../DemoActionButton";

// Délai de règlement des documents d'exemple, comme sur leur fiche.
const VALIDITY_DAYS = 30;

// Les lignes de devis d'exemple deviennent des QuoteItem complets pour computeTotals.
function toQuoteItems(items: DemoQuoteItem[]): QuoteItem[] {
  return items.map((it) => ({ id: it.id, designation: it.designation, detail: it.detail ?? "", qty: it.qty, unitPrice: it.unitPrice }));
}

// Les deux boutons de la démonstration : ils affichent un message, rien ne part.
function DemoActions({ withEmail }: { withEmail: boolean }) {
  return (
    <div className="relative z-10 flex items-center gap-2">
      {withEmail && (
        <DemoActionButton className={primaryBtnClass} style={{ backgroundColor: T.accent, color: T.bg }}>
          <Send size={13} />
          Relancer
        </DemoActionButton>
      )}
      <DemoActionButton className={ghostBtnClass} style={{ borderColor: ghostBorder, color: T.textDim }}>
        <Clock size={13} />
        Reporter
        <ChevronDown size={12} />
      </DemoActionButton>
    </div>
  );
}

export default function DemoRelancesPage() {
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  const devis: RelanceView[] = [];
  const factures: RelanceView[] = [];

  for (const q of getDemoQuotes()) {
    const due = relanceDue(
      {
        docType: q.docType,
        status: q.status,
        paymentStatus: q.paymentStatus ?? "",
        issueDate: q.issueDate,
        // Même règle que le vrai back-office : l'échéance d'une facture court
        // sur le délai de règlement, la fiche démo affiche la même date.
        validityDays: VALIDITY_DAYS,
        lastRelanceDate: "",
        relanceSnoozeUntil: "",
      },
      today,
    );
    if (!due) continue;

    const totals = computeTotals({
      items: toQuoteItems(q.items),
      tvaMode: q.tvaMode as TvaMode,
      tvaRate: q.tvaRate,
      depositMode: q.depositMode as DepositMode,
      depositValue: q.depositValue,
    });
    const amount = due.kind === "facture" && q.factureKind === "solde" ? totals.balance : totals.totalTTC;

    const item: RelanceView = {
      id: q.id,
      number: q.number,
      client: q.clientCompany || q.clientName || "",
      clientEmail: q.clientEmail,
      amount,
      kind: due.kind,
      sinceDays: due.sinceDays,
      relanceCount: 0,
      lastRelanceDate: "",
      startDate: q.issueDate,
      expired: due.kind === "devis" && daysSince(q.issueDate, today) > VALIDITY_DAYS,
      blocked: false,
    };
    if (due.kind === "facture") factures.push(item);
    else devis.push(item);
  }

  // Les plus urgents d'abord, comme dans le back-office.
  devis.sort((a, b) => b.sinceDays - a.sinceDays);
  factures.sort((a, b) => b.sinceDays - a.sinceDays);

  const somme = (l: RelanceView[]) => l.reduce((s, it) => s + it.amount, 0);
  const total = devis.length + factures.length;
  const history: HistoryView[] = getDemoRelanceLog().map((e) => ({
    ...e,
    href: e.number.startsWith("FAC") ? `${DEMO_BASE}/factures` : `${DEMO_BASE}/devis/${e.quoteId}`,
  }));

  const lignes = (items: RelanceView[]) =>
    items.map((it, i) => (
      <RelanceLine
        key={it.id}
        it={it}
        first={i === 0}
        href={it.kind === "facture" ? `${DEMO_BASE}/factures` : `${DEMO_BASE}/devis/${it.id}`}
        actions={<DemoActions withEmail={Boolean(it.clientEmail)} />}
      />
    ));

  return (
    <AdminPage>
      <PageHeader title="Relances" subtitle={relancesSubtitle(total, somme(devis) + somme(factures))} />

      {total === 0 ? (
        <div className="p-10 text-center text-sm w-full mb-8" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          {RELANCES_VIDE}
        </div>
      ) : (
        <>
          <RelanceSection
            title="Devis en attente de réponse"
            hint={HINT_DEVIS}
            icon={FileText}
            count={devis.length}
            sum={somme(devis)}
            empty={devis.length === 0}
          >
            {lignes(devis)}
          </RelanceSection>
          <RelanceSection
            title="Factures impayées"
            hint={HINT_FACTURES}
            icon={ReceiptText}
            count={factures.length}
            sum={somme(factures)}
            empty={factures.length === 0}
          >
            {lignes(factures)}
          </RelanceSection>
        </>
      )}

      <HistorySection entries={history} />
    </AdminPage>
  );
}
