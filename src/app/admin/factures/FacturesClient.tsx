"use client";

// Liste des factures : statut de paiement, encours impayé, marquage payée, PDF.
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, Check, RotateCcw, Banknote } from "lucide-react";
import { formatEuro, FACTURE_KIND_LABEL, formatDateFr, type FactureKind } from "@/lib/devis";
import { T, TONE, Tag, AdminPage, PageHeader } from "../ui";
import { useToast } from "../toast";

export type FactureRow = {
  id: string;
  number: string;
  client: string;
  issueDate: string;
  factureKind: string;
  paymentStatus: string;
  paidDate: string;
  total: number;
};

const KIND_TONE: Record<string, "accent" | "warning" | "success"> = {
  complete: "accent",
  acompte: "warning",
  solde: "success",
};

export default function FacturesClient({ factures }: { factures: FactureRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const encours = useMemo(
    () => factures.filter((f) => f.paymentStatus !== "payee").reduce((s, f) => s + f.total, 0),
    [factures],
  );
  const impayees = factures.filter((f) => f.paymentStatus !== "payee").length;

  async function togglePaid(f: FactureRow) {
    setBusy(f.id);
    try {
      const res = await fetch(`/api/admin/devis/${f.id}/paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: f.paymentStatus !== "payee" }),
      });
      if (!res.ok) throw new Error();
      toast.success(f.paymentStatus !== "payee" ? "Facture marquée payée." : "Facture remise en impayée.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage>
      <PageHeader title="Factures" subtitle={`${factures.length} facture${factures.length > 1 ? "s" : ""} · les factures se créent depuis un devis accepté.`} />

      {/* Encours */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>Encours impayé</span>
          <div className="text-[26px] font-normal mt-2" style={{ color: impayees > 0 ? T.warning : T.text }}>{formatEuro(encours)}</div>
        </div>
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>Factures impayées</span>
          <div className="text-[26px] font-normal mt-2" style={{ color: T.text }}>{impayees}<span className="text-sm ml-1" style={{ color: T.muted }}>/ {factures.length}</span></div>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <Banknote size={15} />
            Aucune facture. Ouvrez un devis accepté et cliquez « Facture d&apos;acompte » ou « Facture de solde ».
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {factures.map((f, i) => {
            const paid = f.paymentStatus === "payee";
            return (
              <div key={f.id} className="flex items-center gap-4 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
                <Link href={`/admin/devis/${f.id}`} className="flex items-center gap-4 min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]">
                  <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent, width: 108 }}>{f.number}</span>
                  <span className="text-sm truncate min-w-0" style={{ color: T.text }}>
                    {f.client || <span style={{ color: T.muted }}>Sans client</span>}
                  </span>
                  <span className="text-xs hidden md:inline flex-shrink-0" style={{ color: T.muted }}>{formatDateFr(f.issueDate)}</span>
                </Link>
                <Tag tone={KIND_TONE[f.factureKind] ?? "accent"}>{FACTURE_KIND_LABEL[f.factureKind as FactureKind] ?? f.factureKind}</Tag>
                <span className="text-sm font-semibold hidden sm:inline flex-shrink-0 w-28 text-right" style={{ color: T.text }}>{formatEuro(f.total)}</span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 flex-shrink-0"
                  style={{ backgroundColor: paid ? TONE.success.bg : TONE.warning.bg, border: `1px solid ${paid ? TONE.success.bd : TONE.warning.bd}`, color: paid ? TONE.success.fg : TONE.warning.fg }}
                >
                  {paid ? <><Check size={11} /> Payée</> : "Impayée"}
                </span>
                <button
                  type="button"
                  onClick={() => togglePaid(f)}
                  disabled={busy === f.id}
                  title={paid ? "Remettre en impayée" : "Marquer payée"}
                  className="p-1.5 transition-colors hover:text-[#F0F5FF] flex-shrink-0"
                  style={{ color: paid ? T.muted : T.success }}
                >
                  {paid ? <RotateCcw size={14} /> : <Check size={15} />}
                </button>
                <Link href={`/admin/devis/${f.id}/imprimer`} target="_blank" className="items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF] hidden md:inline-flex flex-shrink-0" style={{ color: T.muted }}>
                  <Printer size={13} />
                  PDF
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
