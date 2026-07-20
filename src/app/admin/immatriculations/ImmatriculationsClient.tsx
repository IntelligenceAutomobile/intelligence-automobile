"use client";

// Immatriculations : liste des dossiers SIV, avancement des pièces, échéances.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, FileBadge, Car, AlertTriangle, ChevronRight } from "lucide-react";
import {
  REG_TYPES, REG_TYPE_LABEL, REG_STATUS_LABEL, REG_STATUS_TONE, VAT_REGIME_LABEL,
  type Deadline, type RegStatus, type RegType, type VatRegime,
} from "@/lib/immatriculation";
import { T, TONE, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type RegRow = {
  id: string;
  reference: string;
  type: RegType;
  status: RegStatus;
  vehicleLabel: string;
  holderName: string;
  countryOrigin: string;
  plateFinal: string;
  vatRegime: VatRegime;
  done: number;
  total: number;
  nextDeadline: Deadline | null;
};

export type StockVehicle = {
  id: string;
  label: string;
  mileage: number;
  origin: string;
};

function NewDossierModal({ vehicles, onClose }: { vehicles: StockVehicle[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    type: "import_ue" as RegType,
    vehicleId: "",
    vehicleLabel: "",
    vin: "",
    plateForeign: "",
    countryOrigin: "Allemagne",
    firstRegDate: "",
    mileageKm: 0,
    holderName: "",
    acquiredOn: new Date().toISOString().slice(0, 10),
    deliveredOn: "",
  });

  async function submit() {
    if (!f.vehicleLabel.trim()) return toast.error("Le véhicule est requis.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/immatriculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Dossier ${j.reference} créé.`);
      onClose();
      router.push(`/admin/immatriculations/${j.id}`);
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
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <SectionCard title="Nouveau dossier d'immatriculation">
          {vehicles.length > 0 && (
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Reprendre un véhicule du stock</label>
              <select
                value={f.vehicleId}
                onChange={(e) => {
                  const v = vehicles.find((x) => x.id === e.target.value);
                  setF((x) => ({
                    ...x,
                    vehicleId: e.target.value,
                    vehicleLabel: v ? v.label : x.vehicleLabel,
                    mileageKm: v ? v.mileage : x.mileageKm,
                    countryOrigin: v ? v.origin : x.countryOrigin,
                  }));
                }}
                className="px-4 py-3 text-sm outline-none w-full cursor-pointer"
                style={fieldStyle}
              >
                <option value="">Saisie manuelle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <p className="text-[11px] mt-1.5" style={{ color: T.muted }}>
                Reprend le libellé, le kilométrage et le pays d&apos;origine de la fiche véhicule.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Type de dossier</label>
              <select value={f.type} onChange={(e) => setF((x) => ({ ...x, type: e.target.value as RegType }))} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {REG_TYPES.map((t) => <option key={t} value={t}>{REG_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Véhicule *</label>
              <input value={f.vehicleLabel} onChange={(e) => setF((x) => ({ ...x, vehicleLabel: e.target.value }))} placeholder="BMW Série 3 320d (2021)" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>VIN</label>
              <input value={f.vin} onChange={(e) => setF((x) => ({ ...x, vin: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full font-mono" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Immatriculation d&apos;origine</label>
              <input value={f.plateForeign} onChange={(e) => setF((x) => ({ ...x, plateForeign: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Pays d&apos;origine</label>
              <input value={f.countryOrigin} onChange={(e) => setF((x) => ({ ...x, countryOrigin: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>1re mise en circulation</label>
              <input type="date" value={f.firstRegDate} onChange={(e) => setF((x) => ({ ...x, firstRegDate: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Kilométrage à l&apos;acquisition</label>
              <input type="number" min={0} value={f.mileageKm} onChange={(e) => setF((x) => ({ ...x, mileageKm: parseInt(e.target.value, 10) || 0 }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Titulaire</label>
              <input value={f.holderName} onChange={(e) => setF((x) => ({ ...x, holderName: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Date d&apos;acquisition</label>
              <input type="date" value={f.acquiredOn} onChange={(e) => setF((x) => ({ ...x, acquiredOn: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Date de livraison</label>
              <input type="date" value={f.deliveredOn} onChange={(e) => setF((x) => ({ ...x, deliveredOn: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
            La date d&apos;acquisition ouvre le délai de 30 jours pour immatriculer. La date de livraison ouvre celui de 15 jours pour demander le quitus fiscal.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>Annuler</button>
            <button type="button" onClick={submit} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : "Créer le dossier"}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default function ImmatriculationsClient({
  registrations,
  vehicles,
  canDelete,
}: {
  registrations: RegRow[];
  vehicles: StockVehicle[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RegRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const late = useMemo(
    () => registrations.filter((r) => r.nextDeadline && r.nextDeadline.daysLeft < 0).length,
    [registrations],
  );

  async function remove(r: RegRow) {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/immatriculations/${r.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Dossier supprimé.");
      setConfirmDelete(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La suppression a échoué.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Immatriculations"
        subtitle={`${registrations.length} dossier${registrations.length > 1 ? "s" : ""}${late > 0 ? ` · ${late} hors délai` : ""}.`}
        action={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau dossier
          </button>
        }
      />

      {registrations.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <FileBadge size={15} />
            Ouvrez un dossier dès l&apos;achat du véhicule : les délais courent à partir de l&apos;acquisition.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {registrations.map((r, i) => {
            const tone = TONE[REG_STATUS_TONE[r.status]];
            const dl = r.nextDeadline;
            const dlTone = dl ? TONE[dl.tone] : null;
            return (
              <Link
                key={r.id}
                href={`/admin/immatriculations/${r.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[rgba(107,159,238,0.05)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <span className="min-w-0 sm:w-56">
                  <span className="text-sm font-medium block truncate" style={{ color: T.text }}>{r.vehicleLabel}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] truncate" style={{ color: T.muted }}>
                    <Car size={11} />
                    {r.reference}
                    {r.plateFinal ? ` · ${r.plateFinal}` : ` · ${r.countryOrigin}`}
                  </span>
                </span>

                <Tag tone="muted">{REG_TYPE_LABEL[r.type]}</Tag>
                {r.type === "import_ue" && r.vatRegime === "neuf" && <Tag tone="warning">{VAT_REGIME_LABEL.neuf}</Tag>}

                <span className="text-[12px]" style={{ color: r.done === r.total ? T.textDim : T.muted }}>
                  Pièces {r.done}/{r.total}
                </span>

                {dl && dlTone && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5"
                    style={{ backgroundColor: dlTone.bg, border: `1px solid ${dlTone.bd}`, color: dlTone.fg }}
                  >
                    {dl.daysLeft < 0 && <AlertTriangle size={11} />}
                    {dl.label} · {dl.daysLeft < 0 ? `${-dl.daysLeft} j de retard` : `${dl.daysLeft} j`}
                  </span>
                )}

                <span className="flex items-center gap-3 ml-auto flex-shrink-0">
                  <span className="text-[10px] tracking-[0.15em] uppercase px-2.5 py-1" style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}>
                    {REG_STATUS_LABEL[r.status]}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setConfirmDelete(r); }}
                      disabled={busy === r.id}
                      aria-label="Supprimer"
                      className="p-1 transition-colors hover:text-[#FF6B35]"
                      style={{ color: T.muted }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <ChevronRight size={14} style={{ color: T.muted }} />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {open && <NewDossierModal vehicles={vehicles} onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer ce dossier ?"
        description="Le dossier et sa checklist sont retirés du back-office."
        busy={busy === confirmDelete?.id}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </AdminPage>
  );
}
