"use client";

// Fiche client CRM : coordonnées, leads avec timeline d'interactions, devis liés.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, FileText, Mail, Phone, Building2, Pencil, Trash2,
  Plus, MessageSquare, PhoneCall, CalendarClock, ArrowRightLeft, Sparkles, Send,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  STAGES, STAGE_LABEL, STAGE_TONE, SOURCE_LABEL, EVENT_LABEL,
  type Stage, type Source, type EventType,
} from "@/lib/crm";
import { STATUS_LABEL, formatDateFr, type QuoteStatus } from "@/lib/devis";
import { T, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../../ui";
import { useToast } from "../../toast";
import { ConfirmDialog } from "../../confirm";

export type LeadEventRow = { id: string; type: string; content: string; author: string; createdAt: string };
export type LeadFull = {
  id: string;
  title: string;
  stage: string;
  source: string;
  vehicleId: string | null;
  budget: number | null;
  updatedAt: string;
  events: LeadEventRow[];
};
export type ClientFull = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  leads: LeadFull[];
};

type VehicleLite = { id: string; make: string; model: string; year: number };
type QuoteLite = { id: string; number: string; status: string; issueDate: string };

const EVENT_ICON: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  appel: PhoneCall,
  email: Mail,
  rdv: CalendarClock,
  etape: ArrowRightLeft,
  creation: Sparkles,
};

const QUOTE_TONE: Record<string, "muted" | "accent" | "success" | "danger"> = {
  brouillon: "muted",
  envoye: "accent",
  accepte: "success",
  refuse: "danger",
};

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Timeline + ajout d'interaction d'un lead ── */
function LeadBlock({ lead, vehicles }: { lead: LeadFull; vehicles: VehicleLite[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [eventType, setEventType] = useState<EventType>("note");
  const [content, setContent] = useState("");

  const vehicle = lead.vehicleId ? vehicles.find((v) => v.id === lead.vehicleId) : null;

  async function changeStage(stage: Stage) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Étape : ${STAGE_LABEL[stage]}`);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Le changement d'étape a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function addEvent() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: eventType, content }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      toast.success("Interaction ajoutée.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("L'ajout a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate" style={{ color: T.text }}>
            {lead.title || SOURCE_LABEL[lead.source as Source] || "Opportunité"}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]" style={{ color: T.muted }}>
            <span>{SOURCE_LABEL[lead.source as Source] ?? lead.source}</span>
            {vehicle && <span>· {vehicle.make} {vehicle.model} ({vehicle.year})</span>}
            {lead.budget != null && <span>· Budget {formatNumber(lead.budget)} €</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tag tone={STAGE_TONE[lead.stage as Stage] ?? "muted"}>{STAGE_LABEL[lead.stage as Stage] ?? lead.stage}</Tag>
          <select
            value={lead.stage}
            disabled={busy}
            onChange={(e) => changeStage(e.target.value as Stage)}
            className="text-xs px-3 py-2 outline-none focus:border-[#6B9FEE] cursor-pointer"
            style={{ ...fieldStyle, width: undefined }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <ul className="space-y-0.5">
        {lead.events.map((e, i) => {
          const Icon = EVENT_ICON[e.type] ?? MessageSquare;
          return (
            <li key={e.id} className="flex items-start gap-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
              <span
                className="flex items-center justify-center w-6 h-6 flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}` }}
              >
                <Icon size={12} style={{ color: e.type === "creation" ? T.accent : T.textDim }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] whitespace-pre-wrap break-words" style={{ color: T.textDim }}>{e.content}</div>
                <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                  {EVENT_LABEL[e.type as EventType] ?? e.type}
                  {e.author ? ` · ${e.author}` : ""} · {timeAgo(e.createdAt)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Ajout d'interaction */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          className="text-xs px-3 py-2.5 outline-none focus:border-[#6B9FEE] cursor-pointer flex-shrink-0"
          style={{ ...fieldStyle, width: undefined }}
        >
          <option value="note">Note</option>
          <option value="appel">Appel</option>
          <option value="email">Email</option>
          <option value="rdv">RDV</option>
        </select>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addEvent(); }}
          placeholder="Ajouter une interaction… (Entrée pour valider)"
          className="px-4 py-2.5 text-sm outline-none focus:border-[#6B9FEE] flex-1"
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={addEvent}
          disabled={busy || !content.trim()}
          className={btnGhostClass + " flex-shrink-0"}
          style={btnGhostStyle}
        >
          <Send size={13} />
          Ajouter
        </button>
      </div>
    </SectionCard>
  );
}

/* ── Page ── */
export default function ClientDetail({
  client, vehicles, quotes,
}: {
  client: ClientFull;
  vehicles: VehicleLite[];
  quotes: QuoteLite[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: client.name, company: client.company, email: client.email, phone: client.phone, notes: client.notes });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveClient() {
    if (!form.name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Client mis à jour.");
      setEditing(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteClient() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Client supprimé.");
      router.push("/admin/clients");
      router.refresh();
    } catch {
      toast.error("La suppression a échoué.");
      setBusy(false);
    }
  }

  async function newLead() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, source: "manuel" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead créé.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("La création a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const input = (key: keyof typeof form, label: string) => (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
        style={fieldStyle}
      />
    </div>
  );

  return (
    <AdminPage>
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        <ChevronLeft size={13} />
        Clients & leads
      </Link>

      <PageHeader
        title={client.company || client.name}
        subtitle={client.company ? client.name : `Client depuis le ${new Date(client.createdAt).toLocaleDateString("fr-FR")}`}
        action={
          <div className="flex items-center gap-3">
            <button type="button" onClick={newLead} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
              <Plus size={13} />
              Lead
            </button>
            <Link href={`/admin/devis/nouveau?client=${client.id}`} className={btnPrimaryClass} style={btnPrimaryStyle}>
              <FileText size={13} />
              Créer un devis
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Colonne coordonnées */}
        <div className="space-y-4">
          <SectionCard title="Coordonnées">
            {editing ? (
              <>
                {input("name", "Nom *")}
                {input("company", "Société")}
                {input("email", "Email")}
                {input("phone", "Téléphone")}
                <div>
                  <label className={labelClass} style={{ color: T.textDim }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full resize-y"
                    style={fieldStyle}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={saveClient} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
                    {busy ? "…" : "Enregistrer"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <ul className="space-y-2.5 text-sm" style={{ color: T.textDim }}>
                  {client.company && (
                    <li className="flex items-center gap-2.5">
                      <Building2 size={14} style={{ color: T.muted, flexShrink: 0 }} />
                      {client.company}
                    </li>
                  )}
                  <li className="flex items-center gap-2.5">
                    <Mail size={14} style={{ color: T.muted, flexShrink: 0 }} />
                    {client.email || <span style={{ color: T.muted }}>Pas d&apos;email</span>}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone size={14} style={{ color: T.muted, flexShrink: 0 }} />
                    {client.phone || <span style={{ color: T.muted }}>Pas de téléphone</span>}
                  </li>
                </ul>
                {client.notes && (
                  <p className="text-[13px] whitespace-pre-wrap pt-3" style={{ color: T.muted, borderTop: `1px solid ${T.border}` }}>
                    {client.notes}
                  </p>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
                    style={{ color: T.accent }}
                  >
                    <Pencil size={12} />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
                    style={{ color: T.muted }}
                  >
                    <Trash2 size={12} />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title={`Devis (${quotes.length})`}>
            {quotes.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>Aucun devis lié.</p>
            ) : (
              <ul>
                {quotes.map((q, i) => (
                  <li key={q.id}>
                    <Link
                      href={`/admin/devis/${q.id}`}
                      className="flex items-center gap-3 py-2 transition-colors hover:text-[#F0F5FF]"
                      style={{ color: T.textDim, borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}
                    >
                      <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>{q.number}</span>
                      <span className="text-xs hidden sm:inline" style={{ color: T.muted }}>{formatDateFr(q.issueDate)}</span>
                      <span className="ml-auto">
                        <Tag tone={QUOTE_TONE[q.status] ?? "muted"}>
                          {STATUS_LABEL[q.status as QuoteStatus] ?? q.status}
                        </Tag>
                      </span>
                      <ChevronRight size={13} style={{ color: T.muted }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Colonne leads + timeline */}
        <div className="lg:col-span-2 space-y-4">
          {client.leads.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
              Aucune opportunité pour ce client.{" "}
              <button type="button" onClick={newLead} className="underline-offset-2 hover:underline" style={{ color: T.accent }}>
                Créer un lead.
              </button>
            </div>
          ) : (
            client.leads.map((lead) => <LeadBlock key={lead.id} lead={lead} vehicles={vehicles} />)
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce client ?"
        description="Ses leads et son historique d'interactions seront définitivement supprimés. Les devis liés sont conservés."
        busy={busy}
        onConfirm={deleteClient}
        onCancel={() => setConfirmDelete(false)}
      />
    </AdminPage>
  );
}
