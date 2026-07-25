// Centre de relances de la démonstration /demopro (lecture seule).
// Reproduit le back-office : le système liste ce qui doit être relancé (devis
// sans réponse, factures impayées) à partir des données d'exemple figées
// (src/lib/demo-data.ts). Les boutons « Relancer » / « Reporter » affichent un
// simple toast. Aucun accès base, aucune action réelle.
import Link from "next/link";
import { Send, Clock, FileText, ReceiptText, CheckCircle2, MailWarning } from "lucide-react";
import {
  computeTotals,
  formatEuro,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
} from "@/lib/devis";
import { relanceDue } from "@/lib/relances";
import { T, Tag, AdminPage, PageHeader } from "@/app/admin/ui";
import { getDemoQuotes, type DemoQuoteItem } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import DemoActionButton from "../DemoActionButton";

type RelanceItem = {
  id: string;
  number: string;
  client: string;
  hasEmail: boolean;
  amount: number;
  sinceDays: number;
  href: string;
};

// Les lignes de devis d'exemple deviennent des QuoteItem complets pour computeTotals.
function toQuoteItems(items: DemoQuoteItem[]): QuoteItem[] {
  return items.map((it) => ({ id: it.id, designation: it.designation, detail: it.detail ?? "", qty: it.qty, unitPrice: it.unitPrice }));
}

function Section({
  title,
  hint,
  icon: Icon,
  items,
}: {
  title: string;
  hint: string;
  icon: typeof FileText;
  items: RelanceItem[];
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</h2>
        <span className="text-xs" style={{ color: T.muted }}>· {items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
          <CheckCircle2 size={15} style={{ color: T.success }} />
          {hint}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {items.map((it, i) => (
            <div key={it.id} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <Link href={it.href} className="flex items-center gap-3 min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]">
                <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent, width: 108 }}>{it.number}</span>
                <span className="text-sm truncate min-w-0" style={{ color: T.text }}>{it.client || <span style={{ color: T.muted }}>Sans client</span>}</span>
              </Link>
              <span className="text-sm font-semibold hidden sm:inline flex-shrink-0" style={{ color: T.text }}>{formatEuro(it.amount)}</span>
              <Tag tone="warning">{it.sinceDays} j</Tag>
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {it.hasEmail ? (
                  <DemoActionButton
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: T.accent, color: T.bg }}
                  >
                    <Send size={13} />
                    Relancer
                  </DemoActionButton>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase" style={{ color: T.muted }} title="Pas d'email client">
                    <MailWarning size={13} />
                    Pas d&apos;email
                  </span>
                )}
                <DemoActionButton
                  title="Reporter d'une semaine"
                  className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 border transition-colors hover:border-[#6B9FEE]"
                  style={{ borderColor: T.border, color: T.textDim }}
                >
                  <Clock size={13} />
                  Reporter
                </DemoActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemoRelancesPage() {
  const today = new Date().toISOString().slice(0, 10);

  const devis: RelanceItem[] = [];
  const factures: RelanceItem[] = [];

  for (const q of getDemoQuotes()) {
    const due = relanceDue(
      {
        docType: q.docType,
        status: q.status,
        paymentStatus: q.paymentStatus ?? "",
        issueDate: q.issueDate,
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

    const item: RelanceItem = {
      id: q.id,
      number: q.number,
      client: q.clientCompany || q.clientName || "",
      hasEmail: Boolean(q.clientEmail),
      amount,
      sinceDays: due.sinceDays,
      href: due.kind === "facture" ? `${DEMO_BASE}/factures` : `${DEMO_BASE}/devis/${q.id}`,
    };
    if (due.kind === "facture") factures.push(item);
    else devis.push(item);
  }

  const total = devis.length + factures.length;

  return (
    <AdminPage>
      <PageHeader
        title="Relances"
        subtitle={total === 0 ? "Tout est à jour." : `${total} relance${total > 1 ? "s" : ""} à faire · devis sans réponse et factures impayées.`}
      />

      {total === 0 ? (
        <div className="p-10 text-center text-sm inline-flex items-center gap-2 w-full justify-center" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={16} style={{ color: T.success }} />
          Rien à relancer pour le moment. Le centre se remplit tout seul dès qu&apos;un devis reste sans réponse ou qu&apos;une facture dépasse son échéance.
        </div>
      ) : (
        <>
          <Section title="Devis sans réponse" hint="Aucun devis en attente." icon={FileText} items={devis} />
          <Section title="Factures impayées" hint="Aucune facture en retard." icon={ReceiptText} items={factures} />
        </>
      )}
    </AdminPage>
  );
}
