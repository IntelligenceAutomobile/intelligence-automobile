// Liste des factures de la démonstration /demoprooo (lecture seule).
// Reproduit le module Factures du back-office, alimenté par des données
// d'exemple figées (src/lib/demo-data.ts). Aucun accès base, aucune action réelle.
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import {
  computeTotals,
  formatEuro,
  formatDateFr,
  FACTURE_KIND_LABEL,
  type QuoteItem,
  type FactureKind,
  type TvaMode,
  type DepositMode,
} from "@/lib/devis";
import { T, Tag, type Tone, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { getDemoQuotes, type DemoQuoteItem } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import DemoActionButton from "@/app/demoprooo/DemoActionButton";

// Teinte du badge selon le type de facture (comme dans le back-office).
const KIND_TONE: Record<string, Tone> = {
  complete: "accent",
  acompte: "warning",
  solde: "success",
};

// Les lignes de facture d'exemple deviennent des QuoteItem complets pour computeTotals.
function toQuoteItems(items: DemoQuoteItem[]): QuoteItem[] {
  return items.map((it) => ({ id: it.id, designation: it.designation, detail: it.detail ?? "", qty: it.qty, unitPrice: it.unitPrice }));
}

export default function DemoFacturesListPage() {
  const factures = getDemoQuotes()
    .filter((q) => q.docType === "facture")
    .map((q) => {
      const totals = computeTotals({
        items: toQuoteItems(q.items),
        tvaMode: q.tvaMode as TvaMode,
        tvaRate: q.tvaRate,
        depositMode: q.depositMode as DepositMode,
        depositValue: q.depositValue,
      });
      // La facture de solde ne réclame que le solde restant ; les autres, le total.
      const due = q.factureKind === "solde" ? totals.balance : totals.totalTTC;
      return { ...q, due };
    });

  const impayees = factures.filter((f) => f.paymentStatus !== "payee");
  const encours = impayees.reduce((s, f) => s + f.due, 0);

  return (
    <AdminPage>
      <PageHeader
        title="Factures"
        subtitle={`${factures.length} facture${factures.length > 1 ? "s" : ""} · les factures se créent depuis un devis accepté.`}
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle facture
          </DemoActionButton>
        }
      />

      {/* Encours impayé (bandeau de tête) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>
            Encours impayé
          </span>
          <div className="text-[26px] font-normal mt-2" style={{ color: impayees.length > 0 ? T.warning : T.text }}>
            {formatEuro(encours)}
          </div>
        </div>
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>
            Factures impayées
          </span>
          <div className="text-[26px] font-normal mt-2" style={{ color: T.text }}>
            {impayees.length}
            <span className="text-sm ml-1" style={{ color: T.muted }}>/ {factures.length}</span>
          </div>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Aucune facture pour l&apos;instant.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {factures.map((f, i) => {
            const paid = f.paymentStatus === "payee";
            return (
              <div
                key={f.id}
                className="flex items-center gap-4 px-4 py-3"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <Link
                  href={`${DEMO_BASE}/factures/${f.id}`}
                  className="flex items-center gap-4 min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]"
                >
                  <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent, width: 108 }}>
                    {f.number}
                  </span>
                  <span className="text-sm truncate min-w-0" style={{ color: T.text }}>
                    {f.clientCompany || f.clientName || <span style={{ color: T.muted }}>Sans client</span>}
                  </span>
                  <span className="text-xs hidden md:inline flex-shrink-0" style={{ color: T.muted }}>
                    {formatDateFr(f.issueDate)}
                  </span>
                </Link>
                <Tag tone={KIND_TONE[f.factureKind ?? "complete"] ?? "accent"}>
                  {FACTURE_KIND_LABEL[(f.factureKind ?? "complete") as FactureKind] ?? f.factureKind}
                </Tag>
                <span className="text-sm font-semibold hidden sm:inline flex-shrink-0 w-28 text-right" style={{ color: T.text }}>
                  {formatEuro(f.due)}
                </span>
                <Tag tone={paid ? "success" : "warning"}>{paid ? "Payée" : "Impayée"}</Tag>
                <DemoActionButton
                  className={`${btnGhostClass} !px-3 !py-1.5 !text-[10px] flex-shrink-0`}
                  style={btnGhostStyle}
                  title={paid ? "Remettre en impayée" : "Marquer payée"}
                >
                  <Check size={13} />
                  <span className="hidden md:inline">Marquer payée</span>
                </DemoActionButton>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
