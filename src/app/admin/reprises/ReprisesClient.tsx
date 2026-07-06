"use client";

// Reprise / estimation : formulaire interne d'évaluation d'un véhicule client.
// Crée un client + un lead « reprise » dans le CRM (visible dans le pipeline).
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Car, ChevronRight, Banknote } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { STAGE_LABEL, STAGE_TONE, type Stage } from "@/lib/crm";
import { T, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";

export type RepriseRow = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  stage: string;
  budget: number | null;
  updatedAt: string;
};

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const FUELS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
const BOITES = ["Manuelle", "Automatique"];

function NewRepriseModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [client, setClient] = useState({ name: "", company: "", email: "", phone: "" });
  const [vehicle, setVehicle] = useState({ make: "", model: "", year: "", mileage: "", fuel: "Essence", transmission: "Manuelle", condition: "" });
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!client.name.trim()) return toast.error("Le nom du client est requis.");
    if (!vehicle.make.trim() || !vehicle.model.trim()) return toast.error("La marque et le modèle sont requis.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          vehicle: {
            ...vehicle,
            year: vehicle.year ? parseInt(vehicle.year, 10) : null,
            mileage: vehicle.mileage ? parseInt(vehicle.mileage.replace(/\s/g, ""), 10) : null,
          },
          value: value ? parseInt(value.replace(/\s/g, ""), 10) : null,
          notes,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Estimation enregistrée — lead reprise créé.");
      onClose();
      router.push(`/admin/clients/${j.clientId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué.");
      setBusy(false);
    }
  }

  const inp = (val: string, set: (v: string) => void, label: string, opts?: { placeholder?: string; type?: string }) => (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      <input
        type={opts?.type ?? "text"}
        value={val}
        onChange={(e) => set(e.target.value)}
        placeholder={opts?.placeholder}
        className="px-4 py-3 text-sm outline-none w-full"
        style={fieldStyle}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-6 py-10 overflow-y-auto"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onClose}
    >
      <div className="w-full max-w-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <SectionCard title="Client">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inp(client.name, (v) => setClient((c) => ({ ...c, name: v })), "Nom *")}
            {inp(client.company, (v) => setClient((c) => ({ ...c, company: v })), "Société")}
            {inp(client.email, (v) => setClient((c) => ({ ...c, email: v })), "Email", { type: "email" })}
            {inp(client.phone, (v) => setClient((c) => ({ ...c, phone: v })), "Téléphone")}
          </div>
        </SectionCard>

        <SectionCard title="Véhicule évalué">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inp(vehicle.make, (v) => setVehicle((x) => ({ ...x, make: v })), "Marque *", { placeholder: "Audi, BMW…" })}
            {inp(vehicle.model, (v) => setVehicle((x) => ({ ...x, model: v })), "Modèle *")}
            {inp(vehicle.year, (v) => setVehicle((x) => ({ ...x, year: v })), "Année", { type: "text", placeholder: "2019" })}
            {inp(vehicle.mileage, (v) => setVehicle((x) => ({ ...x, mileage: v })), "Kilométrage")}
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Carburant</label>
              <select value={vehicle.fuel} onChange={(e) => setVehicle((x) => ({ ...x, fuel: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Boîte</label>
              <select value={vehicle.transmission} onChange={(e) => setVehicle((x) => ({ ...x, transmission: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {BOITES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>État constaté</label>
            <textarea value={vehicle.condition} onChange={(e) => setVehicle((x) => ({ ...x, condition: e.target.value }))} rows={2} placeholder="Carrosserie, pneus, historique d'entretien, points de vigilance…" className="px-4 py-3 text-sm outline-none w-full resize-y" style={fieldStyle} />
          </div>
        </SectionCard>

        <SectionCard title="Estimation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Prix de reprise proposé (€)</label>
              <input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="18 000" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Notes internes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="px-4 py-3 text-sm outline-none w-full resize-y" style={fieldStyle} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>Annuler</button>
            <button type="button" onClick={submit} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : "Enregistrer l'estimation"}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default function ReprisesClient({ reprises }: { reprises: RepriseRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <AdminPage>
      <PageHeader
        title="Reprises"
        subtitle={`${reprises.length} estimation${reprises.length > 1 ? "s" : ""} · évaluez un véhicule client, il devient un lead.`}
        action={
          <button type="button" onClick={() => setOpen(true)} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle estimation
          </button>
        }
      />

      {reprises.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <Car size={15} />
            Aucune reprise. Cliquez « Nouvelle estimation » pour évaluer le véhicule d&apos;un client.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {reprises.map((r, i) => (
            <Link
              key={r.id}
              href={`/admin/clients/${r.clientId}`}
              className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#0A1628]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <span className="inline-flex items-center gap-2 min-w-0 flex-1">
                <Car size={15} style={{ color: T.accent, flexShrink: 0 }} />
                <span className="text-sm truncate" style={{ color: T.text }}>{r.title}</span>
              </span>
              <span className="text-xs truncate hidden sm:inline" style={{ color: T.muted, minWidth: 120 }}>{r.clientName}</span>
              {r.budget != null && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold flex-shrink-0" style={{ color: T.text }}>
                  <Banknote size={13} style={{ color: T.muted }} />
                  {formatNumber(r.budget)} €
                </span>
              )}
              <Tag tone={STAGE_TONE[r.stage as Stage] ?? "muted"}>{STAGE_LABEL[r.stage as Stage] ?? r.stage}</Tag>
              <span className="text-[10px] flex-shrink-0" style={{ color: T.muted }}>{timeAgo(r.updatedAt)}</span>
              <ChevronRight size={14} style={{ color: T.muted, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}

      {open && <NewRepriseModal onClose={() => setOpen(false)} />}
    </AdminPage>
  );
}
