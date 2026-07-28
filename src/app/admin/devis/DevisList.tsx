"use client";

// Liste des devis : chiffres de pilotage, recherche, filtres, tri par colonne et
// actions directes sur la ligne. Même grammaire que la liste du stock, y compris
// l'écriture appliquée avant l'aller-retour serveur et la bande « Annuler ».
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, X, Check, ChevronUp, ChevronDown, Printer, Pencil, Copy, Trash2,
  Send, FileText, Undo2, Loader2,
} from "lucide-react";
import {
  QUOTE_STATUSES, STATUS_LABEL, formatEuro, formatDateFr, type QuoteStatus,
} from "@/lib/devis";
import { matchesSearch, formatDays } from "@/lib/vehicules";
import { T, TONE, fieldStyle, btnPrimaryClass, btnPrimaryStyle, type Tone } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type DevisRow = {
  id: string;
  number: string;
  client: string;
  vehicle: string;
  issueDate: string;
  status: string;
  statusLabel: string;
  total: number;
  deposit: number;
  lineCount: number;
  ageDays: number;
  daysLeft: number | null;
  expired: boolean;
  factureNumber: string | null;
  relanceDue: boolean;
  relanceCount: number;
  sentAt: string;
  // Jours écoulés depuis la première ouverture du lien par le client, ou null.
  viewedDays: number | null;
  viewCount: number;
  signerName: string;
  hasEmail: boolean;
  updatedAt: string;
};

const STATUS_TONE: Record<QuoteStatus, Tone> = {
  brouillon: "muted",
  envoye: "accent",
  accepte: "success",
  refuse: "danger",
};

// Ordre du cycle commercial, pour trier une colonne de statuts.
const STATUS_ORDER: Record<string, number> = { brouillon: 0, envoye: 1, accepte: 2, refuse: 3 };

const FILTERS = [
  { value: "all", label: "Tous" },
  { value: "brouillon", label: "Brouillons" },
  { value: "envoye", label: "Envoyés" },
  { value: "a-relancer", label: "À relancer" },
  { value: "expire", label: "Expirés" },
  { value: "accepte", label: "Acceptés" },
  { value: "refuse", label: "Refusés" },
] as const;

type SortKey = "recent" | "numero" | "client" | "date" | "montant" | "statut" | "validite";

const PAGE = 60;
// Seuil d'alerte : un devis qui expire dans la semaine mérite un coup de fil.
const SOON_DAYS = 7;

function statusOf(d: DevisRow): QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(d.status) ? (d.status as QuoteStatus) : "brouillon";
}

function searchableText(d: DevisRow): string {
  return [d.number, d.client, d.vehicle, d.statusLabel, d.factureNumber ?? ""].filter(Boolean).join(" ");
}

// Ce qu'il faut savoir d'un devis d'un coup d'œil, dans l'ordre d'urgence.
function trackOf(d: DevisRow): { text: string; tone: "muted" | "warning" | "danger" | "accent" } {
  if (d.expired) return { text: `Expiré depuis ${formatDays(-(d.daysLeft ?? 0))}`, tone: "danger" };
  if (d.status === "envoye" && d.daysLeft !== null && d.daysLeft <= SOON_DAYS) {
    return { text: d.daysLeft === 0 ? "Expire aujourd'hui" : `Expire dans ${formatDays(d.daysLeft)}`, tone: "warning" };
  }
  if (d.signerName) return { text: `Signé par ${d.signerName}`, tone: "accent" };
  if (d.relanceDue) return { text: `Relance due · ${formatDays(d.ageDays)} sans réponse`, tone: "warning" };
  if (d.viewedDays !== null) return { text: `Ouvert il y a ${formatDays(d.viewedDays)}`, tone: "accent" };
  if (d.sentAt && d.status === "envoye") return { text: "Envoyé, en attente de lecture", tone: "muted" };
  if (d.factureNumber) return { text: `Facturé · ${d.factureNumber}`, tone: "accent" };
  if (d.status === "envoye") return { text: `Envoyé il y a ${formatDays(d.ageDays)}`, tone: "muted" };
  if (d.status === "brouillon" && !d.client) return { text: "Client à renseigner", tone: "muted" };
  return { text: "", tone: "muted" };
}

const TRACK_COLOR = { muted: T.muted, warning: T.warning, danger: T.danger, accent: T.accent } as const;

/* ── Menu de statut ── */
function StatusMenu({ current, onPick, onClose }: {
  current: QuoteStatus;
  onPick: (s: QuoteStatus) => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function onDown(e: PointerEvent) {
      if (boxRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={boxRef}
      className="absolute right-0 top-full mt-1 z-[62]"
      style={{ width: 164, backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}
    >
      {QUOTE_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPick(s); }}
          disabled={s === current}
          className="w-full flex items-center gap-2.5 px-3 text-left text-[13px] transition-colors hover:bg-[rgba(107,159,238,0.10)] disabled:opacity-100"
          style={{ height: 34, color: s === current ? T.muted : T.textDim }}
        >
          <span style={{ width: 8, height: 8, flexShrink: 0, backgroundColor: TONE[STATUS_TONE[s]].fg }} />
          <span className="flex-1">{STATUS_LABEL[s]}</span>
          {s === current && <Check size={12} />}
        </button>
      ))}
    </div>
  );
}

/* ── En-tête de colonne triable ── */
function SortHead({ label, k, dir, sort, onSort, className = "" }: {
  label: string;
  k: SortKey;
  dir: "asc" | "desc";
  sort: string;
  onSort: (k: SortKey, dir: "asc" | "desc") => void;
  className?: string;
}) {
  const active = sort.startsWith(`${k}-`);
  const asc = sort === `${k}-asc`;
  return (
    <button
      type="button"
      onClick={() => onSort(k, dir)}
      className={`adm-act items-center gap-1 text-[10px] tracking-[0.14em] uppercase transition-colors ${className}`}
      style={{ color: active ? T.accent : T.muted }}
    >
      {label}
      {active && (asc ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
    </button>
  );
}

/* ── Écran ── */
export default function DevisList({
  devis,
  canDelete,
  initialFilter = "all",
  initialQuery = "",
  initialSort = "recent",
  readOnly = false,
  basePath = "/admin/devis",
}: {
  devis: DevisRow[];
  canDelete: boolean;
  initialFilter?: string;
  initialQuery?: string;
  initialSort?: string;
  // La démonstration publique affiche le même écran, sans jamais rien écrire.
  readOnly?: boolean;
  basePath?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<DevisRow[]>(devis);
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState(initialSort);
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [busyRows, setBusyRows] = useState<Set<string>>(new Set());
  const [undoItem, setUndoItem] = useState<{ label: string; run: () => void } | null>(null);
  const [confirmOne, setConfirmOne] = useState<DevisRow | null>(null);
  const [shown, setShown] = useState(PAGE);
  const searchRef = useRef<HTMLInputElement>(null);

  // La prop reste la source de vérité : après un rechargement serveur, l'état
  // local se re-sème, sinon une suppression resterait affichée.
  const [prevDevis, setPrevDevis] = useState(devis);
  if (prevDevis !== devis) {
    setPrevDevis(devis);
    setRows(devis);
  }

  const showUndo = useCallback((label: string, run: () => void) => setUndoItem({ label, run }), []);
  useEffect(() => {
    if (!undoItem) return;
    const id = setTimeout(() => setUndoItem(null), 8000);
    return () => clearTimeout(id);
  }, [undoItem]);

  /* ── Raccourcis ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const inField = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.tagName === "SELECT" || el?.isContentEditable;
      if (e.key === "/" && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape" && el === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
        return;
      }
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && !inField && undoItem) {
        e.preventDefault();
        undoItem.run();
        setUndoItem(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undoItem]);

  // Une seule porte pour toutes les écritures : la démonstration la referme.
  const blocked = useCallback(() => {
    if (!readOnly) return false;
    toast.info("Démonstration : les actions ne sont pas enregistrées.");
    return true;
  }, [readOnly, toast]);

  const setBusy = useCallback((id: string, on: boolean) => {
    setBusyRows((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  /* ── Écritures ── */
  // Le statut part seul, par PATCH : le PUT reconstruit tout le devis et
  // effacerait les lignes.
  const patchStatus = useCallback(async (d: DevisRow, status: QuoteStatus) => {
    const before = d.status;
    setRows((prev) => prev.map((r) => (r.id === d.id ? { ...r, status, statusLabel: STATUS_LABEL[status], expired: status === "envoye" && r.daysLeft !== null && r.daysLeft < 0 } : r)));
    setBusy(d.id, true);
    try {
      const res = await fetch(`/api/admin/devis/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setRows((prev) => prev.map((r) => (r.id === d.id ? { ...r, status: before, statusLabel: STATUS_LABEL[before as QuoteStatus] ?? before } : r)));
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusy(d.id, false);
    }
  }, [router, setBusy, toast]);

  function changeStatus(d: DevisRow, status: QuoteStatus) {
    setStatusMenu(null);
    if (blocked() || d.status === status) return;
    patchStatus(d, status);
    showUndo(
      `Devis ${d.number} passé en « ${STATUS_LABEL[status].toLowerCase()} ».`,
      () => patchStatus({ ...d, status }, statusOf(d)),
    );
  }

  async function duplicate(d: DevisRow) {
    if (blocked() || busyRows.has(d.id)) return;
    setBusy(d.id, true);
    try {
      const res = await fetch(`/api/admin/devis/${d.id}/dupliquer`, { method: "POST" });
      if (!res.ok) throw new Error();
      const created: { id: string; number: string } = await res.json();
      toast.success(`Copie ${created.number} créée. Ouvrez-la pour la compléter.`);
      router.push(`/admin/devis/${created.id}`);
    } catch {
      toast.error("La duplication a échoué.");
    } finally {
      setBusy(d.id, false);
    }
  }

  async function relancer(d: DevisRow) {
    if (blocked() || busyRows.has(d.id)) return;
    setBusy(d.id, true);
    try {
      const res = await fetch(`/api/admin/relances/${d.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "relance" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(j.sent ? `Relance envoyée pour le devis ${d.number}.` : `Relance enregistrée pour le devis ${d.number}.`);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La relance a échoué.");
    } finally {
      setBusy(d.id, false);
    }
  }

  async function remove(d: DevisRow) {
    setConfirmOne(null);
    if (blocked()) return;
    setRows((prev) => prev.filter((r) => r.id !== d.id));
    try {
      const res = await fetch(`/api/admin/devis/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`Devis ${d.number} supprimé.`);
      startTransition(() => router.refresh());
    } catch {
      setRows((prev) => (prev.some((r) => r.id === d.id) ? prev : [...prev, d]));
      toast.error("La suppression a échoué.");
    }
  }

  /* ── Filtrage et tri ── */
  const filtered = useMemo(() => {
    let list = rows.filter((d) => {
      if (filter === "expire" && !d.expired) return false;
      if (filter === "a-relancer" && !d.relanceDue) return false;
      if (filter !== "all" && filter !== "expire" && filter !== "a-relancer" && d.status !== filter) return false;
      return matchesSearch(searchableText(d), query);
    });

    const [key, dir] = sort.split("-") as [SortKey, "asc" | "desc" | undefined];
    const sign = dir === "asc" ? 1 : -1;
    const by: Record<string, (a: DevisRow, b: DevisRow) => number> = {
      numero: (a, b) => a.number.localeCompare(b.number, "fr", { numeric: true }),
      client: (a, b) => (a.client || "zzz").localeCompare(b.client || "zzz", "fr"),
      date: (a, b) => a.issueDate.localeCompare(b.issueDate),
      montant: (a, b) => a.total - b.total,
      statut: (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
      validite: (a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity),
    };
    if (by[key]) list = [...list].sort((a, b) => by[key](a, b) * sign);
    return list;
  }, [rows, query, filter, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, brouillon: 0, envoye: 0, accepte: 0, refuse: 0, expire: 0, "a-relancer": 0 };
    rows.forEach((d) => {
      c[d.status] = (c[d.status] ?? 0) + 1;
      if (d.expired) c.expire++;
      if (d.relanceDue) c["a-relancer"]++;
    });
    return c;
  }, [rows]);

  // Trois chiffres de pilotage, calculés sur l'ensemble et non sur la vue filtrée.
  const pilot = useMemo(() => {
    const attente = rows.filter((d) => d.status === "envoye");
    const mois = new Date().toISOString().slice(0, 7);
    const acceptesMois = rows.filter((d) => d.status === "accepte" && d.issueDate.startsWith(mois));
    const decides = rows.filter((d) => (d.status === "accepte" || d.status === "refuse") && d.ageDays <= 90);
    const gagnes = decides.filter((d) => d.status === "accepte").length;
    return {
      attente: attente.reduce((s, d) => s + d.total, 0),
      attenteCount: attente.length,
      acceptesMois: acceptesMois.reduce((s, d) => s + d.total, 0),
      taux: decides.length > 0 ? Math.round((gagnes / decides.length) * 100) : null,
      tauxBase: decides.length,
    };
  }, [rows]);

  /* ── Report des réglages dans l'adresse ── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("statut", filter);
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "recent") params.set("tri", sort);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filter, query, sort]);

  // Changer de filtre, de recherche ou de tri fait repartir la pagination du haut.
  const criteria = `${filter}|${query}|${sort}`;
  const [prevCriteria, setPrevCriteria] = useState(criteria);
  if (prevCriteria !== criteria) {
    setPrevCriteria(criteria);
    setShown(PAGE);
  }

  function sortByColumn(key: SortKey, defaultDir: "asc" | "desc") {
    const current = sort.split("-")[0];
    const dir = sort.split("-")[1];
    if (current !== key) setSort(`${key}-${defaultDir}`);
    else if (dir === defaultDir) setSort(`${key}-${defaultDir === "asc" ? "desc" : "asc"}`);
    else setSort("recent");
  }

  const visible = filtered.slice(0, shown);
  const tileStyle = (on: boolean) => ({ backgroundColor: T.surface, border: `1px solid ${on ? T.accent : T.border}` });

  return (
    <div>
      {/* Trois chiffres de pilotage */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setFilter(filter === "envoye" ? "all" : "envoye")}
          aria-pressed={filter === "envoye"}
          className="px-4 py-3 text-left transition-colors"
          style={tileStyle(filter === "envoye")}
        >
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>En attente de réponse</div>
          <div className="text-[19px] sm:text-[24px] mt-1 whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {formatEuro(pilot.attente)}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>
            {pilot.attenteCount} devis envoyé{pilot.attenteCount > 1 ? "s" : ""}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setFilter(filter === "accepte" ? "all" : "accepte")}
          aria-pressed={filter === "accepte"}
          className="px-4 py-3 text-left transition-colors"
          style={tileStyle(filter === "accepte")}
        >
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Accepté ce mois</div>
          <div className="text-[19px] sm:text-[24px] mt-1 whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {formatEuro(pilot.acceptesMois)}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>{counts.accepte} devis accepté{counts.accepte > 1 ? "s" : ""} au total</div>
        </button>
        <div className="px-4 py-3 col-span-2 lg:col-span-1" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Taux d&apos;acceptation · 90 jours</div>
          <div className="text-[19px] sm:text-[24px] mt-1 whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {pilot.taux === null ? "—" : `${pilot.taux} %`}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>
            {pilot.tauxBase > 0 ? `sur ${pilot.tauxBase} devis décidé${pilot.tauxBase > 1 ? "s" : ""}` : "en attente d'un premier devis décidé"}
          </div>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <div className="relative sm:max-w-xs w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher · touche /"
            aria-label="Rechercher un devis"
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
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const n = counts[f.value] ?? 0;
            if (f.value !== "all" && n === 0) return null;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
                style={{
                  borderColor: active ? T.accent : T.border,
                  color: active ? T.bg : T.textDim,
                  backgroundColor: active ? T.accent : "transparent",
                }}
              >
                {f.label}
                <span style={{ opacity: 0.75 }}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState total={rows.length} query={query} filter={filter} basePath={basePath} onReset={() => { setFilter("all"); setQuery(""); }} />
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          {/* En-têtes triables */}
          <div
            className="hidden @[640px]:grid items-center px-4 py-2 gap-x-3
                       grid-cols-[86px_minmax(120px,1fr)_112px_104px_92px]
                       @[920px]:grid-cols-[92px_minmax(150px,1fr)_78px_minmax(120px,168px)_120px_104px_124px]"
            style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}
          >
            <SortHead label="N°" k="numero" dir="desc" className="flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Client" k="client" dir="asc" className="flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Émis" k="date" dir="desc" className="justify-end hidden @[920px]:flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Suivi" k="validite" dir="asc" className="hidden @[920px]:flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Montant" k="montant" dir="desc" className="justify-end flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Statut" k="statut" dir="asc" className="flex" sort={sort} onSort={sortByColumn} />
            <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Actions</span>
          </div>

          {visible.map((d, i) => (
            <Row
              key={d.id}
              d={d}
              basePath={basePath}
              first={i === 0}
              busy={busyRows.has(d.id)}
              canDelete={canDelete}
              statusMenuOpen={statusMenu === d.id}
              onOpenStatusMenu={setStatusMenu}
              onChangeStatus={changeStatus}
              onDuplicate={duplicate}
              onRelancer={relancer}
              onDelete={setConfirmOne}
            />
          ))}
        </div>
      )}

      {filtered.length > shown && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setShown((s) => s + PAGE)} className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
            Afficher {Math.min(PAGE, filtered.length - shown)} de plus · {filtered.length - shown} restant{filtered.length - shown > 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Bande « Annuler » */}
      {undoItem && (
        <div
          className="fixed left-6 lg:left-[256px] bottom-6 z-[63] flex items-center gap-4 px-4 py-3"
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

      <ConfirmDialog
        open={confirmOne !== null}
        title={confirmOne ? `Supprimer le devis ${confirmOne.number} ?` : ""}
        description="Cette action est définitive."
        onConfirm={() => { if (confirmOne) remove(confirmOne); }}
        onCancel={() => setConfirmOne(null)}
      />
    </div>
  );
}

/* ── Une ligne ── */
function Row({
  d, basePath, first, busy, canDelete, statusMenuOpen,
  onOpenStatusMenu, onChangeStatus, onDuplicate, onRelancer, onDelete,
}: {
  d: DevisRow;
  basePath: string;
  first: boolean;
  busy: boolean;
  canDelete: boolean;
  statusMenuOpen: boolean;
  onOpenStatusMenu: (id: string | null) => void;
  onChangeStatus: (d: DevisRow, s: QuoteStatus) => void;
  onDuplicate: (d: DevisRow) => void;
  onRelancer: (d: DevisRow) => void;
  onDelete: (d: DevisRow) => void;
}) {
  const s = statusOf(d);
  const tone = TONE[STATUS_TONE[s]];
  const track = trackOf(d);
  // Cibles plus larges au doigt, resserrées dès que la souris prend le relais.
  const iconBtn =
    "adm-act inline-flex items-center justify-center transition-colors flex-shrink-0 relative z-10 w-9 h-9 @[640px]:w-[30px] @[640px]:h-[30px]";

  return (
    <div
      className="group relative grid items-center px-4 py-3 gap-x-3 gap-y-2
                 grid-cols-[1fr_auto]
                 @[640px]:grid-cols-[86px_minmax(120px,1fr)_112px_104px_92px]
                 @[920px]:grid-cols-[92px_minmax(150px,1fr)_78px_minmax(120px,168px)_120px_104px_124px]"
      style={{ borderTop: first ? "none" : `1px solid ${T.border}`, opacity: busy ? 0.6 : 1 }}
    >
      {/* Lien de couverture : toute la ligne ouvre le devis, sauf les actions */}
      <Link
        href={`${basePath}/${d.id}`}
        className="absolute inset-0"
        aria-label={`Ouvrir le devis ${d.number}`}
        style={{ zIndex: 0 }}
      />

      <span className="text-xs tracking-widest uppercase whitespace-nowrap" style={{ color: T.accent }}>
        {d.number}
      </span>

      <div className="min-w-0 col-span-2 @[640px]:col-span-1">
        <div className="text-sm truncate" style={{ color: d.client ? T.text : T.muted }}>
          {d.client || "Sans client"}
        </div>
        <div className="text-[11px] truncate flex items-center gap-2" style={{ color: T.muted }}>
          {d.vehicle || `${d.lineCount} ligne${d.lineCount > 1 ? "s" : ""}`}
          {d.relanceCount > 0 && <span style={{ color: T.warning }}>{d.relanceCount}ᵉ relance</span>}
        </div>
        {/* Rappel du suivi sous le nom quand la colonne dédiée disparaît */}
        {track.text && (
          <div className="text-[11px] @[920px]:hidden" style={{ color: TRACK_COLOR[track.tone] }}>{track.text}</div>
        )}
      </div>

      <span className="text-[11px] text-right hidden @[920px]:block whitespace-nowrap" style={{ color: T.muted }}>
        {formatDateFr(d.issueDate)}
      </span>

      <span className="text-[11px] hidden @[920px]:block truncate" style={{ color: TRACK_COLOR[track.tone] }} title={track.text}>
        {track.text}
      </span>

      <span className="text-sm font-semibold whitespace-nowrap @[640px]:text-right" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
        {formatEuro(d.total)}
      </span>

      {/* Statut : cliquable, change sans ouvrir la fiche */}
      <div className="relative flex justify-end @[640px]:justify-start">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenStatusMenu(statusMenuOpen ? null : d.id); }}
          aria-haspopup="menu"
          aria-expanded={statusMenuOpen}
          title="Changer le statut"
          className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 whitespace-nowrap relative z-10"
          style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}
        >
          {busy ? <Loader2 size={10} className="animate-spin" /> : null}
          {d.statusLabel}
        </button>
        {statusMenuOpen && (
          <StatusMenu current={s} onPick={(next) => onChangeStatus(d, next)} onClose={() => onOpenStatusMenu(null)} />
        )}
      </div>

      {/* Actions : une barre à part sur téléphone, un groupe en fin de ligne ensuite */}
      <div
        className="adm-row-actions flex items-center gap-0.5 col-span-2 @[640px]:col-span-1 justify-start @[640px]:justify-end
                   border-t @[640px]:border-t-0 pt-1.5 @[640px]:pt-0"
        style={{ borderColor: T.border }}
      >
        {d.expired || d.relanceDue ? (
          <button
            type="button"
            title={d.hasEmail ? "Relancer le client par email" : "Ce client n'a pas d'adresse email"}
            aria-label="Relancer le client"
            disabled={!d.hasEmail}
            className={iconBtn + " disabled:opacity-30"}
            style={{ color: T.warning }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRelancer(d); }}
          >
            <Send size={14} />
          </button>
        ) : null}
        {d.factureNumber && (
          <span className={iconBtn} style={{ color: T.muted }} title={`Facturé : ${d.factureNumber}`}>
            <FileText size={14} />
          </span>
        )}
        <Link
          href={`${basePath}/${d.id}`}
          title="Modifier le devis"
          aria-label="Modifier le devis"
          className={iconBtn}
          style={{ color: T.accent }}
        >
          <Pencil size={14} />
        </Link>
        <button
          type="button"
          title="Dupliquer le devis"
          aria-label="Dupliquer le devis"
          className={iconBtn}
          style={{ color: T.muted }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(d); }}
        >
          <Copy size={14} />
        </button>
        <Link
          href={`${basePath}/${d.id}/imprimer`}
          target="_blank"
          title="Ouvrir le PDF"
          aria-label="Ouvrir le PDF"
          className={iconBtn}
          style={{ color: T.muted }}
        >
          <Printer size={14} />
        </Link>
        {canDelete && (
          <button
            type="button"
            title="Supprimer le devis"
            aria-label="Supprimer le devis"
            className="adm-act-danger inline-flex items-center justify-center transition-colors flex-shrink-0 relative z-10 w-9 h-9 @[640px]:w-[30px] @[640px]:h-[30px]"
            style={{ color: T.muted }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(d); }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

    </div>
  );
}

/* ── Écran vide ── */
function EmptyState({ total, query, filter, basePath, onReset }: {
  total: number;
  query: string;
  filter: string;
  basePath: string;
  onReset: () => void;
}) {
  const hasQuery = query.trim() !== "";
  const hasFilter = filter !== "all";

  if (total === 0) {
    return (
      <div className="p-12 text-center" style={{ border: `1px solid ${T.border}` }}>
        <div className="flex justify-center mb-4" style={{ color: T.border }}><FileText size={28} /></div>
        <p className="text-sm mb-1" style={{ color: T.text }}>Votre premier devis s&apos;affichera ici.</p>
        <p className="text-[13px] mb-6" style={{ color: T.muted }}>
          Le document se compose à l&apos;écran et part en PDF dans la foulée.
        </p>
        <Link href={`${basePath}/nouveau`} className={btnPrimaryClass} style={btnPrimaryStyle}>+ Créer le premier</Link>
      </div>
    );
  }

  const label = FILTERS.find((f) => f.value === filter)?.label ?? "";
  let title = `Rien dans « ${label} » pour l'instant.`;
  let hint = "Ce filtre se remplira dès qu'un devis entrera dans cette catégorie.";
  if (hasQuery && hasFilter) {
    title = `Rien dans « ${label} » pour « ${query.trim()} ».`;
    hint = "Élargissez la recherche ou changez de filtre.";
  } else if (hasQuery) {
    title = `Aucun devis pour « ${query.trim()} ».`;
    hint = "La recherche porte sur le numéro, le client, le véhicule et le statut.";
  }

  return (
    <div className="p-12 text-center" style={{ border: `1px solid ${T.border}` }}>
      <div className="flex justify-center mb-4" style={{ color: T.border }}>
        {hasQuery ? <Search size={24} /> : <FileText size={26} />}
      </div>
      <p className="text-sm mb-1" style={{ color: T.text }}>{title}</p>
      <p className="text-[13px] mb-6" style={{ color: T.muted }}>{hint}</p>
      <button type="button" onClick={onReset} className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
        Revenir à tous les devis
      </button>
    </div>
  );
}
