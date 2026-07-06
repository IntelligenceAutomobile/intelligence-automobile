"use client";

// SAV & garanties : garanties vendues, statut d'échéance, création.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShieldCheck, Car, AlertTriangle } from "lucide-react";
import { formatDateFr } from "@/lib/devis";
import {
  WARRANTY_TYPES, WARRANTY_TYPE_LABEL, DURATION_OPTIONS, STATUS_LABEL, STATUS_TONE,
  type WarrantyType, type WarrantyStatus,
} from "@/lib/warranties";
import { T, TONE, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type WarrantyRow = {
  id: string;
  clientName: string;
  vehicleLabel: string;
  type: string;
  startDate: string;
  endDate: string;
  status: WarrantyStatus;
  daysUntil: number;
};

function NewWarrantyModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    clientName: "",
    clientEmail: "",
    vehicleLabel: "",
    type: "constructeur" as WarrantyType,
    startDate: new Date().toISOString().slice(0, 10),
    durationMonths: 12,
    notes: "",
  });

  async function submit() {
    if (!f.clientName.trim()) return toast.error("Le nom du client est requis.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/garanties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Garantie enregistrée.");
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-6 py-10 overflow-y-auto"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onClose}
    >
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <SectionCard title="Nouvelle garantie">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Client *</label>
              <input value={f.clientName} onChange={(e) => setF((x) => ({ ...x, clientName: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Email client</label>
              <input type="email" value={f.clientEmail} onChange={(e) => setF((x) => ({ ...x, clientEmail: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Véhicule</label>
            <input value={f.vehicleLabel} onChange={(e) => setF((x) => ({ ...x, vehicleLabel: e.target.value }))} placeholder="Audi TT 40 TFSI (2019)" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Type</label>
              <select value={f.type} onChange={(e) => setF((x) => ({ ...x, type: e.target.value as WarrantyType }))} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {WARRANTY_TYPES.map((t) => <option key={t} value={t}>{WARRANTY_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Début</label>
              <input type="date" value={f.startDate} onChange={(e) => setF((x) => ({ ...x, startDate: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Durée</label>
              <select value={f.durationMonths} onChange={(e) => setF((x) => ({ ...x, durationMonths: parseInt(e.target.value, 10) }))} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {DURATION_OPTIONS.map((m) => <option key={m} value={m}>{m} mois</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Notes</label>
            <textarea value={f.notes} onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))} rows={2} className="px-4 py-3 text-sm outline-none w-full resize-y" style={fieldStyle} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>Annuler</button>
            <button type="button" onClick={submit} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : "Enregistrer"}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default function GarantiesClient({ warranties, canDelete }: { warranties: WarrantyRow[]; canDelete: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<WarrantyRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const expiring = useMemo(() => warranties.filter((w) => w.status === "expiring").length, [warranties]);

  async function remove(w: WarrantyRow) {
    setBusy(w.id);
    try {
      const res = await fetch(`/api/admin/garanties/${w.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Garantie supprimée.");
      setConfirmDelete(null);
      startTransition(() => router.refresh());
    } catch {
      toast.error("La suppression a échoué.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Garanties"
        subtitle={`${warranties.length} garantie${warranties.length > 1 ? "s" : ""}${expiring > 0 ? ` · ${expiring} à échéance` : ""}.`}
        action={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle garantie
          </button>
        }
      />

      {warranties.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} />
            Aucune garantie enregistrée. Ajoutez-en une à chaque vente pour suivre les échéances.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {warranties.map((w, i) => {
            const tone = TONE[STATUS_TONE[w.status]];
            return (
              <div key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
                <span className="min-w-0 sm:w-52">
                  <span className="text-sm font-medium block truncate" style={{ color: T.text }}>{w.clientName}</span>
                  {w.vehicleLabel && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] truncate" style={{ color: T.muted }}>
                      <Car size={11} />
                      {w.vehicleLabel}
                    </span>
                  )}
                </span>
                <Tag tone="muted">{WARRANTY_TYPE_LABEL[w.type as WarrantyType] ?? w.type}</Tag>
                <span className="text-[12px]" style={{ color: T.textDim }}>
                  {formatDateFr(w.startDate)} → {formatDateFr(w.endDate)}
                </span>
                <span className="flex items-center gap-3 ml-auto flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1" style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}>
                    {w.status === "expiring" && <AlertTriangle size={11} />}
                    {STATUS_LABEL[w.status]}
                    {w.status === "expiring" && ` · ${w.daysUntil} j`}
                  </span>
                  {canDelete && (
                    <button type="button" onClick={() => setConfirmDelete(w)} disabled={busy === w.id} aria-label="Supprimer" className="p-1 transition-colors hover:text-[#FF6B35]" style={{ color: T.muted }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {open && <NewWarrantyModal onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer cette garantie ?"
        busy={busy === confirmDelete?.id}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </AdminPage>
  );
}
