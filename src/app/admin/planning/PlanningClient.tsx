"use client";

// Planning atelier : vue semaine (lun-sam), RDV typés, indisponibilités équipe.
// Les gestes (glisser, redimensionner, tracer) reposent sur les événements pointeur
// natifs, comme l'éditeur de devis : aucune librairie de calendrier n'est installée.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Car, Users, Undo2 } from "lucide-react";
import {
  APPOINTMENT_TYPES, TYPE_LABEL, TYPE_COLOR, TYPE_DURATION, DURATIONS,
  DAY_START_MIN, DAY_END_MIN, PX_PER_HOUR, GRID_H, SNAP_MIN, FULL_DAY_MIN,
  MIN_DURATION_MIN, MAX_DURATION_MIN,
  formatMin, formatDuration, formatDayFr, snapTo, clampStart, layoutDay, dayLoadMin,
  authorColor, signatureOf, toDateKey, type AppointmentType,
} from "@/lib/planning";
import { T, AdminPage, PageHeader, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

// Carnet d'écriture. Le back-office parle à l'API ; la démonstration publique
// fournit le sien, qui écrit dans le bac à sable du visiteur. Un seul composant
// sert donc les deux, gestes compris.
export type ApptWriter = {
  create: (payload: Record<string, unknown>) => Promise<ApptRow>;
  update: (id: string, delta: Record<string, unknown>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const apiWriter: ApptWriter = {
  create: async (payload) => {
    const res = await fetch("/api/admin/rdv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    return res.json();
  },
  update: async (id, delta) => {
    const res = await fetch(`/api/admin/rdv/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(delta),
    });
    if (!res.ok) throw new Error();
  },
  remove: async (id) => {
    const res = await fetch(`/api/admin/rdv/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
  },
};

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

// Un geste ne démarre qu'au-delà de ce déplacement : en deçà, c'est un clic.
const DRAG_THRESHOLD_PX = 4;
// Tant que le mouvement reste vertical, la colonne reste verrouillée.
const COL_LOCK_PX = 14;
// En dessous de cette hauteur, les poignées mangeraient tout le corps du bloc.
const RESIZE_MIN_H = 34;
const HANDLE_H = 6;

/* Types masqués, conservés d'une semaine à l'autre. Lecture via
   useSyncExternalStore comme la préférence de vue du stock : le serveur rend
   toujours la grille complète, le client se synchronise sans effet de bord. */
const LS_FILTERS = "admin_planning_types_masques";
const NO_FILTER: string[] = [];
let filterListeners: Array<() => void> = [];
let filterCache: string[] = NO_FILTER;
let filterCacheRaw: string | null = null;

function subscribeFilters(cb: () => void) {
  filterListeners.push(cb);
  return () => {
    filterListeners = filterListeners.filter((l) => l !== cb);
  };
}

// Le cache garde une référence stable tant que la valeur stockée ne bouge pas :
// useSyncExternalStore compare les instantanés par identité.
function readFilters(): string[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(LS_FILTERS); } catch { raw = null; }
  if (raw === filterCacheRaw) return filterCache;
  filterCacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    filterCache = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : NO_FILTER;
  } catch {
    filterCache = NO_FILTER;
  }
  return filterCache;
}

function writeFilters(next: string[]) {
  try { localStorage.setItem(LS_FILTERS, JSON.stringify(next)); } catch { /* réglage d'affichage : sans conséquence */ }
  filterListeners.forEach((cb) => cb());
}

function dayLabelOf(key: string) {
  return formatDayFr(new Date(`${key}T00:00:00`)).toLowerCase();
}

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

function emptyDraft(date: string, startMin: number, durationMin: number, author: string): Draft {
  return {
    date, startMin, durationMin,
    type: "essai", title: "", person: "", author,
    clientId: "", vehicleId: "", notes: "",
  };
}

function draftFromRow(a: ApptRow): Draft {
  return {
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
  };
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

// Mémorise que l'appui a bien commencé sur le voile : une sélection de texte
// commencée dans un champ et relâchée à côté cessera de fermer la fenêtre.
const overlayDown = { current: false };

/* ── Modale création / édition ── */
function ApptModal({
  draft: initial, clients, vehicles, appointments, weekKeys, writer, onClose, onSaved, onDeleted,
}: {
  draft: Draft;
  clients: ClientLite[];
  vehicles: VehicleLite[];
  appointments: ApptRow[];
  weekKeys: string[];
  writer: ApptWriter;
  onClose: () => void;
  onSaved: (row: ApptRow, previous: ApptRow | null) => void;
  onDeleted: (row: ApptRow) => void;
}) {
  const toast = useToast();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isEdit = Boolean(initial.id);
  const signature = signatureOf(d);
  const sending = useRef(false);

  // La durée cesse de suivre le type dès que l'utilisateur la fixe lui-même, et
  // un événement déjà enregistré garde toujours la sienne.
  const durationTouched = useRef(isEdit);

  const dirty = useMemo(
    () => (Object.keys(d) as (keyof Draft)[]).some((k) => d[k] !== initial[k]),
    [d, initial],
  );

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }, [busy, dirty, onClose]);

  // Échap ferme, en laissant la main aux confirmations ouvertes par-dessus :
  // ConfirmDialog écoute lui aussi sur window, sans quoi une seule touche
  // fermerait les deux couches d'un coup.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (confirmDelete || confirmDiscard) return;
      requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDelete, confirmDiscard, requestClose]);

  // Chevauchements du même jour, jusqu'à trois, information et non blocage.
  const conflicts = useMemo(() => {
    const end = d.startMin + d.durationMin;
    return appointments
      .filter((a) => a.id !== d.id && a.date === d.date && a.startMin < end && a.startMin + a.durationMin > d.startMin)
      .slice(0, 3);
  }, [appointments, d]);

  const outOfWeek = !weekKeys.includes(d.date);
  const outOfWeekLabel = useMemo(() => {
    if (!outOfWeek) return "";
    const dt = new Date(`${d.date}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return "";
    const monday = new Date(dt);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    const isSunday = day === 0;
    const semaine = monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    return isSunday
      ? `Le dimanche reste hors de la vue semaine. Cet événement s'affichera dans l'encart « Prochains RDV » du tableau de bord.`
      : `Cet événement s'affichera sur la semaine du ${semaine}.`;
  }, [outOfWeek, d.date]);

  function setType(type: AppointmentType) {
    setD((x) => ({
      ...x,
      type,
      // « Journée » se cale sur les horaires réels plutôt que sur un bloc posé
      // n'importe où, qui déborderait du bas de la grille.
      ...(durationTouched.current
        ? {}
        : type === "indispo"
          ? { startMin: DAY_START_MIN, durationMin: FULL_DAY_MIN }
          : { durationMin: TYPE_DURATION[type] }),
    }));
  }

  function setDuration(durationMin: number) {
    durationTouched.current = true;
    setD((x) => ({
      ...x,
      durationMin,
      startMin: durationMin === FULL_DAY_MIN ? DAY_START_MIN : x.startMin,
    }));
  }

  async function save() {
    if (sending.current) return;
    if (d.type === "indispo" && !d.person.trim()) {
      toast.error("Indiquez la personne concernée par l'indisponibilité.");
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      // Édition : seuls les champs réellement modifiés partent. Sans ce tri, une
      // simple correction de titre réécrivait l'heure et les notes avec les
      // valeurs affichées à l'ouverture, écrasant le travail de l'autre.
      const payload: Record<string, unknown> = isEdit
        ? Object.fromEntries(
            (Object.keys(d) as (keyof Draft)[])
              .filter((k) => k !== "id" && k !== "author" && d[k] !== initial[k])
              .map((k) => [k, k === "clientId" || k === "vehicleId" ? (d[k] as string) || null : d[k]]),
          )
        : { ...d, clientId: d.clientId || null, vehicleId: d.vehicleId || null };

      if (isEdit && Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const previous = isEdit ? (appointments.find((a) => a.id === d.id) ?? null) : null;
      let row: ApptRow;
      if (isEdit && previous) {
        await writer.update(d.id as string, payload);
        row = { ...previous, ...(payload as Partial<ApptRow>) };
      } else {
        row = await writer.create(payload);
      }
      onSaved(row, previous);
      toast.success(isEdit ? "RDV mis à jour." : "RDV planifié.");
      onClose();
    } catch {
      toast.error("L'enregistrement a échoué.");
      setBusy(false);
      sending.current = false;
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const row = appointments.find((a) => a.id === d.id);
      await writer.remove(d.id as string);
      if (row) onDeleted(row);
      onClose();
    } catch {
      toast.error("La suppression a échoué.");
      setBusy(false);
    }
  }

  const isIndispo = d.type === "indispo";

  // La liste des débuts va au quart d'heure. Une valeur venue d'un glisser et
  // absente de la liste y est injectée, sinon le champ s'afficherait vide.
  const startOptions = useMemo(() => {
    const base: number[] = [];
    for (let m = DAY_START_MIN; m < DAY_END_MIN; m += SNAP_MIN) base.push(m);
    if (!base.includes(d.startMin)) base.push(d.startMin);
    return base.sort((a, b) => a - b);
  }, [d.startMin]);

  const durationOptions = useMemo(() => {
    const base = DURATIONS.map((o) => ({ value: o.value as number, label: o.label as string }));
    if (!base.some((o) => o.value === d.durationMin)) {
      base.push({ value: d.durationMin, label: formatDuration(d.durationMin) });
      base.sort((a, b) => a.value - b.value);
    }
    return base;
  }, [d.durationMin]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-6 py-10 overflow-y-auto"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)" }}
      // Le couple appui/relâchement évite qu'une sélection de texte commencée
      // dans un champ et relâchée à côté ferme la fenêtre.
      onMouseDown={(e) => { if (e.target === e.currentTarget) overlayDown.current = true; }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && overlayDown.current) requestClose();
        overlayDown.current = false;
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rdv-modal-titre"
    >
      <div
        className="w-full max-w-lg p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 id="rdv-modal-titre" className="text-base font-medium" style={{ color: T.text }}>
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
              onChange={(e) => setType(e.target.value as AppointmentType)}
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
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
              style={fieldStyle}
            >
              {durationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {outOfWeek && (
          <p className="flex items-start gap-2 text-[12px] mt-2" style={{ color: T.warning }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            {outOfWeekLabel}
          </p>
        )}

        {d.startMin + d.durationMin > DAY_END_MIN && (
          <p className="flex items-start gap-2 text-[12px] mt-2" style={{ color: T.warning }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            Cet événement se termine à {formatMin(d.startMin + d.durationMin)}, après la fin de journée affichée ({formatMin(DAY_END_MIN)}).
          </p>
        )}

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

        {conflicts.length > 0 && (
          <div className="mt-4 space-y-1">
            {conflicts.map((c) => (
              <p key={c.id} className="flex items-start gap-2 text-[12px]" style={{ color: T.warning }}>
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                Chevauche « {c.title || (TYPE_LABEL[c.type as AppointmentType] ?? c.type)} » à {formatMin(c.startMin)}.
              </p>
            ))}
          </div>
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
            <button type="button" onClick={requestClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
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
        <ConfirmDialog
          open={confirmDiscard}
          title="Abandonner cette saisie ?"
          description="Les informations saisies seront perdues."
          confirmLabel="Abandonner"
          busy={busy}
          onConfirm={onClose}
          onCancel={() => setConfirmDiscard(false)}
        />
      </div>
    </div>
  );
}

/* ── Geste en cours ── */
type Gesture =
  | { kind: "move"; id: string; startX: number; startY: number; origStart: number; origDuration: number; origDate: string }
  | { kind: "resize-top" | "resize-bottom"; id: string; startX: number; startY: number; origStart: number; origDuration: number }
  | { kind: "create"; date: string; anchorMin: number; startX: number; startY: number };

type Preview =
  | { kind: "move"; id: string; date: string; startMin: number }
  | { kind: "resize"; id: string; startMin: number; durationMin: number }
  | { kind: "create"; date: string; startMin: number; durationMin: number };

/* ── Page ── */
export default function PlanningClient({
  appointments, clients, vehicles, weekKeys, mondayKey, prevWeek, nextWeek, todayKey, defaultPerson,
  writer = apiWriter, base = "/admin/planning",
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
  // La démonstration fournit son propre carnet d'écriture et sa propre racine
  // d'adresses : elle se manipule pareil, sans rien envoyer au serveur.
  writer?: ApptWriter;
  base?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  // État local : la grille se met à jour avant l'aller-retour serveur. La prop
  // reste la source de vérité : quand elle change d'identité (rechargement
  // serveur, ou bac à sable de la démonstration repris depuis l'onglet), l'état
  // local se re-sème pendant le rendu.
  const [rows, setRows] = useState<ApptRow[]>(appointments);
  const [prevAppointments, setPrevAppointments] = useState(appointments);
  if (prevAppointments !== appointments) {
    setPrevAppointments(appointments);
    setRows(appointments);
  }
  const [draft, setDraft] = useState<Draft | null>(null);
  const hiddenTypes = useSyncExternalStore(subscribeFilters, readFilters, () => NO_FILTER);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [undoItem, setUndoItem] = useState<{ label: string; run: () => void } | null>(null);
  const [now, setNow] = useState<{ key: string; min: number } | null>(null);

  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gestureRef = useRef<Gesture | null>(null);
  const previewRef = useRef<Preview | null>(null);
  const draggedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { gestureRef.current = gesture; }, [gesture]);
  useEffect(() => { previewRef.current = preview; }, [preview]);

  function toggleType(t: string) {
    writeFilters(hiddenTypes.includes(t) ? hiddenTypes.filter((x) => x !== t) : [...hiddenTypes, t]);
  }

  // Un glisser commencé sur un bloc et relâché ailleurs ne déclenche de clic ni
  // sur le bloc ni sur la colonne : le drapeau resterait levé et ferait sauter
  // le clic suivant. La phase de capture le remet à zéro avant tout geste.
  useEffect(() => {
    function reset() { draggedRef.current = false; }
    window.addEventListener("pointerdown", reset, true);
    return () => window.removeEventListener("pointerdown", reset, true);
  }, []);

  /* ── Heure courante, lue côté navigateur ── */
  useEffect(() => {
    function tick() {
      const d = new Date();
      setNow({ key: toDateKey(d), min: d.getHours() * 60 + d.getMinutes() });
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── Bande « Annuler » ── */
  const showUndo = useCallback((label: string, run: () => void) => {
    setUndoItem({ label, run });
  }, []);

  useEffect(() => {
    if (!undoItem) return;
    const id = setTimeout(() => setUndoItem(null), 8000);
    return () => clearTimeout(id);
  }, [undoItem]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.key === "z" || e.key === "Z") || !(e.ctrlKey || e.metaKey)) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (draft) return;
      if (!undoItem) return;
      e.preventDefault();
      undoItem.run();
      setUndoItem(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undoItem, draft]);

  /* ── Écritures ── */

  // Applique le changement tout de suite, puis enregistre. En cas d'échec, la
  // ligne précédente reprend sa place et le message le dit.
  const patch = useCallback(async (id: string, delta: Partial<ApptRow>, previous: ApptRow) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...delta } : r)));
    try {
      await writer.update(id, delta as Record<string, unknown>);
    } catch {
      setRows((prev) => prev.map((r) => (r.id === id ? previous : r)));
      toast.error("Le déplacement a échoué.");
    }
  }, [toast, writer]);

  const restore = useCallback(async (row: ApptRow) => {
    setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
    try {
      // La ligne de suivi côté client existe déjà : la réécrire ferait doublon.
      const created = await writer.create({ ...row, silent: true });
      setRows((prev) => prev.map((r) => (r.id === row.id ? created : r)));
    } catch {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.error("Le rétablissement a échoué.");
    }
  }, [toast, writer]);

  function onSaved(row: ApptRow, previous: ApptRow | null) {
    // Ajout idempotent : le carnet d'écriture peut déjà avoir fait remonter la
    // ligne par la source (c'est le cas du bac à sable de la démonstration),
    // auquel cas l'ajouter une seconde fois la duplique.
    setRows((prev) =>
      prev.some((r) => r.id === row.id)
        ? prev.map((r) => (r.id === row.id ? row : r))
        : [...prev, row],
    );
    if (previous) {
      showUndo(`« ${previous.title || TYPE_LABEL[(previous.type as AppointmentType) ?? "autre"]} » modifié.`, () => {
        patch(previous.id, previous, row);
      });
    }
    // Aligne les données annexes (fiches client, tableau de bord) sans bloquer
    // l'affichage. Sans objet quand l'écriture reste dans le navigateur.
    if (writer === apiWriter) startTransition(() => router.refresh());
  }

  function onDeleted(row: ApptRow) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("RDV supprimé.");
    showUndo(`« ${row.title || TYPE_LABEL[(row.type as AppointmentType) ?? "autre"]} » supprimé.`, () => restore(row));
    if (writer === apiWriter) startTransition(() => router.refresh());
  }

  /* ── Ouverture de la modale ── */
  const openCreate = useCallback(
    (date: string, startMin: number, durationMin: number = TYPE_DURATION.essai) => {
      setDraft(emptyDraft(date, clampStart(startMin, durationMin), durationMin, defaultPerson));
    },
    [defaultPerson],
  );

  function openEdit(a: ApptRow) {
    setDraft(draftFromRow(a));
  }

  /* ── Gestes pointeur ── */
  const minutesFromDelta = (dy: number) => snapTo((dy / PX_PER_HOUR) * 60);

  const dayIndexAt = useCallback((clientX: number) => {
    for (let i = 0; i < dayRefs.current.length; i++) {
      const el = dayRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return i;
    }
    return -1;
  }, []);

  const endGesture = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setGesture(null);
    setPreview(null);
    gestureRef.current = null;
    previewRef.current = null;
  }, []);

  useEffect(() => {
    if (!gesture) return;

    function computePreview(clientX: number, clientY: number): Preview | null {
      const g = gestureRef.current;
      if (!g) return null;

      if (g.kind === "move") {
        const dMin = minutesFromDelta(clientY - g.startY);
        const startMin = clampStart(g.origStart + dMin, g.origDuration);
        // Colonne verrouillée tant que le mouvement reste vertical : on évite de
        // changer de jour en voulant simplement monter d'un quart d'heure.
        let date = g.origDate;
        if (Math.abs(clientX - g.startX) > COL_LOCK_PX) {
          const idx = dayIndexAt(clientX);
          if (idx >= 0) date = weekKeys[idx];
        }
        return { kind: "move", id: g.id, date, startMin };
      }

      if (g.kind === "resize-bottom") {
        const dMin = minutesFromDelta(clientY - g.startY);
        const durationMin = Math.max(
          MIN_DURATION_MIN,
          Math.min(MAX_DURATION_MIN, Math.min(DAY_END_MIN - g.origStart, g.origDuration + dMin)),
        );
        return { kind: "resize", id: g.id, startMin: g.origStart, durationMin };
      }

      if (g.kind === "resize-top") {
        const end = g.origStart + g.origDuration;
        const dMin = minutesFromDelta(clientY - g.startY);
        // Le bord haut déplace le début et conserve la fin.
        const startMin = Math.max(DAY_START_MIN, Math.min(end - MIN_DURATION_MIN, g.origStart + dMin));
        return { kind: "resize", id: g.id, startMin, durationMin: end - startMin };
      }

      if (g.kind !== "create") return null;

      // Tracé d'un créneau, y compris vers le haut.
      const dMin = minutesFromDelta(clientY - g.startY);
      const current = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, g.anchorMin + dMin));
      const startMin = Math.min(g.anchorMin, current);
      const durationMin = Math.max(MIN_DURATION_MIN, Math.abs(current - g.anchorMin));
      let date = g.date;
      if (Math.abs(clientX - g.startX) > COL_LOCK_PX) {
        const idx = dayIndexAt(clientX);
        if (idx >= 0) date = weekKeys[idx];
      }
      return { kind: "create", date, startMin: Math.min(startMin, DAY_END_MIN - durationMin), durationMin };
    }

    function onMove(e: PointerEvent) {
      const g = gestureRef.current;
      if (!g) return;
      // Relâchement manqué (fenêtre qui perd le focus, menu système) : le geste
      // se termine plutôt que de rester collé au curseur.
      if (e.buttons === 0) { onUp(); return; }
      if (!draggedRef.current) {
        const far = Math.abs(e.clientX - g.startX) > DRAG_THRESHOLD_PX || Math.abs(e.clientY - g.startY) > DRAG_THRESHOLD_PX;
        if (!far) return;
        draggedRef.current = true;
      }
      const { clientX, clientY } = e;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const next = computePreview(clientX, clientY);
        // La ref est posée dans la foulée : le relâchement peut survenir avant
        // que React ait publié l'état, et perdrait alors le dernier mouvement.
        previewRef.current = next;
        setPreview(next);
      });
    }

    function onUp() {
      const g = gestureRef.current;
      const p = previewRef.current;
      const moved = draggedRef.current;
      endGesture();

      if (!g || !moved || !p) return;

      if (p.kind === "create") {
        openCreate(p.date, p.startMin, p.durationMin);
        return;
      }

      const target = rows.find((r) => r.id === p.id);
      if (!target) return;

      const delta: Partial<ApptRow> =
        p.kind === "move"
          ? { date: p.date, startMin: p.startMin }
          : { startMin: p.startMin, durationMin: p.durationMin };

      const unchanged = (Object.keys(delta) as (keyof ApptRow)[]).every((k) => target[k] === delta[k]);
      if (unchanged) return;

      const label =
        p.kind === "move"
          ? `« ${target.title || TYPE_LABEL[(target.type as AppointmentType) ?? "autre"]} » déplacé au ${dayLabelOf(p.date)} à ${formatMin(p.startMin)}.`
          : `« ${target.title || TYPE_LABEL[(target.type as AppointmentType) ?? "autre"]} » passé à ${formatDuration(p.durationMin)}.`;

      patch(target.id, delta, target);
      showUndo(label, () => patch(target.id, { date: target.date, startMin: target.startMin, durationMin: target.durationMin }, target));
    }

    function onKey(e: KeyboardEvent) {
      // Échap annule le geste en cours et remet le bloc à sa place. draggedRef
      // reste vrai : sans quoi le relâchement qui suit ouvrirait la fenêtre,
      // alors que l'utilisateur vient justement d'annuler.
      if (e.key !== "Escape") return;
      endGesture();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [gesture, rows, weekKeys, dayIndexAt, endGesture, patch, showUndo, openCreate]);

  /* ── Données dérivées ── */
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

  const signatures = useMemo(() => {
    const found = new Set<string>();
    rows.forEach((a) => {
      const s = signatureOf(a);
      if (s) found.add(s);
    });
    return [...found].sort((a, b) => a.localeCompare(b, "fr"));
  }, [rows]);

  // Les valeurs en cours de geste priment sur les valeurs enregistrées : le bloc
  // suit le curseur avant même que le serveur soit prévenu.
  const displayed = useMemo(() => {
    if (!preview || preview.kind === "create") return rows;
    return rows.map((r) => {
      if (r.id !== preview.id) return r;
      return preview.kind === "move"
        ? { ...r, date: preview.date, startMin: preview.startMin }
        : { ...r, startMin: preview.startMin, durationMin: preview.durationMin };
    });
  }, [rows, preview]);

  const visible = useMemo(
    () => displayed.filter((a) => !hiddenTypes.includes(a.type)),
    [displayed, hiddenTypes],
  );

  const perDay = useMemo(() => {
    const m = new Map<string, { normal: ApptRow[]; indispo: ApptRow[]; layout: Map<string, { col: number; cols: number; span: number }>; count: number; loadMin: number }>();
    weekKeys.forEach((key) => {
      const all = visible.filter((a) => a.date === key);
      const indispo = all.filter((a) => a.type === "indispo");
      // Les indisponibilités restent en pleine largeur, en fond : les faire
      // participer au partage amputerait la journée entière de moitié.
      const normal = all.filter((a) => a.type !== "indispo");
      m.set(key, {
        normal,
        indispo,
        layout: layoutDay(normal),
        count: all.length,
        loadMin: dayLoadMin(all),
      });
    });
    return m;
  }, [visible, weekKeys]);

  const weekTotalMin = useMemo(
    () => weekKeys.reduce((sum, key) => sum + (perDay.get(key)?.loadMin ?? 0), 0),
    [perDay, weekKeys],
  );

  const monday = new Date(`${mondayKey}T00:00:00`);
  const weekLabel = monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const hours = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60);
  const hiddenCount = displayed.length - visible.length;

  // Le bouton d'en-tête visait toujours aujourd'hui : depuis une autre semaine,
  // le RDV créé disparaissait de l'écran aussitôt enregistré.
  const createAnchor = weekKeys.includes(todayKey) ? todayKey : mondayKey;

  // Les gestes restent à la souris et au stylet : au doigt, le navigateur fige
  // sa règle de défilement à la pose, et le bloc resterait sur place pendant que
  // la page glisse. L'appui simple continue d'ouvrir la fenêtre.
  const isCoarse = (e: React.PointerEvent) => e.pointerType === "touch";

  function startMove(e: React.PointerEvent, a: ApptRow) {
    if (e.button !== 0 || isCoarse(e)) return;
    e.stopPropagation();
    draggedRef.current = false;
    setGesture({
      kind: "move", id: a.id, startX: e.clientX, startY: e.clientY,
      origStart: a.startMin, origDuration: a.durationMin, origDate: a.date,
    });
  }

  function startResize(e: React.PointerEvent, a: ApptRow, edge: "top" | "bottom") {
    if (e.button !== 0 || isCoarse(e)) return;
    e.stopPropagation();
    e.preventDefault();
    draggedRef.current = false;
    setGesture({
      kind: edge === "top" ? "resize-top" : "resize-bottom",
      id: a.id, startX: e.clientX, startY: e.clientY, origStart: a.startMin, origDuration: a.durationMin,
    });
  }

  function slotAt(el: HTMLElement, clientY: number) {
    const rect = el.getBoundingClientRect();
    const raw = DAY_START_MIN + ((clientY - rect.top) / PX_PER_HOUR) * 60;
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, snapTo(raw)));
  }

  function startCreate(e: React.PointerEvent<HTMLDivElement>, date: string) {
    if (e.button !== 0 || isCoarse(e)) return;
    if (e.target !== e.currentTarget) return;
    draggedRef.current = false;
    setGesture({ kind: "create", date, anchorMin: slotAt(e.currentTarget, e.clientY), startX: e.clientX, startY: e.clientY });
  }

  // Appui simple sur une zone vide : la fenêtre s'ouvre au créneau visé. Un
  // tracé vient d'être traité par le geste, ce clic-là se saute.
  function clickEmptySlot(e: React.MouseEvent<HTMLDivElement>, date: string) {
    const wasDragging = draggedRef.current;
    draggedRef.current = false;
    if (wasDragging || e.target !== e.currentTarget) return;
    openCreate(date, slotAt(e.currentTarget, e.clientY));
  }

  function clickBlock(e: React.MouseEvent, a: ApptRow) {
    e.stopPropagation();
    const wasDragging = draggedRef.current;
    draggedRef.current = false;
    if (wasDragging) return;
    openEdit(a);
  }

  return (
    <AdminPage>
      <PageHeader
        title="Planning atelier"
        subtitle={
          `Semaine du ${weekLabel} · ${visible.length} événement${visible.length > 1 ? "s" : ""} · ${formatDuration(weekTotalMin)} au planning` +
          (hiddenCount > 0 ? ` · ${hiddenCount} masqué${hiddenCount > 1 ? "s" : ""} par les filtres` : "")
        }
        action={
          <div className="flex items-center gap-3">
            <div className="flex" style={{ border: `1px solid ${T.border}` }}>
              <Link href={`${base}?semaine=${prevWeek}`} className="p-2.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Semaine précédente">
                <ChevronLeft size={15} />
              </Link>
              <Link
                href={base}
                className="px-3 py-2.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.textDim, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}
              >
                Aujourd&apos;hui
              </Link>
              <Link href={`${base}?semaine=${nextWeek}`} className="p-2.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Semaine suivante">
                <ChevronRight size={15} />
              </Link>
            </div>
            <button type="button" onClick={() => openCreate(createAnchor, 9 * 60)} className={btnPrimaryClass} style={btnPrimaryStyle}>
              <Plus size={14} />
              Événement
            </button>
          </div>
        }
      />

      {/* Légende — carré : le type, cliquable pour l'éteindre. Rond : qui l'a créé. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
        {APPOINTMENT_TYPES.map((t) => {
          const off = hiddenTypes.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              title={off ? `Afficher ${TYPE_LABEL[t]}` : `Masquer ${TYPE_LABEL[t]}`}
              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase transition-opacity"
              style={{ color: off ? T.border : T.muted, opacity: off ? 0.75 : 1 }}
            >
              <span
                style={{
                  width: 9, height: 9, flexShrink: 0,
                  backgroundColor: off ? "transparent" : TYPE_COLOR[t].bd,
                  border: `1px solid ${TYPE_COLOR[t].bd}`,
                }}
              />
              {TYPE_LABEL[t]}
            </button>
          );
        })}
        {hiddenTypes.length > 0 && (
          <button
            type="button"
            onClick={() => writeFilters([])}
            className="text-[10px] tracking-[0.14em] uppercase"
            style={{ color: T.accent }}
          >
            Tout afficher
          </button>
        )}
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
        <div className="min-w-[940px]">
          {/* En-têtes des jours */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(6, 1fr)` }}>
            <div style={{ borderBottom: `1px solid ${T.border}` }} />
            {weekKeys.map((key) => {
              const d = new Date(`${key}T00:00:00`);
              const isToday = key === (now?.key ?? todayKey);
              const info = perDay.get(key);
              const load = info ? info.loadMin : 0;
              const ratio = Math.min(1, load / (DAY_END_MIN - DAY_START_MIN));
              return (
                <div
                  key={key}
                  className="px-3 pt-2.5 pb-0"
                  style={{
                    color: isToday ? T.accent : T.textDim,
                    fontWeight: isToday ? 600 : 400,
                    borderBottom: `1px solid ${T.border}`,
                    borderLeft: `1px solid ${T.border}`,
                    backgroundColor: isToday ? "rgba(107,159,238,0.06)" : T.surfaceAlt,
                  }}
                >
                  <div className="text-[11px] tracking-[0.14em] uppercase">{formatDayFr(d)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                    {info && info.count > 0
                      ? `${info.count} RDV · ${formatDuration(load)}`
                      : "Libre"}
                  </div>
                  {/* Barre de charge : la part de la journée déjà occupée. */}
                  <div style={{ height: 2, backgroundColor: T.border, marginTop: 6 }}>
                    <div
                      style={{
                        height: 2,
                        width: `${ratio * 100}%`,
                        backgroundColor: ratio > 0.8 ? T.warning : T.accent,
                      }}
                    />
                  </div>
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
              {now && weekKeys.includes(now.key) && now.min >= DAY_START_MIN && now.min <= DAY_END_MIN && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    right: 2,
                    top: ((now.min - DAY_START_MIN) / 60) * PX_PER_HOUR - 3.5,
                    width: 7, height: 7, borderRadius: "50%",
                    backgroundColor: T.danger,
                  }}
                />
              )}
            </div>

            {weekKeys.map((key, dayIndex) => {
              const isToday = key === (now?.key ?? todayKey);
              const info = perDay.get(key);
              const nowVisible = now && now.min >= DAY_START_MIN && now.min <= DAY_END_MIN;
              const nowTop = now ? ((now.min - DAY_START_MIN) / 60) * PX_PER_HOUR : 0;
              const isPastDay = now ? key < now.key : false;
              const createPreview = preview?.kind === "create" && preview.date === key ? preview : null;

              return (
                <div
                  key={key}
                  ref={(el) => { dayRefs.current[dayIndex] = el; }}
                  className="relative"
                  style={{
                    height: GRID_H,
                    borderLeft: `1px solid ${T.border}`,
                    backgroundColor: isToday ? "rgba(107,159,238,0.04)" : "transparent",
                    cursor: gesture ? "grabbing" : "crosshair",
                  }}
                  onPointerDown={(e) => startCreate(e, key)}
                  onClick={(e) => clickEmptySlot(e, key)}
                >
                  {/* Voile du passé : ce qui reste à faire ressort. */}
                  {(isPastDay || (isToday && nowVisible)) && (
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 pointer-events-none"
                      style={{ height: isPastDay ? GRID_H : nowTop, backgroundColor: "rgba(4,11,22,0.32)" }}
                    />
                  )}

                  {hours.slice(1).map((h) => (
                    <div
                      key={h}
                      aria-hidden
                      className="absolute inset-x-0 pointer-events-none"
                      style={{ top: ((h - DAY_START_MIN) / 60) * PX_PER_HOUR, height: 1, backgroundColor: T.border, opacity: 0.45 }}
                    />
                  ))}

                  {/* Indisponibilités : couche de fond pleine largeur, cliquable
                      seulement sur sa poignée, pour que le jour reste planifiable. */}
                  {info?.indispo.map((a) => {
                    const c = TYPE_COLOR.indispo;
                    const top = ((a.startMin - DAY_START_MIN) / 60) * PX_PER_HOUR;
                    const height = Math.max(18, Math.min(GRID_H - top, (a.durationMin / 60) * PX_PER_HOUR - 2));
                    return (
                      <div
                        key={a.id}
                        className="absolute inset-x-0 pointer-events-none"
                        style={{
                          top, height,
                          backgroundColor: c.bg,
                          borderLeft: `2px solid ${c.bd}`,
                          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(124,146,181,0.12) 5px, rgba(124,146,181,0.12) 7px)",
                        }}
                      >
                        <button
                          type="button"
                          className="pointer-events-auto text-left px-2 py-1 max-w-full truncate"
                          title={tooltipOf(a, clientName, vehicleName)}
                          onClick={(e) => clickBlock(e, a)}
                          onPointerDown={(e) => startMove(e, a)}
                          style={{ color: c.fg, fontSize: 11, cursor: "grab" }}
                        >
                          {a.person ? `${a.person} — ` : ""}{a.title || TYPE_LABEL.indispo}
                        </button>
                      </div>
                    );
                  })}

                  {/* Fantôme de création */}
                  {createPreview && (
                    <div
                      aria-hidden
                      className="absolute inset-x-1 pointer-events-none flex items-start justify-between px-2 py-0.5"
                      style={{
                        top: ((createPreview.startMin - DAY_START_MIN) / 60) * PX_PER_HOUR,
                        height: Math.max(14, (createPreview.durationMin / 60) * PX_PER_HOUR),
                        backgroundColor: "rgba(107,159,238,0.10)",
                        border: `1px dashed ${T.accent}`,
                        zIndex: 4,
                      }}
                    >
                      <span className="text-[10px]" style={{ color: T.accent }}>
                        {formatMin(createPreview.startMin)} – {formatMin(createPreview.startMin + createPreview.durationMin)}
                      </span>
                      <span className="text-[10px]" style={{ color: T.accent }}>{formatDuration(createPreview.durationMin)}</span>
                    </div>
                  )}

                  {info?.normal.map((a) => {
                    const type = (a.type as AppointmentType) ?? "autre";
                    const c = TYPE_COLOR[type] ?? TYPE_COLOR.autre;
                    const lay = info.layout.get(a.id) ?? { col: 0, cols: 1, span: 1 };
                    const top = ((a.startMin - DAY_START_MIN) / 60) * PX_PER_HOUR;
                    // Hauteur bornée à la place restante : un bloc qui déborde
                    // sortait du cadre et recouvrait l'en-tête du jour voisin.
                    const height = Math.max(18, Math.min(GRID_H - top, (a.durationMin / 60) * PX_PER_HOUR - 2));
                    const signature = signatureOf(a);
                    const dragging = preview && preview.kind !== "create" && preview.id === a.id;
                    const done = Boolean(now && key < now.key) || Boolean(now && key === now.key && a.startMin + a.durationMin <= now.min);
                    const showHandles = height >= RESIZE_MIN_H;
                    const wide = lay.cols === 1;

                    return (
                      <div
                        key={a.id}
                        // Au survol, un bloc rétréci par le partage de largeur
                        // reprend toute la colonne : on lit un titre coupé sans
                        // rien ouvrir. Mutation directe du style, comme ailleurs
                        // dans le back-office, pour éviter un rendu par survol.
                        onMouseEnter={(e) => {
                          if (lay.cols === 1 || gestureRef.current) return;
                          e.currentTarget.style.left = "4px";
                          e.currentTarget.style.width = "calc(100% - 8px)";
                          e.currentTarget.style.zIndex = "25";
                        }}
                        onMouseLeave={(e) => {
                          if (lay.cols === 1) return;
                          e.currentTarget.style.left = `calc(${(lay.col / lay.cols) * 100}% + 4px)`;
                          e.currentTarget.style.width = `calc(${(lay.span / lay.cols) * 100}% - 8px)`;
                          e.currentTarget.style.zIndex = "5";
                        }}
                        style={{
                          position: "absolute",
                          top,
                          height,
                          left: `calc(${(lay.col / lay.cols) * 100}% + 4px)`,
                          width: `calc(${(lay.span / lay.cols) * 100}% - 8px)`,
                          zIndex: dragging ? 30 : 5,
                          opacity: done && !dragging ? 0.55 : 1,
                          boxShadow: dragging ? "0 8px 24px rgba(4,11,22,0.55)" : undefined,
                        }}
                      >
                        <button
                          type="button"
                          title={tooltipOf(a, clientName, vehicleName)}
                          onClick={(e) => clickBlock(e, a)}
                          onPointerDown={(e) => startMove(e, a)}
                          className="w-full h-full text-left px-2 py-1 overflow-hidden"
                          style={{
                            backgroundColor: c.bg,
                            borderLeft: `2px solid ${c.bd}`,
                            cursor: dragging ? "grabbing" : "grab",
                            // Un <button> centre son contenu verticalement : sur un
                            // bloc de deux heures, le titre se retrouvait au milieu.
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            justifyContent: "flex-start",
                          }}
                        >
                          {height < 30 ? (
                            <span className="flex items-center gap-1.5">
                              {signature && <AuthorDot name={signature} size={6} />}
                              <span className="text-[10px] truncate min-w-0" style={{ color: c.fg }}>
                                {formatMin(a.startMin)} · {a.title || TYPE_LABEL[type]}
                              </span>
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5">
                                {signature && <AuthorDot name={signature} size={6} />}
                                <span className="text-[11px] font-medium truncate min-w-0" style={{ color: c.fg }}>
                                  {a.title || TYPE_LABEL[type]}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 text-[10px]" style={{ color: T.muted }}>
                                <span className="truncate min-w-0">
                                  {formatMin(a.startMin)} · {dragging ? formatDuration(a.durationMin) : TYPE_LABEL[type]}
                                </span>
                                {signature && wide && (
                                  <span className="ml-auto flex-shrink-0" style={{ color: authorColor(signature) }}>{signature}</span>
                                )}
                              </span>
                              {height > 62 && wide && (a.clientId || a.vehicleId) && (
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
                            </>
                          )}
                        </button>

                        {/* Poignées de durée, révélées au survol du bloc. */}
                        {showHandles && (
                          <>
                            <span
                              role="presentation"
                              onPointerDown={(e) => startResize(e, a, "top")}
                              className="absolute inset-x-0 top-0 opacity-0 hover:opacity-100"
                              style={{ height: HANDLE_H, cursor: "ns-resize" }}
                            >
                              <span style={{ display: "block", margin: "2px auto 0", width: 24, height: 2, backgroundColor: c.bd }} />
                            </span>
                            <span
                              role="presentation"
                              onPointerDown={(e) => startResize(e, a, "bottom")}
                              className="absolute inset-x-0 bottom-0 opacity-0 hover:opacity-100"
                              style={{ height: HANDLE_H, cursor: "ns-resize" }}
                            >
                              <span style={{ display: "block", margin: "2px auto 0", width: 24, height: 2, backgroundColor: c.bd }} />
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Trait de l'heure courante, au-dessus des blocs. */}
                  {isToday && nowVisible && (
                    <div
                      aria-hidden
                      className="absolute inset-x-0 pointer-events-none"
                      style={{ top: nowTop, height: 1, backgroundColor: T.danger, zIndex: 40 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] mt-3" style={{ color: T.muted }}>
        Glissez un bloc pour le déplacer, ses bords pour changer la durée. Tracez sur une zone vide pour planifier.
      </p>

      {/* Bande « Annuler » */}
      {undoItem && (
        <div
          // Décalée de la largeur de la barre latérale sur grand écran, pour
          // cesser de recouvrir le bloc identité en bas à gauche.
          className="fixed bottom-6 left-6 lg:left-[256px] z-[65] flex items-center gap-4 px-4 py-3"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}
        >
          <span className="text-[12px]" style={{ color: T.textDim }}>{undoItem.label}</span>
          <button
            type="button"
            onClick={() => { undoItem.run(); setUndoItem(null); }}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase"
            style={{ color: T.accent }}
          >
            <Undo2 size={13} />
            Annuler
          </button>
        </div>
      )}

      {draft && (
        <ApptModal
          draft={draft}
          clients={clients}
          vehicles={vehicles}
          appointments={rows}
          weekKeys={weekKeys}
          writer={writer}
          onClose={() => setDraft(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </AdminPage>
  );
}

// Infobulle complète : le titre coupé, l'horaire, la personne, le client, le
// véhicule et les notes, qui ne s'affichaient nulle part sur la grille.
function tooltipOf(a: ApptRow, clientName: Map<string, string>, vehicleName: Map<string, string>): string {
  const type = TYPE_LABEL[(a.type as AppointmentType) ?? "autre"];
  const lines = [
    `${formatMin(a.startMin)} → ${formatMin(a.startMin + a.durationMin)} · ${type}`,
    a.title || type,
  ];
  if (a.person) lines.push(`Personne : ${a.person}`);
  if (a.clientId) lines.push(`Client : ${clientName.get(a.clientId) ?? "—"}`);
  if (a.vehicleId) lines.push(`Véhicule : ${vehicleName.get(a.vehicleId) ?? "—"}`);
  if (a.notes) lines.push(a.notes);
  return lines.join("\n");
}
