"use client";

// CRM : pipeline kanban des leads + carnet clients + création client/lead.
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, ChevronLeft, ChevronRight, Check, X, Users,
  Car, Banknote, Building2, Mail, Phone,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  PIPELINE_STAGES, STAGE_LABEL, STAGE_TONE, SOURCE_LABEL, SOURCES,
  type Stage, type Source,
} from "@/lib/crm";
import { T, TONE, Tag, AdminPage, PageHeader, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";

export type LeadRow = {
  id: string;
  title: string;
  stage: string;
  source: string;
  vehicleId: string | null;
  budget: number | null;
  updatedAt: string;
};

export type ClientRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  updatedAt: string;
  leads: LeadRow[];
};

type VehicleLite = { id: string; make: string; model: string; year: number };

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return `il y a ${Math.floor(s / 86400)} j`;
}

/* ── Carte lead du kanban ── */
function LeadCard({
  lead, client, vehicleLabel, onMove, onOutcome, busy,
}: {
  lead: LeadRow;
  client: ClientRow;
  vehicleLabel?: string;
  onMove: (dir: -1 | 1) => void;
  onOutcome: (stage: "gagne" | "perdu") => void;
  busy: boolean;
}) {
  const idx = PIPELINE_STAGES.indexOf(lead.stage as Stage);
  return (
    <div className="adm-card p-3.5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      <Link href={`/admin/clients/${client.id}`} className="block min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>
          {client.company || client.name}
        </div>
        <div className="text-[11px] truncate mt-0.5" style={{ color: T.muted }}>
          {lead.title || SOURCE_LABEL[lead.source as Source] || lead.source}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px]" style={{ color: T.textDim }}>
          {vehicleLabel && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Car size={11} style={{ color: T.muted, flexShrink: 0 }} />
              <span className="truncate">{vehicleLabel}</span>
            </span>
          )}
          {lead.budget != null && (
            <span className="inline-flex items-center gap-1">
              <Banknote size={11} style={{ color: T.muted }} />
              {formatNumber(lead.budget)} €
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <Tag tone={STAGE_TONE[lead.stage as Stage] ?? "muted"}>{SOURCE_LABEL[lead.source as Source] ?? lead.source}</Tag>
          <span className="text-[10px]" style={{ color: T.muted }}>{timeAgo(lead.updatedAt)}</span>
        </div>
      </Link>
      <div className="flex items-center gap-1 mt-3 pt-2.5" style={{ borderTop: `1px solid ${T.surfaceAlt}` }}>
        <button
          type="button"
          disabled={busy || idx <= 0}
          onClick={() => onMove(-1)}
          aria-label="Étape précédente"
          className="p-1.5 transition-colors hover:text-[#F0F5FF] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          disabled={busy || idx >= PIPELINE_STAGES.length - 1}
          onClick={() => onMove(1)}
          aria-label="Étape suivante"
          className="p-1.5 transition-colors hover:text-[#F0F5FF] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onOutcome("gagne")}
          className="ml-auto inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-1.5 transition-colors hover:text-[#4ED1A1] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <Check size={12} />
          Gagné
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onOutcome("perdu")}
          className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-1.5 transition-colors hover:text-[#FF6B35] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <X size={12} />
          Perdu
        </button>
      </div>
    </div>
  );
}

/* ── Modale nouveau client ── */
function NewClientModal({ vehicles, onClose }: { vehicles: VehicleLite[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "" });
  const [withLead, setWithLead] = useState(true);
  const [lead, setLead] = useState({ title: "", source: "manuel" as Source, budget: "", vehicleId: "" });

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lead: withLead
            ? {
                title: lead.title,
                source: lead.source,
                budget: lead.budget ? parseInt(lead.budget.replace(/\s/g, ""), 10) : null,
                vehicleId: lead.vehicleId || null,
              }
            : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Client créé.");
      onClose();
      router.refresh();
    } catch {
      toast.error("La création a échoué.");
      setBusy(false);
    }
  }

  const input = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
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
      <div
        className="w-full max-w-lg p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium mb-5" style={{ color: T.text }}>Nouveau client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {input("name", "Nom *")}
          {input("company", "Société")}
          {input("email", "Email", "email")}
          {input("phone", "Téléphone")}
        </div>
        <div className="mt-4">
          <label className={labelClass} style={{ color: T.textDim }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full resize-y"
            style={fieldStyle}
          />
        </div>

        <label className="flex items-center gap-2.5 mt-5 cursor-pointer text-sm" style={{ color: T.textDim }}>
          <input type="checkbox" checked={withLead} onChange={(e) => setWithLead(e.target.checked)} />
          Créer une opportunité (lead) pour ce client
        </label>

        {withLead && (
          <div className="mt-4 p-4 space-y-4" style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Objet</label>
              <input
                value={lead.title}
                onChange={(e) => setLead((l) => ({ ...l, title: e.target.value }))}
                placeholder="Ex : Recherche SUV hybride"
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                style={fieldStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Source</label>
                <select
                  value={lead.source}
                  onChange={(e) => setLead((l) => ({ ...l, source: e.target.value as Source }))}
                  className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
                  style={fieldStyle}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Budget (€)</label>
                <input
                  inputMode="numeric"
                  value={lead.budget}
                  onChange={(e) => setLead((l) => ({ ...l, budget: e.target.value }))}
                  className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                  style={fieldStyle}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Véhicule concerné</label>
              <select
                value={lead.vehicleId}
                onChange={(e) => setLead((l) => ({ ...l, vehicleId: e.target.value }))}
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
                style={fieldStyle}
              >
                <option value="">— Aucun —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} · {v.year}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
          <button type="button" onClick={submit} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {busy ? "…" : "Créer le client"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ClientsClient({ clients, vehicles }: { clients: ClientRow[]; vehicles: VehicleLite[] }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const vehicleLabel = useMemo(() => {
    const m = new Map<string, string>();
    vehicles.forEach((v) => m.set(v.id, `${v.make} ${v.model}`));
    return m;
  }, [vehicles]);

  // Leads aplatis avec leur client, par étape du pipeline.
  const byStage = useMemo(() => {
    const map = new Map<Stage, { lead: LeadRow; client: ClientRow }[]>();
    PIPELINE_STAGES.forEach((s) => map.set(s, []));
    for (const c of clients) {
      for (const l of c.leads) {
        const s = l.stage as Stage;
        if (map.has(s)) map.get(s)!.push({ lead: l, client: c });
      }
    }
    return map;
  }, [clients]);

  const outcomes = useMemo(() => {
    let gagne = 0, perdu = 0;
    for (const c of clients) for (const l of c.leads) {
      if (l.stage === "gagne") gagne++;
      if (l.stage === "perdu") perdu++;
    }
    return { gagne, perdu };
  }, [clients]);

  async function setStage(leadId: string, stage: Stage) {
    setBusyLead(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
      if (stage === "gagne") toast.success("Lead marqué gagné 🎉");
      else if (stage === "perdu") toast.info("Lead marqué perdu.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Le changement d'étape a échoué.");
    } finally {
      setBusyLead(null);
    }
  }

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.name} ${c.company} ${c.email} ${c.phone}`.toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <AdminPage>
      <PageHeader
        title="Clients & leads"
        subtitle={`${clients.length} client${clients.length > 1 ? "s" : ""} · pipeline de vente.`}
        action={
          <button type="button" onClick={() => setModalOpen(true)} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau client
          </button>
        }
      />

      {/* ── Pipeline ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Pipeline</h2>
        <div className="flex items-center gap-2">
          <Tag tone="success">{outcomes.gagne} gagné{outcomes.gagne > 1 ? "s" : ""}</Tag>
          <Tag tone="muted">{outcomes.perdu} perdu{outcomes.perdu > 1 ? "s" : ""}</Tag>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {PIPELINE_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const tone = TONE[STAGE_TONE[stage]];
          return (
            <div key={stage} className="min-w-0">
              <div
                className="flex items-center gap-2 px-3 py-2.5 mb-3"
                style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}
              >
                <span style={{ width: 8, height: 8, backgroundColor: tone.fg, flexShrink: 0 }} />
                <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.textDim }}>
                  {STAGE_LABEL[stage]}
                </span>
                <span className="text-[11px] ml-auto" style={{ color: T.muted }}>{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div
                    className="p-4 text-center text-[11px]"
                    style={{ border: `1px dashed ${T.border}`, color: T.muted }}
                  >
                    Aucun lead
                  </div>
                ) : (
                  items.map(({ lead, client }) => {
                    const idx = PIPELINE_STAGES.indexOf(stage);
                    return (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        client={client}
                        vehicleLabel={lead.vehicleId ? vehicleLabel.get(lead.vehicleId) : undefined}
                        busy={busyLead === lead.id}
                        onMove={(dir) => {
                          const next = PIPELINE_STAGES[idx + dir];
                          if (next) setStage(lead.id, next);
                        }}
                        onOutcome={(s) => setStage(lead.id, s)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Carnet clients ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Carnet clients</h2>
        <div className="relative sm:ml-auto sm:max-w-xs w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client…"
            className="pl-11 pr-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
            style={fieldStyle}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          {clients.length === 0 ? (
            <span className="inline-flex items-center gap-2">
              <Users size={15} />
              Aucun client pour l&apos;instant. Les formulaires du site en créeront automatiquement.
            </span>
          ) : (
            "Aucun résultat pour cette recherche."
          )}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {filteredClients.map((c, i) => {
            const active = c.leads.filter((l) => PIPELINE_STAGES.includes(l.stage as Stage)).length;
            return (
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3.5 transition-colors hover:bg-[#0A1628]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <div className="min-w-0 sm:w-64">
                  <span className="text-sm font-medium block truncate" style={{ color: T.text }}>{c.name}</span>
                  {c.company && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] truncate" style={{ color: T.muted }}>
                      <Building2 size={11} />
                      {c.company}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] min-w-0" style={{ color: T.textDim }}>
                  {c.email && (
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Mail size={12} style={{ color: T.muted }} />
                      <span className="truncate">{c.email}</span>
                    </span>
                  )}
                  {c.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={12} style={{ color: T.muted }} />
                      {c.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:ml-auto flex-shrink-0">
                  {active > 0 && <Tag tone="accent">{active} lead{active > 1 ? "s" : ""} actif{active > 1 ? "s" : ""}</Tag>}
                  <span className="text-[10px]" style={{ color: T.muted }}>{timeAgo(c.updatedAt)}</span>
                  <ChevronRight size={14} style={{ color: T.muted }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {modalOpen && <NewClientModal vehicles={vehicles} onClose={() => setModalOpen(false)} />}
    </AdminPage>
  );
}
