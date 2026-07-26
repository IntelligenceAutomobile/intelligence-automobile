"use client";

// Planning atelier : vue semaine (lun-sam), RDV typés, indisponibilités équipe.
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Car, Users } from "lucide-react";
import {
  APPOINTMENT_TYPES, TYPE_LABEL, TYPE_COLOR, DAY_START_MIN, DAY_END_MIN,
  formatMin, formatDayFr, authorColor, signatureOf, type AppointmentType,
} from "@/lib/planning";
import { T, AdminPage, PageHeader, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type ApptRow = {
  id: string;
  date: string;
  startMin: number;
  durationMin: number;
  type: string;
  title: string;
  person: string;
  author: string;
  clientId: string | null;
  vehicleId: string | null;
  notes: string;
};

type ClientLite = { id: string; name: string; company: string };
type VehicleLite = { id: string; make: string; model: string; year: number };

const PX_PER_HOUR = 48;
const GRID_H = ((DAY_END_MIN - DAY_START_MIN) / 60) * PX_PER_HOUR;

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1 h 30" },
  { value: 120, label: "2 h" },
  { value: 180, label: "3 h" },
  { value: 240, label: "4 h" },
  { value: 480, label: "Journée" },
];

type Draft = {
  id?: string;
  date: string;
  startMin: number;
  durationMin: number;
  type: AppointmentType;
  title: string;
  person: string;
  author: string; // signature, posée par le serveur à la création (lecture seule)
  clientId: string;
  vehicleId: string;
  notes: string;
};

function emptyDraft(date: string, startMin: number, person: string): Draft {
  return { date, startMin, durationMin: 60, type: "essai", title: "", person, author: person, clientId: "", vehicleId: "", notes: "" };
}

/* ── Pastille de signature ── */
function AuthorDot({ name, size = 7, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={className}
      title={`Créé par ${name}`}
      style={{ display: "block", width: size, height: size, borderRadius: "50%", backgroundColor: authorColor(name), flexShrink: 0 }}
    />
  );
}

/* ── Modale création / édition ── */
function ApptModal({
  draft: initial, clients, vehicles, appointments, onClose,
}: {
  draft: Draft;
  clients: ClientLite[];
  vehicles: VehicleLite[];
  appointments: ApptRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = Boolean(initial.id);
  const signature = signatureOf(d);

  // Chevauchement avec un autre événement du même jour (information, non bloquant).
  const conflict = useMemo(() => {
    const end = d.startMin + d.durationMin;
    return appointments.find(
      (a) => a.id !== d.id && a.date === d.date && a.startMin < end && a.startMin + a.durationMin > d.startMin,
    );
  }, [appointments, d]);

  async function save() {
    if (d.type === "indispo" && !d.person.trim()) {
      toast.error("Indiquez la personne concernée par l'indisponibilité.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/rdv/${d.id}` : "/api/admin/rdv", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, clientId: d.clientId || null, vehicleId: d.vehicleId || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "RDV mis à jour." : "RDV planifié.");
      onClose();
      startTransition(() => router.refresh());
    } catch {
      toast.error("L'enregistrement a échoué.");
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/rdv/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("RDV supprimé.");
      onClose();
      startTransition(() => router.refresh());
    } catch {
      toast.error("La suppression a échoué.");
      setBusy(false);
    }
  }

  const isIndispo = d.type === "indispo";
  const startOptions = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 30 }, (_, i) => DAY_START_MIN + i * 30);

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
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-medium" style={{ color: T.text }}>
            {isEdit ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          {signature && (
            <span className="inline-flex items-center gap-1.5 text-[11px] flex-shrink-0" style={{ color: T.muted }}>
              <AuthorDot name={signature} />
              {isEdit ? "Créé par" : "Sera signé"} {signature}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Type</label>
            <select
              value={d.type}
              onChange={(e) => setD((x) => ({ ...x, type: e.target.value as AppointmentType }))}
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
              style={fieldStyle}
            >
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>
              {isIndispo ? "Personne concernée *" : "Personne (optionnel)"}
            </label>
            <input
              value={d.person}
              onChange={(e) => setD((x) => ({ ...x, person: e.target.value }))}
              placeholder="César, Fab…"
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
              style={fieldStyle}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass} style={{ color: T.textDim }}>Titre</label>
          <input
            value={d.title}
            onChange={(e) => setD((x) => ({ ...x, title: e.target.value }))}
            placeholder={isIndispo ? "RDV perso, congé…" : "Essai TT 40, livraison A3…"}
            className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
            style={fieldStyle}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Jour</label>
            <input
              type="date"
              value={d.date}
              onChange={(e) => setD((x) => ({ ...x, date: e.target.value }))}
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
              style={fieldStyle}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Début</label>
            <select
              value={d.startMin}
              onChange={(e) => setD((x) => ({ ...x, startMin: parseInt(e.target.value, 10) }))}
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
              style={fieldStyle}
            >
              {startOptions.map((m) => (
                <option key={m} value={m}>{formatMin(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Durée</label>
            <select
              value={d.durationMin}
              onChange={(e) => setD((x) => ({ ...x, durationMin: parseInt(e.target.value, 10) }))}
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
              style={fieldStyle}
            >
              {DURATIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {!isIndispo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Client</label>
              <select
                value={d.clientId}
                onChange={(e) => setD((x) => ({ ...x, clientId: e.target.value }))}
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
                style={fieldStyle}
              >
                <option value="">— Aucun —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Véhicule</label>
              <select
                value={d.vehicleId}
                onChange={(e) => setD((x) => ({ ...x, vehicleId: e.target.value }))}
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

        <div className="mt-4">
          <label className={labelClass} style={{ color: T.textDim }}>Notes</label>
          <textarea
            value={d.notes}
            onChange={(e) => setD((x) => ({ ...x, notes: e.target.value }))}
            rows={2}
            className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full resize-y"
            style={fieldStyle}
          />
        </div>

        {conflict && (
          <p className="flex items-center gap-2 text-[12px] mt-4" style={{ color: T.warning }}>
            <AlertTriangle size={14} />
            Chevauche « {conflict.title || (TYPE_LABEL[conflict.type as AppointmentType] ?? conflict.type)} » à {formatMin(conflict.startMin)}.
          </p>
        )}

        <div className="flex items-center gap-3 mt-6">
          {isEdit && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
              style={{ color: T.muted }}
            >
              <Trash2 size={13} />
              Supprimer
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
              Annuler
            </button>
            <button type="button" onClick={save} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : isEdit ? "Enregistrer" : "Planifier"}
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          title="Supprimer cet événement ?"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    </div>
  );
}

/* ── Page ── */
export default function PlanningClient({
  appointments, clients, vehicles, weekKeys, mondayKey, prevWeek, nextWeek, todayKey, defaultPerson,
}: {
  appointments: ApptRow[];
  clients: ClientLite[];
  vehicles: VehicleLite[];
  weekKeys: string[];
  mondayKey: string;
  prevWeek: string;
  nextWeek: string;
  todayKey: string;
  defaultPerson: string;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const clientName = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach((c) => m.set(c.id, c.company || c.name));
    return m;
  }, [clients]);
  const vehicleName = useMemo(() => {
    const m = new Map<string, string>();
    vehicles.forEach((v) => m.set(v.id, `${v.make} ${v.model}`));
    return m;
  }, [vehicles]);

  // Légende des signatures : seulement les personnes présentes dans la semaine affichée.
  const signatures = useMemo(() => {
    const found = new Set<string>();
    appointments.forEach((a) => {
      const s = signatureOf(a);
      if (s) found.add(s);
    });
    return [...found].sort((a, b) => a.localeCompare(b, "fr"));
  }, [appointments]);

  const monday = new Date(`${mondayKey}T00:00:00`);
  const weekLabel = monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const hours = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60);

  function openCreate(date: string, startMin = 9 * 60) {
    setDraft(emptyDraft(date, startMin, defaultPerson));
  }

  function openEdit(a: ApptRow) {
    setDraft({
      id: a.id,
      date: a.date,
      startMin: a.startMin,
      durationMin: a.durationMin,
      type: (a.type as AppointmentType) ?? "autre",
      title: a.title,
      person: a.person,
      author: a.author,
      clientId: a.clientId ?? "",
      vehicleId: a.vehicleId ?? "",
      notes: a.notes,
    });
  }

  function slotFromClick(e: React.MouseEvent<HTMLDivElement>, date: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = DAY_START_MIN + (y / PX_PER_HOUR) * 60;
    const snapped = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - 30, Math.round(raw / 30) * 30));
    openCreate(date, snapped);
  }

  return (
    <AdminPage>
      <PageHeader
        title="Planning atelier"
        subtitle={`Semaine du ${weekLabel} · essais, livraisons, préparation, indisponibilités.`}
        action={
          <div className="flex items-center gap-3">
            <div className="flex" style={{ border: `1px solid ${T.border}` }}>
              <Link href={`/admin/planning?semaine=${prevWeek}`} className="p-2.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Semaine précédente">
                <ChevronLeft size={15} />
              </Link>
              <Link
                href="/admin/planning"
                className="px-3 py-2.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.textDim, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}
              >
                Aujourd&apos;hui
              </Link>
              <Link href={`/admin/planning?semaine=${nextWeek}`} className="p-2.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Semaine suivante">
                <ChevronRight size={15} />
              </Link>
            </div>
            <button type="button" onClick={() => openCreate(todayKey)} className={btnPrimaryClass} style={btnPrimaryStyle}>
              <Plus size={14} />
              Événement
            </button>
          </div>
        }
      />

      {/* Légende — carré : le type d'événement. Rond : qui l'a créé. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
        {APPOINTMENT_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
            <span style={{ width: 9, height: 9, backgroundColor: TYPE_COLOR[t].bd, flexShrink: 0 }} />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4" style={{ minHeight: 14 }}>
        {signatures.length > 0 && (
          <>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Créé par</span>
            {signatures.map((name) => (
              <span key={name} className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
                <AuthorDot name={name} />
                {name}
              </span>
            ))}
          </>
        )}
      </div>

      {/* Grille semaine */}
      <div className="overflow-x-auto" style={{ border: `1px solid ${T.border}` }}>
        <div className="min-w-[900px]">
          {/* En-têtes des jours */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(6, 1fr)` }}>
            <div style={{ borderBottom: `1px solid ${T.border}` }} />
            {weekKeys.map((key) => {
              const d = new Date(`${key}T00:00:00`);
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className="px-3 py-2.5 text-[11px] tracking-[0.14em] uppercase"
                  style={{
                    color: isToday ? T.accent : T.textDim,
                    fontWeight: isToday ? 600 : 400,
                    borderBottom: `1px solid ${T.border}`,
                    borderLeft: `1px solid ${T.border}`,
                    backgroundColor: isToday ? "rgba(107,159,238,0.06)" : T.surfaceAlt,
                  }}
                >
                  {formatDayFr(d)}
                </div>
              );
            })}
          </div>

          {/* Corps */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(6, 1fr)` }}>
            {/* Gouttière horaire */}
            <div className="relative" style={{ height: GRID_H }}>
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 text-[10px]"
                  style={{ top: ((h - DAY_START_MIN) / 60) * PX_PER_HOUR - 6, color: T.muted }}
                >
                  {formatMin(h)}
                </span>
              ))}
            </div>

            {weekKeys.map((key) => {
              const isToday = key === todayKey;
              const dayAppts = appointments.filter((a) => a.date === key);
              return (
                <div
                  key={key}
                  className="relative cursor-pointer"
                  style={{
                    height: GRID_H,
                    borderLeft: `1px solid ${T.border}`,
                    backgroundColor: isToday ? "rgba(107,159,238,0.04)" : "transparent",
                  }}
                  onClick={(e) => slotFromClick(e, key)}
                >
                  {hours.slice(1).map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0"
                      style={{ top: ((h - DAY_START_MIN) / 60) * PX_PER_HOUR, height: 1, backgroundColor: T.border, opacity: 0.45 }}
                    />
                  ))}

                  {dayAppts.map((a) => {
                    const c = TYPE_COLOR[(a.type as AppointmentType) ?? "autre"] ?? TYPE_COLOR.autre;
                    const top = ((a.startMin - DAY_START_MIN) / 60) * PX_PER_HOUR;
                    const height = Math.max(22, (a.durationMin / 60) * PX_PER_HOUR - 2);
                    const isIndispo = a.type === "indispo";
                    const signature = signatureOf(a);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                        className="absolute inset-x-1 text-left px-2 py-1 overflow-hidden transition-transform hover:scale-[1.015]"
                        style={{
                          top,
                          height,
                          backgroundColor: c.bg,
                          borderLeft: `2px solid ${c.bd}`,
                          backgroundImage: isIndispo
                            ? "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(124,146,181,0.12) 5px, rgba(124,146,181,0.12) 7px)"
                            : undefined,
                        }}
                      >
                        {/* Ligne 1 : la pastille de signature reste visible même sur un créneau de 30 min. */}
                        <span className="flex items-center gap-1.5">
                          {signature && <AuthorDot name={signature} size={6} />}
                          <span className="text-[11px] font-medium truncate min-w-0" style={{ color: c.fg }}>
                            {isIndispo && a.person ? `${a.person} — ` : ""}
                            {a.title || TYPE_LABEL[(a.type as AppointmentType) ?? "autre"]}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: T.muted }}>
                          <span className="truncate min-w-0">
                            {formatMin(a.startMin)} · {TYPE_LABEL[(a.type as AppointmentType) ?? "autre"]}
                          </span>
                          {signature && (
                            <span className="ml-auto flex-shrink-0" style={{ color: authorColor(signature) }}>{signature}</span>
                          )}
                        </span>
                        {height > 56 && (a.clientId || a.vehicleId) && (
                          <span className="block text-[10px] truncate mt-0.5" style={{ color: T.textDim }}>
                            {a.clientId && (
                              <span className="inline-flex items-center gap-1 mr-2">
                                <Users size={9} />
                                {clientName.get(a.clientId) ?? "Client"}
                              </span>
                            )}
                            {a.vehicleId && (
                              <span className="inline-flex items-center gap-1">
                                <Car size={9} />
                                {vehicleName.get(a.vehicleId) ?? "Véhicule"}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] mt-3" style={{ color: T.muted }}>
        Cliquez sur un créneau pour planifier, sur un événement pour le modifier.
      </p>

      {draft && (
        <ApptModal
          draft={draft}
          clients={clients}
          vehicles={vehicles}
          appointments={appointments}
          onClose={() => setDraft(null)}
        />
      )}
    </AdminPage>
  );
}
