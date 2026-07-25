// Liste des devis de la démonstration /demopro (lecture seule).
// Reproduit la liste du back-office, alimentée par des données d'exemple figées
// (src/lib/demo-data.ts). Aucun accès base, aucune action réelle.
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  computeTotals,
  formatEuro,
  formatDateFr,
  STATUS_LABEL,
  type QuoteItem,
  type QuoteStatus,
  type TvaMode,
  type DepositMode,
} from "@/lib/devis";
import { T, TONE, type Tone, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoQuotes, type DemoQuoteItem } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import DemoActionButton from "./DemoActionButton";

const STATUS_TONE: Record<QuoteStatus, Tone> = {
  brouillon: "muted",
  envoye: "accent",
  accepte: "success",
  refuse: "danger",
};

function QuoteStatusBadge({ status }: { status: string }) {
  const k = (status in STATUS_TONE ? status : "brouillon") as QuoteStatus;
  const s = TONE[STATUS_TONE[k]];
  return (
    <span
      className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 whitespace-nowrap"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.bd}`, color: s.fg }}
    >
      {STATUS_LABEL[k]}
    </span>
  );
}

// Les lignes de devis d'exemple deviennent des QuoteItem complets pour computeTotals.
function toQuoteItems(items: DemoQuoteItem[]): QuoteItem[] {
  return items.map((it) => ({ id: it.id, designation: it.designation, detail: it.detail ?? "", qty: it.qty, unitPrice: it.unitPrice }));
}

export default function DemoDevisListPage() {
  const devis = getDemoQuotes()
    .filter((q) => q.docType === "devis")
    .map((q) => {
      const totals = computeTotals({
        items: toQuoteItems(q.items),
        tvaMode: q.tvaMode as TvaMode,
        tvaRate: q.tvaRate,
        depositMode: q.depositMode as DepositMode,
        depositValue: q.depositValue,
      });
      return { ...q, totalTTC: totals.totalTTC };
    });

  return (
    <AdminPage>
      <PageHeader
        title="Devis"
        subtitle={`${devis.length} devis au total.`}
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau devis
          </DemoActionButton>
        }
      />

      {devis.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Aucun devis pour l&apos;instant.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {devis.map((qte, i) => (
            <Link
              key={qte.id}
              href={`${DEMO_BASE}/devis/${qte.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:text-[#F0F5FF]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent, width: 92 }}>
                {qte.number}
              </span>
              <span className="text-sm truncate min-w-0 flex-1" style={{ color: T.text }}>
                {qte.clientCompany || qte.clientName || <span style={{ color: T.muted }}>Sans client</span>}
              </span>
              <span className="text-xs hidden sm:inline flex-shrink-0" style={{ color: T.muted }}>
                {formatDateFr(qte.issueDate)}
              </span>
              <span className="text-sm font-semibold hidden sm:inline flex-shrink-0" style={{ color: T.text }}>
                {formatEuro(qte.totalTTC)}
              </span>
              <QuoteStatusBadge status={qte.status} />
            </Link>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
