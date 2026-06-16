import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTotals, formatEuro, formatDateFr, STATUS_LABEL, type QuoteItem, type TvaMode, type DepositMode, type QuoteStatus } from "@/lib/devis";
import { T, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import DeleteQuoteButton from "./DeleteQuoteButton";

const STATUS_STYLE: Record<QuoteStatus, { bg: string; bd: string; fg: string }> = {
  brouillon: { bg: "transparent", bd: T.border, fg: T.muted },
  envoye: { bg: "rgba(107,159,238,0.10)", bd: "rgba(107,159,238,0.35)", fg: "#6B9FEE" },
  accepte: { bg: "rgba(78,209,161,0.10)", bd: "rgba(78,209,161,0.40)", fg: "#4ED1A1" },
  refuse: { bg: "rgba(255,107,53,0.08)", bd: "rgba(255,107,53,0.35)", fg: "#FF6B35" },
};

function QuoteStatusBadge({ status }: { status: string }) {
  const k = (status in STATUS_STYLE ? status : "brouillon") as QuoteStatus;
  const s = STATUS_STYLE[k];
  return (
    <span className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 whitespace-nowrap" style={{ backgroundColor: s.bg, border: `1px solid ${s.bd}`, color: s.fg }}>
      {STATUS_LABEL[k]}
    </span>
  );
}

export default async function DevisListPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const rows = await prisma.quote.findMany({ orderBy: { updatedAt: "desc" } });

  const quotes = rows.map((r) => {
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
    return { ...r, totalTTC: totals.totalTTC, lineCount: totals.lineCount };
  });

  return (
    <AdminPage>
      <PageHeader
        title="Devis"
        subtitle={`${rows.length} devis au total.`}
        action={
          <Link href="/admin/devis/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>
            + Nouveau devis
          </Link>
        }
      />

      {quotes.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Aucun devis pour l&apos;instant.{" "}
          <Link href="/admin/devis/nouveau" style={{ color: T.accent }}>Créer le premier.</Link>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {quotes.map((qte, i) => (
            <div key={qte.id} className="flex items-center gap-4 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <Link href={`/admin/devis/${qte.id}`} className="flex items-center gap-4 min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]">
                <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent, width: 92 }}>{qte.number}</span>
                <span className="text-sm truncate min-w-0" style={{ color: T.text }}>
                  {qte.clientCompany || qte.clientName || <span style={{ color: T.muted }}>Sans client</span>}
                </span>
                <span className="text-xs hidden sm:inline flex-shrink-0" style={{ color: T.muted }}>{formatDateFr(qte.issueDate)}</span>
              </Link>
              <span className="text-sm font-semibold hidden sm:inline flex-shrink-0" style={{ color: T.text }}>{formatEuro(qte.totalTTC)}</span>
              <QuoteStatusBadge status={qte.status} />
              <Link href={`/admin/devis/${qte.id}/imprimer`} target="_blank" className="text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF] hidden md:inline" style={{ color: T.muted }}>
                PDF
              </Link>
              <DeleteQuoteButton id={qte.id} />
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
