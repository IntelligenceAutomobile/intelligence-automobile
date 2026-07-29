"use client";

// Réunions : le fil de l'année, le registre des décisions et les actions ouvertes.
// Trois lectures d'un même jeu de données, choisies par les tuiles de pilotage.
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Printer, Trash2, Search, NotebookPen, Check, ChevronRight, Undo2, X } from "lucide-react";
import { authorColor } from "@/lib/planning";
import { matchesSearch } from "@/lib/vehicules";
import { formatDateFr } from "@/lib/devis";
import {
  KIND_LABEL,
  KIND_TONE,
  MEETING_KINDS,
  dayParts,
  daysBetweenKeys,
  dueSentence,
  isMeetingKind,
  isOverdue,
  meetingHaystack,
  meetingTitle,
  monthShortFr,
  monthKeyOf,
  monthLabel,
  yearOf,
  type MeetingKind,
} from "@/lib/reunions";
import { T, TONE, Tag, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle, fieldStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type MeetingItemRow = {
  id: string;
  type: string;
  content: string;
  owner: string;
  dueDate: string;
  status: string;
  doneAt: string;
};

export type MeetingRow = {
  id: string;
  date: string;
  title: string;
  kind: string;
  attendees: string[];
  location: string;
  summary: string;
  author: string;
  items: MeetingItemRow[];
};

type View = "reunions" | "decisions" | "actions";

const UNDO_MS = 8000;

/* ── Pastille d'auteur ── */
function AuthorDot({ name, size = 7 }: { name: string; size?: number }) {
  return (
    <span
      title={name}
      className="inline-block flex-shrink-0"
      style={{ width: size, height: size, borderRadius: "50%", backgroundColor: authorColor(name) }}
    />
  );
}

/* ── Anatomie commune aux trois vues ──
   Réunions, Décisions et Actions se lisent avec les mêmes repères : un
   intertitre, un rail vertical, puis des lignes ouvertes par le même médaillon
   de date. Les trois listes se parcourent ainsi du même œil. */

function DateMedallion({
  date,
  tone,
  // « weekday » quand la liste est déjà groupée par mois ; « month » sinon,
  // sans quoi un médaillon « 1 MAR » laisse ignorer de quel mois il parle.
  sub = "weekday",
}: {
  date: string;
  tone?: "warning";
  sub?: "weekday" | "month";
}) {
  const { day, weekday } = dayParts(date);
  const legend = sub === "month" ? monthShortFr(date) : weekday;
  const warn = tone === "warning";
  return (
    <div
      className="flex flex-col items-center justify-center flex-shrink-0"
      style={{
        width: 46,
        height: 46,
        backgroundColor: T.float,
        border: `1px solid ${warn ? TONE.warning.bd : T.border}`,
      }}
    >
      <span
        className="text-[17px] font-light leading-none"
        style={{ color: warn ? T.warning : T.textDim, fontVariantNumeric: "tabular-nums" }}
      >
        {day}
      </span>
      {legend && (
        <span className="text-[8px] tracking-[0.14em] uppercase mt-1" style={{ color: T.muted }}>
          {legend}
        </span>
      )}
    </div>
  );
}

function GroupHeading({ label, tone }: { label: string; tone?: "accent" | "warning" }) {
  return (
    <div
      className="text-[10px] tracking-[0.28em] uppercase mb-3"
      style={{ color: tone === "warning" ? T.warning : tone === "accent" ? T.accent : T.muted }}
    >
      {label}
    </div>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pl-4" style={{ borderLeft: `2px solid ${T.border}` }}>
      {children}
    </div>
  );
}

// Une ligne de liste : médaillon à gauche, contenu au centre, actions à droite.
// Le lien de couverture porte toute la ligne ; ce qui est cliquable par-dessus
// remonte en z-10 avec les évènements réactivés.
function TimelineRow({
  href,
  ariaLabel,
  medallion,
  children,
  trailing,
}: {
  href?: string;
  ariaLabel?: string;
  medallion: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className="group relative transition-colors duration-200 hover:bg-[rgba(107,159,238,0.06)]"
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      {href && <Link href={href} className="absolute inset-0 z-0" aria-label={ariaLabel} />}
      <div className={`flex items-center gap-4 px-4 py-3.5 ${href ? "pointer-events-none" : ""}`}>
        {medallion}
        <div className="min-w-0 flex-1">{children}</div>
        {trailing && (
          <div className="flex items-center gap-1 flex-shrink-0 relative z-10 pointer-events-auto">{trailing}</div>
        )}
      </div>
    </div>
  );
}

/* ── Tuile de pilotage : affiche un chiffre ET bascule la vue ── */
function Tile({
  label,
  value,
  hint,
  active,
  tone,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  active: boolean;
  tone?: "warning";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative px-4 py-3 text-left transition-colors duration-200"
      style={{
        backgroundColor: T.surface,
        // Le survol de adm-card imposait une bordure claire en !important, qui
        // effaçait le liseré de la tuile choisie : cette tuile s'en passe.
        border: `1px solid ${active ? T.accent : T.border}`,
      }}
    >
      <div className="adm-hairline" />
      <span className="block text-[10px] tracking-[0.14em] uppercase" style={{ color: active ? T.accent : T.muted }}>
        {label}
      </span>
      <span
        className="block text-[22px] font-light mt-1.5"
        style={{ color: tone === "warning" ? T.warning : T.text, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
      <span className="block text-[11px] mt-1" style={{ color: T.muted }}>
        {hint ?? " "}
      </span>
    </button>
  );
}

/* ── Pastille de filtre ──
   Aplat plein quand elle est active, comme dans les listes devis et stock. */
function Chip({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
      style={{
        borderColor: active ? T.accent : T.border,
        backgroundColor: active ? T.accent : "transparent",
        color: active ? T.bg : T.textDim,
      }}
    >
      {label}
      {count !== undefined && <span style={{ opacity: 0.75 }}>{count}</span>}
    </button>
  );
}

export default function ReunionsClient({
  meetings,
  today,
  canDelete,
  initialView,
  initialQuery,
  initialYear,
  initialKind,
  autoCreate = false,
}: {
  meetings: MeetingRow[];
  today: string;
  canDelete: boolean;
  initialView: View;
  initialQuery: string;
  initialYear: string;
  initialKind: string;
  autoCreate?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  // La prop serveur reste la source de vérité : elle re-sème l'état local à
  // chaque rafraîchissement, sans quoi une action cochée redeviendrait ouverte.
  const [rows, setRows] = useState(meetings);
  const [seed, setSeed] = useState(meetings);
  if (seed !== meetings) {
    setSeed(meetings);
    setRows(meetings);
  }

  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState(initialQuery);
  const [year, setYear] = useState(initialYear);
  const [kind, setKind] = useState(initialKind);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MeetingRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [undo, setUndo] = useState<{ label: string; run: () => void } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Bande « Annuler » (8 s, aussi Ctrl+Z) ── */
  const offerUndo = useCallback((label: string, run: () => void) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo({ label, run });
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
  }, []);

  const runUndo = useCallback(() => {
    if (!undo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undo.run();
    setUndo(null);
  }, [undo]);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  /* ── Création en un clic ── */
  const create = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/reunions", { method: "POST" });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      router.push(`/admin/reunions/${id}`);
    } catch {
      toast.error("La réunion n'a pas pu être créée.");
      setCreating(false);
    }
  }, [router, toast]);

  // « Nouvelle réunion » depuis la palette de commandes (Ctrl+K) arrive ici avec
  // ?nouvelle=1 : on crée puis on nettoie l'URL, sinon un retour arrière relance
  // une création.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!autoCreate || autoRan.current) return;
    autoRan.current = true;
    window.history.replaceState(null, "", "/admin/reunions");
    create();
  }, [autoCreate, create]);

  /* ── Raccourcis clavier ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing && undo) {
        e.preventDefault();
        runUndo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, runUndo]);

  /* ── Filtres reportés dans l'URL (lien partageable) ── */
  useEffect(() => {
    const p = new URLSearchParams();
    if (view !== "reunions") p.set("vue", view);
    if (query.trim()) p.set("q", query.trim());
    if (year) p.set("annee", year);
    if (kind) p.set("type", kind);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/admin/reunions?${qs}` : "/admin/reunions");
  }, [view, query, year, kind]);

  /* ── Années et types présents dans les données ── */
  const years = useMemo(() => {
    const set = new Set(rows.map((m) => yearOf(m.date)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [rows]);

  const kindCounts = useMemo(() => {
    const out = new Map<string, number>();
    for (const m of rows) {
      if (year && yearOf(m.date) !== year) continue;
      out.set(m.kind, (out.get(m.kind) ?? 0) + 1);
    }
    return out;
  }, [rows, year]);

  /* ── Réunions filtrées (vues « Réunions » et « Décisions ») ── */
  const filtered = useMemo(
    () =>
      rows.filter((m) => {
        if (year && yearOf(m.date) !== year) return false;
        if (kind && m.kind !== kind) return false;
        if (query.trim() && !matchesSearch(meetingHaystack(m), query)) return false;
        return true;
      }),
    [rows, year, kind, query],
  );

  /* ── Chiffres de pilotage ── */
  const decisionsCount = useMemo(
    () => filtered.reduce((s, m) => s + m.items.filter((i) => i.type === "decision").length, 0),
    [filtered],
  );

  // Les actions ouvertes échappent volontairement aux filtres d'année et de type :
  // une action de décembre reste à faire en janvier, et la masquer serait le
  // meilleur moyen de l'oublier.
  const openActions = useMemo(() => {
    const out: { item: MeetingItemRow; meeting: MeetingRow }[] = [];
    for (const m of rows) {
      for (const i of m.items) {
        if (i.type === "action" && i.status !== "fait") out.push({ item: i, meeting: m });
      }
    }
    return out.sort((a, b) => {
      // Les échéances d'abord, du plus urgent au plus lointain ; les actions
      // sans date ferment la marche, par réunion la plus récente.
      const da = a.item.dueDate || "9999-99-99";
      const db = b.item.dueDate || "9999-99-99";
      if (da !== db) return da < db ? -1 : 1;
      return b.meeting.date.localeCompare(a.meeting.date);
    });
  }, [rows]);

  // La recherche porte sur la ligne elle-même, plus le titre et la date de sa
  // réunion. Y inclure tout le contenu de la réunion rendait le filtre inopérant :
  // chercher « césar » remontait aussi les actions confiées à Fab, au seul motif
  // que César assistait à la même réunion.
  const visibleActions = useMemo(
    () =>
      openActions.filter(
        ({ item, meeting }) =>
          !query.trim() ||
          matchesSearch(`${item.content} ${item.owner} ${meetingTitle(meeting)} ${formatDateFr(meeting.date)}`, query),
      ),
    [openActions, query],
  );

  const lateCount = openActions.filter(({ item }) => isOverdue(item.dueDate, today)).length;

  // Regroupement par urgence, comme la section Réunions de l'atelier : les deux
  // écrans montrent la même liste, ils doivent la découper pareil.
  const actionBuckets = useMemo(() => {
    const late: typeof visibleActions = [];
    const week: typeof visibleActions = [];
    const later: typeof visibleActions = [];
    const undated: typeof visibleActions = [];

    for (const a of visibleActions) {
      if (!a.item.dueDate) undated.push(a);
      else if (isOverdue(a.item.dueDate, today)) late.push(a);
      else if (daysBetweenKeys(today, a.item.dueDate) <= 7) week.push(a);
      else later.push(a);
    }

    return [
      { key: "late", label: "En retard", tone: "warning" as const, items: late },
      { key: "week", label: "Cette semaine", tone: undefined, items: week },
      { key: "later", label: "Plus tard", tone: undefined, items: later },
      { key: "undated", label: "À planifier", tone: undefined, items: undated },
    ].filter((b) => b.items.length > 0);
  }, [visibleActions, today]);

  /* ── Groupement par mois ── */
  const byMonth = useMemo(() => {
    const map = new Map<string, MeetingRow[]>();
    for (const m of filtered) {
      const k = monthKeyOf(m.date);
      const list = map.get(k);
      if (list) list.push(m);
      else map.set(k, [m]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const decisionsByMonth = useMemo(() => {
    const map = new Map<string, { item: MeetingItemRow; meeting: MeetingRow }[]>();
    for (const m of filtered) {
      for (const i of m.items) {
        if (i.type !== "decision") continue;
        // Même raison que pour les actions : le test porte sur la décision et son
        // en-tête de réunion, jamais sur le contenu entier de la réunion.
        if (query.trim() && !matchesSearch(`${i.content} ${meetingTitle(m)} ${formatDateFr(m.date)}`, query)) continue;
        const k = monthKeyOf(m.date);
        const list = map.get(k);
        if (list) list.push({ item: i, meeting: m });
        else map.set(k, [{ item: i, meeting: m }]);
      }
    }
    return Array.from(map.entries());
  }, [filtered, query]);

  const currentMonth = today.slice(0, 7);

  /* ── Cocher une action, en optimiste ── */
  async function toggleAction(meetingId: string, item: MeetingItemRow, offer = true) {
    const next = item.status === "fait" ? "a_faire" : "fait";
    const before = { status: item.status, doneAt: item.doneAt };

    setRows((list) =>
      list.map((m) =>
        m.id !== meetingId
          ? m
          : { ...m, items: m.items.map((i) => (i.id === item.id ? { ...i, status: next, doneAt: next === "fait" ? today : "" } : i)) },
      ),
    );

    try {
      const res = await fetch(`/api/admin/reunions/${meetingId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      if (offer && next === "fait") {
        offerUndo("Action classée.", () => toggleAction(meetingId, { ...item, ...before, status: "fait" }, false));
      }
      startTransition(() => router.refresh());
    } catch {
      // Retour à l'état d'avant : l'écran ne doit jamais montrer une action
      // classée que la base ignore.
      setRows((list) =>
        list.map((m) =>
          m.id !== meetingId ? m : { ...m, items: m.items.map((i) => (i.id === item.id ? { ...i, ...before } : i)) },
        ),
      );
      toast.error("La mise à jour a échoué.");
    }
  }

  /* ── Supprimer une réunion ── */
  async function remove() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reunions/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "");
      }
      setRows((list) => list.filter((m) => m.id !== confirmDelete.id));
      setConfirmDelete(null);
      toast.success("Réunion supprimée.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La suppression a échoué.");
    } finally {
      setDeleting(false);
    }
  }

  /* ── Sous-titre vivant ── */
  const yearLabel = year || (years[0] ?? new Date().getFullYear().toString());
  const countInYear = rows.filter((m) => yearOf(m.date) === yearLabel).length;
  const subtitle = [
    `${countInYear} réunion${countInYear > 1 ? "s" : ""} en ${yearLabel}`,
    openActions.length > 0
      ? `${openActions.length} action${openActions.length > 1 ? "s" : ""} ouverte${openActions.length > 1 ? "s" : ""}${lateCount > 0 ? ` dont ${lateCount} en retard` : ""}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const empty = rows.length === 0;

  return (
    <AdminPage>
      <PageHeader
        title="Réunions"
        subtitle={subtitle}
        action={
          <button type="button" onClick={create} disabled={creating} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            {creating ? "Création…" : "Nouvelle réunion"}
          </button>
        }
      />

      {empty ? (
        <div
          className="flex flex-col items-center text-center px-6 py-16 gap-4"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        >
          <span
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, backgroundColor: "var(--adm-accent-soft)", border: "1px solid var(--adm-accent-border)", color: T.accent }}
          >
            <NotebookPen size={22} />
          </span>
          <p className="text-base" style={{ color: T.textDim }}>
            Le journal de bord de l&apos;agence commence ici.
          </p>
          <p className="text-sm max-w-md" style={{ color: T.muted }}>
            Chaque réunion garde ses décisions, ses actions à mener, et une photo de la situation du jour : stock, devis
            en attente, encours. De quoi retrouver, des mois plus tard, où vous en étiez.
          </p>
          <button type="button" onClick={create} disabled={creating} className={btnPrimaryClass + " mt-2"} style={btnPrimaryStyle}>
            <Plus size={14} />
            Créer la première réunion
          </button>
        </div>
      ) : (
        <>
          {/* Tuiles de pilotage : chiffre et bascule de vue à la fois */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <Tile
              label={year ? `Réunions ${year}` : "Réunions"}
              value={filtered.length}
              hint={year || kind || query.trim() ? "Sélection en cours" : "Toute la période"}
              active={view === "reunions"}
              onClick={() => setView("reunions")}
            />
            <Tile
              label="Décisions prises"
              value={decisionsCount}
              hint="Registre de la période"
              active={view === "decisions"}
              onClick={() => setView("decisions")}
            />
            <Tile
              label="Actions ouvertes"
              value={openActions.length}
              hint={lateCount > 0 ? `${lateCount} en retard` : "Toutes réunions confondues"}
              tone={lateCount > 0 ? "warning" : undefined}
              active={view === "actions"}
              onClick={() => setView("actions")}
            />
          </div>

          {/* Recherche et filtres, au gabarit des listes devis et stock */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
            <div className="relative sm:max-w-xs w-full">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Rechercher · touche /"
                aria-label="Rechercher une réunion, une décision, un participant"
                className="pl-11 pr-10 py-3 text-sm outline-none w-full"
                style={fieldStyle}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                  aria-label="Effacer la recherche"
                  className="adm-act absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: T.muted }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {view !== "actions" && years.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Chip label="Toutes" active={!year} onClick={() => setYear("")} />
                {years.map((y) => (
                  <Chip key={y} label={y} active={year === y} onClick={() => setYear(year === y ? "" : y)} />
                ))}
              </div>
            )}
          </div>

          {view !== "actions" && kindCounts.size > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Chip label="Tous les types" active={!kind} onClick={() => setKind("")} />
              {MEETING_KINDS.filter((k) => (kindCounts.get(k) ?? 0) > 0).map((k) => (
                <Chip
                  key={k}
                  label={KIND_LABEL[k]}
                  count={kindCounts.get(k)}
                  active={kind === k}
                  onClick={() => setKind(kind === k ? "" : k)}
                />
              ))}
            </div>
          )}

          {/* ── Vue : fil de l'année ── */}
          {view === "reunions" &&
            (byMonth.length === 0 ? (
              <EmptyResult onReset={() => { setQuery(""); setYear(""); setKind(""); }} />
            ) : (
              <div className="space-y-8">
                {byMonth.map(([mKey, list]) => (
                  <div key={mKey}>
                    <GroupHeading label={monthLabel(mKey)} tone={mKey === currentMonth ? "accent" : undefined} />
                    <Rail>
                      {list.map((m) => (
                        <MeetingLine
                          key={m.id}
                          meeting={m}
                          today={today}
                          canDelete={canDelete}
                          onDelete={() => setConfirmDelete(m)}
                        />
                      ))}
                    </Rail>
                  </div>
                ))}
              </div>
            ))}

          {/* ── Vue : registre des décisions ── */}
          {view === "decisions" &&
            (decisionsByMonth.length === 0 ? (
              <EmptyResult
                message="Le registre est vide sur cette période."
                onReset={() => { setQuery(""); setYear(""); setKind(""); }}
              />
            ) : (
              <div className="space-y-8">
                {decisionsByMonth.map(([mKey, list]) => (
                  <div key={mKey}>
                    <GroupHeading label={monthLabel(mKey)} tone={mKey === currentMonth ? "accent" : undefined} />
                    <Rail>
                      {list.map(({ item, meeting }) => (
                        <TimelineRow
                          key={item.id}
                          href={`/admin/reunions/${meeting.id}`}
                          ariaLabel={`Ouvrir ${meetingTitle(meeting)} du ${formatDateFr(meeting.date)}`}
                          medallion={<DateMedallion date={meeting.date} />}
                          trailing={<ChevronRight size={14} style={{ color: T.muted }} />}
                        >
                          <p className="text-sm" style={{ color: T.text }}>
                            {item.content}
                          </p>
                          <div className="text-[11px] mt-1 truncate" style={{ color: T.muted }}>
                            {meetingTitle(meeting)}
                          </div>
                        </TimelineRow>
                      ))}
                    </Rail>
                  </div>
                ))}
              </div>
            ))}

          {/* ── Vue : actions ouvertes ── */}
          {view === "actions" &&
            (visibleActions.length === 0 ? (
              <div
                className="flex flex-col items-center text-center px-6 py-14 gap-3"
                style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
              >
                <span
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44, backgroundColor: TONE.success.bg, border: `1px solid ${TONE.success.bd}`, color: T.success }}
                >
                  <Check size={20} />
                </span>
                <p className="text-base" style={{ color: T.textDim }}>
                  {query.trim() ? "Cette recherche laisse la liste vide." : "Tout est soldé."}
                </p>
                <p className="text-sm max-w-md" style={{ color: T.muted }}>
                  Les actions notées en réunion apparaissent ici jusqu&apos;à ce qu&apos;elles soient cochées.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {actionBuckets.map((b) => (
                  <div key={b.key}>
                    <GroupHeading label={b.label} tone={b.tone} />
                    <Rail>
                      {b.items.map(({ item, meeting }) => {
                        const late = isOverdue(item.dueDate, today);
                        return (
                          <TimelineRow
                            key={item.id}
                            href={`/admin/reunions/${meeting.id}`}
                            ariaLabel={`Ouvrir ${meetingTitle(meeting)} du ${formatDateFr(meeting.date)}`}
                            // Le médaillon porte l'échéance : c'est la date qui
                            // compte pour agir. Une action sans échéance affiche
                            // un tiret plutôt qu'une date d'emprunt.
                            medallion={<DateMedallion date={item.dueDate} tone={late ? "warning" : undefined} sub="month" />}
                            trailing={
                              <button
                                type="button"
                                onClick={() => toggleAction(meeting.id, item)}
                                title="Marquer faite"
                                aria-label={`Marquer faite : ${item.content}`}
                                className="adm-act group/tick flex items-center justify-center p-2"
                                style={{ color: T.muted }}
                              >
                                {/* La coche reste très pâle tant que l'action est
                                    ouverte : à pleine opacité, la case se lisait
                                    comme déjà faite. Elle s'affirme au survol. */}
                                <span
                                  className="flex items-center justify-center transition-opacity duration-150 opacity-25 group-hover/tick:opacity-100"
                                  style={{ width: 16, height: 16, border: `1px solid ${T.border}` }}
                                >
                                  <Check size={12} />
                                </span>
                              </button>
                            }
                          >
                            <p className="text-sm" style={{ color: T.text }}>
                              {item.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px]" style={{ color: T.muted }}>
                              {item.owner && (
                                <span className="inline-flex items-center gap-1.5">
                                  <AuthorDot name={item.owner} />
                                  {item.owner}
                                </span>
                              )}
                              {item.dueDate && (
                                <span style={{ color: late ? T.warning : T.muted }}>{dueSentence(item.dueDate, today)}</span>
                              )}
                              <span className="truncate">{meetingTitle(meeting)}</span>
                            </div>
                          </TimelineRow>
                        );
                      })}
                    </Rail>
                  </div>
                ))}
              </div>
            ))}
        </>
      )}

      {/* Bande « Annuler », décalée de la colonne de navigation en desktop */}
      {undo && (
        <div
          className="fixed left-6 lg:left-[256px] bottom-6 z-[63] flex items-center gap-4 px-4 py-3"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}
        >
          <span className="text-[12px]" style={{ color: T.textDim }}>
            {undo.label}
          </span>
          <button
            type="button"
            onClick={runUndo}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase"
            style={{ color: T.accent }}
          >
            <Undo2 size={13} />
            Annuler
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer cette réunion ?"
        description={
          confirmDelete
            ? `« ${meetingTitle(confirmDelete)} » et ses ${confirmDelete.items.length} ligne${confirmDelete.items.length > 1 ? "s" : ""} de décisions et d'actions seront définitivement effacées.`
            : undefined
        }
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
      />
    </AdminPage>
  );
}

/* ── Une réunion dans le fil ── */
function MeetingLine({
  meeting,
  today,
  canDelete,
  onDelete,
}: {
  meeting: MeetingRow;
  today: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const decisions = meeting.items.filter((i) => i.type === "decision").length;
  const actions = meeting.items.filter((i) => i.type === "action");
  const openCount = actions.filter((i) => i.status !== "fait").length;
  const lateHere = actions.some((i) => i.status !== "fait" && isOverdue(i.dueDate, today));
  const mk = isMeetingKind(meeting.kind) ? (meeting.kind as MeetingKind) : "autre";

  const parts: string[] = [];
  if (decisions > 0) parts.push(`${decisions} décision${decisions > 1 ? "s" : ""}`);
  if (actions.length > 0) {
    parts.push(
      openCount > 0
        ? `${actions.length} action${actions.length > 1 ? "s" : ""} dont ${openCount} ouverte${openCount > 1 ? "s" : ""}`
        : `${actions.length} action${actions.length > 1 ? "s" : ""} soldée${actions.length > 1 ? "s" : ""}`,
    );
  }
  const summary = parts.join(" · ");

  return (
    <TimelineRow
      href={`/admin/reunions/${meeting.id}`}
      ariaLabel={meetingTitle(meeting)}
      medallion={<DateMedallion date={meeting.date} />}
      trailing={
        <div className="adm-row-actions flex items-center gap-1">
          <Link
            href={`/admin/reunions/${meeting.id}/imprimer`}
            target="_blank"
            title="Compte rendu imprimable"
            className="adm-act p-1.5"
            style={{ color: T.muted }}
          >
            <Printer size={14} />
          </Link>
          {canDelete && (
            <button type="button" onClick={onDelete} title="Supprimer" className="adm-act-danger p-1.5" style={{ color: T.muted }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      }
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-sm truncate" style={{ color: T.text }}>
          {meetingTitle(meeting)}
        </span>
        <Tag tone={KIND_TONE[mk]}>{KIND_LABEL[mk]}</Tag>
        {/* Les prénoms s'écrivent en clair dès que la place le permet : réduits à
            des pastilles, ils restaient muets, l'infobulle ne se déclenchant pas
            sous le lien de couverture de la ligne. */}
        {meeting.attendees.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.muted }}>
            {meeting.attendees.slice(0, 3).map((a) => (
              <span key={a} className="inline-flex items-center gap-1">
                <AuthorDot name={a} />
                <span className="hidden md:inline">{a}</span>
              </span>
            ))}
            {meeting.attendees.length > 3 && <span>+{meeting.attendees.length - 3}</span>}
          </span>
        )}
      </div>
      {summary && (
        <div className="text-[11px] mt-1" style={{ color: lateHere ? T.warning : openCount > 0 ? T.textDim : T.muted }}>
          {summary}
        </div>
      )}
    </TimelineRow>
  );
}

/* ── Résultat vide (recherche ou filtre) ── */
function EmptyResult({ message, onReset }: { message?: string; onReset: () => void }) {
  return (
    <div className="px-6 py-12 text-center" style={{ border: `1px solid ${T.border}` }}>
      <p className="text-sm" style={{ color: T.textDim }}>
        {message ?? "Ces critères laissent la liste vide."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="adm-act text-[11px] tracking-widest uppercase mt-3"
        style={{ color: T.accent }}
      >
        Tout afficher
      </button>
    </div>
  );
}
