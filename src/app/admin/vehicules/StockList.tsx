"use client";

// Liste du stock : tableau à colonnes alignées, actions directes sur la ligne,
// sélection multiple. Les écritures sont appliquées avant l'aller-retour serveur
// et rattrapables par la bande « Annuler », comme le planning atelier.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, List, LayoutGrid, Eye, EyeOff, ExternalLink, Pencil, ClipboardList, X, Check,
  ChevronRight, ChevronUp, ChevronDown, AlertTriangle, Car, Undo2, Copy, Trash2,
  SlidersHorizontal, Rows3, Keyboard,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  STATUS_LABEL, STATUS_ORDER, VEHICLE_STATUSES, AGE_WATCH_DAYS,
  COMPLETENESS_TOTAL, matchesSearch, formatDays, ageTone, type VehicleStatus,
} from "@/lib/vehicules";
import { T, Tag, StatusBadge, Thumb, fieldStyle, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type StockItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  origin: string;
  color: string;
  power: number | null;
  status: string;
  image: string | null;
  photoCount: number;
  isPublished: boolean;
  daysInStock: number;
  marginCents: number | null;
  openProblems: number;
  completeness: number;
  blocking: string[]; // ce qui empeche de vendre : photo, prix
  todo: string[];     // ce qui reste a etoffer : description, equipements
};

const FILTERS = [
  { value: "all", label: "Tous", empty: "Aucun véhicule pour l'instant." },
  { value: "disponible", label: "Disponibles", empty: "Aucun véhicule disponible pour l'instant." },
  { value: "reserve", label: "Réservés", empty: "Aucun véhicule réservé pour l'instant." },
  { value: "vendu", label: "Vendus", empty: "Aucun véhicule vendu pour l'instant." },
  { value: "a-completer", label: "À compléter", empty: "Toutes les fiches sont complètes." },
  { value: "dorment", label: "Dorment", empty: "Aucun véhicule ne dort en stock." },
] as const;

type SortKey = "recent" | "vehicule" | "km" | "prix" | "age" | "statut" | "marge" | "modifie";

const SORTS: { value: string; label: string }[] = [
  { value: "recent", label: "Plus récent" },
  { value: "age-desc", label: "Le plus ancien en stock" },
  { value: "vehicule-asc", label: "Véhicule A→Z" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "km-asc", label: "Km croissant" },
  { value: "km-desc", label: "Km décroissant" },
  { value: "marge-desc", label: "Marge décroissante" },
  { value: "statut-asc", label: "Statut" },
];

/* ── Filtres avancés ── */
// Rangés dans un tiroir : la barre porte déjà la recherche, six pastilles, le
// tri et la bascule de vue. Un septième contrôle permanent la ferait déborder.
type AdvancedFilters = {
  fuels: string[];
  origins: string[];
  yearMin: string;
  yearMax: string;
  priceMax: string;
  kmMax: string;
};
const EMPTY_ADV: AdvancedFilters = { fuels: [], origins: [], yearMin: "", yearMax: "", priceMax: "", kmMax: "" };

function advActiveCount(a: AdvancedFilters): number {
  return (a.fuels.length > 0 ? 1 : 0) + (a.origins.length > 0 ? 1 : 0)
    + (a.yearMin || a.yearMax ? 1 : 0) + (a.priceMax ? 1 : 0) + (a.kmMax ? 1 : 0);
}

/* ── Regroupement ── */
type GroupKey = "aucun" | "statut" | "marque";
const GROUPS: { value: GroupKey; label: string }[] = [
  { value: "aucun", label: "Sans regroupement" },
  { value: "statut", label: "Grouper par statut" },
  { value: "marque", label: "Grouper par marque" },
];

/* Préférence de vue persistée, lue via useSyncExternalStore : le serveur rend
   toujours "list", le client se synchronise sur localStorage sans effet. */
const VIEW_KEY = "admin_stock_view";
// « compact » retire la vignette et la ligne de contexte : une quarantaine de
// véhicules tiennent alors dans un écran.
type View = "list" | "compact" | "grid";
let viewListeners: Array<() => void> = [];
function subscribeView(cb: () => void) {
  viewListeners.push(cb);
  return () => {
    viewListeners = viewListeners.filter((l) => l !== cb);
  };
}
// Le stockage peut être refusé (navigation privée verrouillée) : sans ce filet,
// la lecture jetait et emportait tout l'affichage de la liste avec elle.
function readView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "grid" || v === "compact" ? v : "list";
  } catch {
    return "list";
  }
}
function changeView(v: View) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* réglage d'affichage : sans conséquence */ }
  viewListeners.forEach((cb) => cb());
}

function statusOf(v: StockItem): VehicleStatus {
  return (VEHICLE_STATUSES as readonly string[]).includes(v.status) ? (v.status as VehicleStatus) : "disponible";
}

function searchableText(v: StockItem): string {
  return [v.make, v.model, v.year, v.fuel, v.origin, v.color, v.power ? `${v.power} ch` : "", STATUS_LABEL[statusOf(v)]]
    .filter(Boolean)
    .join(" ");
}

function tooltipOf(v: StockItem): string {
  const lines = [
    `${v.make} ${v.model}`,
    `${v.year} · ${formatNumber(v.mileage)} km · ${v.fuel}${v.power ? ` · ${v.power} ch` : ""}`,
    `${v.color} · ${v.origin}`,
    `En stock depuis ${formatDays(v.daysInStock)}`,
  ];
  const manques = [...v.blocking, ...v.todo];
  if (manques.length > 0) lines.push(`À compléter : ${manques.join(", ")}.`);
  return lines.join("\n");
}

/* ── Menu de statut ── */
function StatusMenu({ current, onPick, onClose, triggerRef }: {
  current: VehicleStatus;
  onPick: (s: VehicleStatus) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    // Écouté à la capture pour se fermer avant que la ligne réagisse, mais un
    // appui DANS le menu est ignoré : sinon le menu disparaissait avant que le
    // clic n'atteigne l'entrée choisie, et rien ne se passait.
    function onDown(e: PointerEvent) {
      if (boxRef.current?.contains(e.target as Node)) return;
      // La pastille qui a ouvert le menu garde la main : c'est elle qui ferme.
      if (triggerRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [onClose, triggerRef]);

  return (
    <div
      ref={boxRef}
      className="absolute right-0 top-full mt-1 z-[62]"
      style={{ width: 168, backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}
    >
      {VEHICLE_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPick(s); }}
          disabled={s === current}
          className="w-full flex items-center gap-2.5 px-3 text-left text-[13px] transition-colors hover:bg-[rgba(107,159,238,0.10)] disabled:opacity-100"
          style={{ height: 34, color: s === current ? T.muted : T.textDim }}
        >
          <span style={{ width: 8, height: 8, flexShrink: 0, backgroundColor: s === "disponible" ? T.accent : s === "reserve" ? T.warning : T.border }} />
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

/* ── Menu au clic droit ── */
type ContextMenuState = { x: number; y: number; v: StockItem };

function MenuItem({ label, hint, onPick, onClose, danger = false, disabled = false }: {
  label: string; hint?: string; onPick: () => void; onClose: () => void; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { onPick(); onClose(); }}
      className="w-full flex items-center gap-3 px-3 text-left text-[13px] transition-colors hover:bg-[rgba(107,159,238,0.10)] disabled:opacity-40"
      style={{ height: 32, color: danger ? T.muted : T.textDim }}
    >
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[10px] flex-shrink-0" style={{ color: T.border }}>{hint}</span>}
    </button>
  );
}

function MenuSep() {
  return <div style={{ height: 1, backgroundColor: T.border, margin: "4px 0" }} />;
}

function MenuTitre({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pt-2 pb-1 text-[10px] tracking-[0.14em] uppercase" style={{ color: T.border }}>{children}</div>;
}

function ContextMenu({ state, canDelete, onClose, onStatus, onPublish, onDuplicate, onDelete }: {
  state: ContextMenuState;
  canDelete: boolean;
  onClose: () => void;
  onStatus: (v: StockItem, s: VehicleStatus) => void;
  onPublish: (v: StockItem) => void;
  onDuplicate: (v: StockItem) => void;
  onDelete: (v: StockItem) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { v } = state;

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function onDown(e: PointerEvent) {
      if (boxRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // Le menu bascule vers la gauche et vers le haut au bord de l'écran.
  const W = 224, H = 320;
  const left = Math.min(state.x, window.innerWidth - W - 8);
  const top = Math.min(state.y, Math.max(8, window.innerHeight - H - 8));

  return (
    <div
      ref={boxRef}
      role="menu"
      className="fixed z-[64]"
      style={{ left, top, width: W, backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 14px 40px rgba(4,11,22,0.6)" }}
    >
      <div className="px-3 py-2 text-[11px] truncate" style={{ borderBottom: `1px solid ${T.border}`, color: T.text }}>
        {v.make} {v.model}
      </div>

      <MenuItem onClose={onClose} label="Modifier la fiche" hint="E" onPick={() => { window.location.href = `/admin/vehicules/${v.id}`; }} />
      <MenuItem onClose={onClose} label="Ouvrir le suivi" hint="S" onPick={() => { window.location.href = `/admin/vehicules/${v.id}/suivi`; }} />
      <MenuItem onClose={onClose} label="Voir l'annonce" onPick={() => window.open(`/vehicules/${v.id}`, "_blank")} />
      <MenuItem onClose={onClose} label="Dupliquer" hint="D" onPick={() => onDuplicate(v)} />

      <MenuSep />
      <MenuTitre>Statut</MenuTitre>
      {VEHICLE_STATUSES.map((st) => (
        <MenuItem key={st} onClose={onClose} label={STATUS_LABEL[st]} disabled={v.status === st} onPick={() => onStatus(v, st)} />
      ))}

      <MenuSep />
      <MenuItem
        onClose={onClose}
        label={v.isPublished ? "Masquer du site public" : "Publier sur le site public"}
        hint="P"
        onPick={() => onPublish(v)}
      />

      {canDelete && (
        <>
          <MenuSep />
          <MenuItem onClose={onClose} label="Supprimer" hint="Suppr" danger onPick={() => onDelete(v)} />
        </>
      )}
    </div>
  );
}

/* ── Feuille des raccourcis ── */
function ShortcutSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groupes: { titre: string; lignes: [string, string][] }[] = [
    { titre: "Chercher", lignes: [["/", "Aller dans la recherche"], ["Échap", "Effacer la recherche"]] },
    { titre: "Agir sur la ligne survolée", lignes: [["E", "Modifier la fiche"], ["S", "Ouvrir le suivi"], ["P", "Publier ou masquer"], ["D", "Dupliquer"], ["Suppr", "Supprimer"]] },
    { titre: "Revenir", lignes: [["Ctrl Z", "Annuler la dernière action"], ["Échap", "Fermer un menu ou vider la sélection"]] },
    { titre: "Apprendre", lignes: [["?", "Cette feuille"], ["Clic droit", "Toutes les actions d'un véhicule"]] },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Raccourcis clavier"
    >
      <div
        className="w-full max-w-md p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium mb-5" style={{ color: T.text }}>Raccourcis</h2>
        <div className="space-y-5">
          {groupes.map((g) => (
            <div key={g.titre}>
              <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>{g.titre}</div>
              {g.lignes.map(([touche, quoi]) => (
                <div key={touche} className="flex items-center gap-3 py-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
                    style={{ border: `1px solid ${T.border}`, color: T.textDim, minWidth: 46, textAlign: "center" }}
                  >
                    {touche}
                  </span>
                  <span className="text-[13px]" style={{ color: T.textDim }}>{quoi}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className={btnGhostClass} style={btnGhostStyle}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ── Actions d'une ligne ── */
function RowActions({ v, canDelete, onDuplicate, onDelete }: {
  v: StockItem;
  canDelete: boolean;
  onDuplicate: (v: StockItem) => void;
  onDelete: (v: StockItem) => void;
}) {
  const iconBtn = "adm-act inline-flex items-center justify-center transition-colors flex-shrink-0";
  const size = { width: 28, height: 28 };
  return (
    <>
      <Link
        href={`/vehicules/${v.id}`}
        target="_blank"
        title="Voir l'annonce publique"
        aria-label="Voir l'annonce publique"
        className={iconBtn}
        style={{ ...size, color: T.muted }}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={14} />
      </Link>
      <Link
        href={`/admin/vehicules/${v.id}`}
        title="Modifier la fiche"
        aria-label="Modifier la fiche"
        className={iconBtn}
        style={{ ...size, color: T.accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <Pencil size={14} />
      </Link>
      <Link
        href={`/admin/vehicules/${v.id}/suivi`}
        title="Ouvrir le suivi"
        aria-label="Ouvrir le suivi"
        className={iconBtn}
        style={{ ...size, color: T.muted }}
        onClick={(e) => e.stopPropagation()}
      >
        <ClipboardList size={14} />
      </Link>
      <button
        type="button"
        title="Dupliquer la fiche"
        aria-label="Dupliquer la fiche"
        className={iconBtn}
        style={{ ...size, color: T.muted }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(v); }}
      >
        <Copy size={14} />
      </button>
      {canDelete && (
        <button
          type="button"
          title="Supprimer le véhicule"
          aria-label="Supprimer le véhicule"
          className="adm-act-danger inline-flex items-center justify-center transition-colors"
          style={{ ...size, color: T.muted }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(v); }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </>
  );
}

/* ── Écran ── */
export default function StockList({
  vehicles,
  initialFilter = "all",
  initialQuery = "",
  initialSort = "recent",
  canDelete = false,
}: {
  vehicles: StockItem[];
  initialFilter?: string;
  initialQuery?: string;
  initialSort?: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<StockItem[]>(vehicles);
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState(initialSort);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [adv, setAdv] = useState<AdvancedFilters>(EMPTY_ADV);
  const [group, setGroup] = useState<GroupKey>("aucun");
  const hoveredRef = useRef<StockItem | null>(null);
  const [busyRows, setBusyRows] = useState<Set<string>>(new Set());
  const [undoItem, setUndoItem] = useState<{ label: string; run: () => void } | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmOne, setConfirmOne] = useState<StockItem | null>(null);
  const view = useSyncExternalStore(subscribeView, readView, () => "list" as View);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastClicked = useRef<string | null>(null);

  // La prop reste la source de vérité : après un rechargement serveur, l'état
  // local se re-sème, sinon une suppression resterait affichée.
  const [prevVehicles, setPrevVehicles] = useState(vehicles);
  if (prevVehicles !== vehicles) {
    setPrevVehicles(vehicles);
    setRows(vehicles);
    // La sélection survit au rechargement, amputée des lignes disparues.
    setSelected((prev) => new Set([...prev].filter((id) => vehicles.some((v) => v.id === id))));
  }
  // Les trois réglages suivent l'adresse de la même façon : revenir sur « Stock »
  // depuis le menu remet la vue à zéro au lieu de garder une recherche oubliée.
  const [prevUrlState, setPrevUrlState] = useState(`${initialFilter}|${initialQuery}|${initialSort}`);
  const urlState = `${initialFilter}|${initialQuery}|${initialSort}`;
  if (prevUrlState !== urlState) {
    setPrevUrlState(urlState);
    setFilter(initialFilter);
    setQuery(initialQuery);
    setSort(initialSort);
  }

  /* ── Bande « Annuler » ── */
  const showUndo = useCallback((label: string, run: () => void) => setUndoItem({ label, run }), []);
  useEffect(() => {
    if (!undoItem) return;
    const id = setTimeout(() => setUndoItem(null), 8000);
    return () => clearTimeout(id);
  }, [undoItem]);

  /* ── Filtrage et tri ── */
  const filtered = useMemo(() => {
    let list = rows.filter((v) => {
      if (filter === "a-completer" && (v.blocking.length === 0 || v.status === "vendu")) return false;
      if (filter === "dorment" && (v.daysInStock < AGE_WATCH_DAYS || v.status === "vendu")) return false;
      if (filter !== "all" && filter !== "a-completer" && filter !== "dorment" && v.status !== filter) return false;
      if (adv.fuels.length > 0 && !adv.fuels.includes(v.fuel)) return false;
      if (adv.origins.length > 0 && !adv.origins.includes(v.origin)) return false;
      if (adv.yearMin && v.year < Number(adv.yearMin)) return false;
      if (adv.yearMax && v.year > Number(adv.yearMax)) return false;
      if (adv.priceMax && v.price > Number(adv.priceMax)) return false;
      if (adv.kmMax && v.mileage > Number(adv.kmMax)) return false;
      return matchesSearch(searchableText(v), query);
    });

    const [key, dir] = sort.split("-") as [SortKey, "asc" | "desc" | undefined];
    const sign = dir === "asc" ? 1 : -1;
    const by: Record<string, (a: StockItem, b: StockItem) => number> = {
      vehicule: (a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, "fr"),
      km: (a, b) => a.mileage - b.mileage,
      prix: (a, b) => a.price - b.price,
      age: (a, b) => a.daysInStock - b.daysInStock,
      statut: (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
      marge: (a, b) => (a.marginCents ?? -Infinity) - (b.marginCents ?? -Infinity),
    };
    if (by[key]) list = [...list].sort((a, b) => by[key](a, b) * sign);
    return list;
  }, [rows, query, filter, sort, adv]);

  // Valeurs réellement présentes : le tiroir ne propose que ce qui existe.
  const fuelOptions = useMemo(() => [...new Set(rows.map((v) => v.fuel).filter(Boolean))].sort(), [rows]);
  const originOptions = useMemo(() => [...new Set(rows.map((v) => v.origin).filter(Boolean))].sort(), [rows]);

  // Regroupement : la liste reste la même, seuls des intertitres s'intercalent.
  const groups = useMemo(() => {
    if (group === "aucun") return [{ key: "", label: "", items: filtered }];
    const map = new Map<string, StockItem[]>();
    filtered.forEach((v) => {
      const k = group === "statut" ? STATUS_LABEL[statusOf(v)] : v.make;
      const arr = map.get(k);
      if (arr) arr.push(v); else map.set(k, [v]);
    });
    const entries = [...map.entries()];
    if (group === "statut") {
      entries.sort((a, b) => (STATUS_ORDER[a[0].toLowerCase()] ?? 9) - (STATUS_ORDER[b[0].toLowerCase()] ?? 9));
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0], "fr"));
    }
    return entries.map(([key, items]) => ({ key, label: key, items }));
  }, [filtered, group]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, disponible: 0, reserve: 0, vendu: 0, "a-completer": 0, dorment: 0 };
    rows.forEach((v) => {
      c[v.status] = (c[v.status] ?? 0) + 1;
      // Une voiture vendue n'a plus besoin de photos ni de réveil.
      if (v.status === "vendu") return;
      if (v.blocking.length > 0) c["a-completer"]++;
      if (v.daysInStock >= AGE_WATCH_DAYS) c.dorment++;
    });
    return c;
  }, [rows]);

  const stockValue = useMemo(
    () => rows.filter((v) => v.status !== "vendu").reduce((sum, v) => sum + v.price, 0),
    [rows],
  );

  /* ── Écritures ── */
  const setBusy = useCallback((id: string, on: boolean) => {
    setBusyRows((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  // Applique le changement tout de suite puis enregistre ; en cas d'échec, la
  // valeur d'avant reprend sa place et le message le dit.
  const patch = useCallback(async (id: string, delta: Partial<StockItem>, previous: StockItem) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...delta } : r)));
    setBusy(id, true);
    try {
      const res = await fetch(`/api/admin/vehicules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delta),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows((prev) => prev.map((r) => (r.id === id ? previous : r)));
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusy(id, false);
    }
  }, [setBusy, toast]);

  function changeStatus(v: StockItem, status: VehicleStatus) {
    setStatusMenu(null);
    if (v.status === status) return;
    patch(v.id, { status }, v);
    showUndo(`${v.make} ${v.model} passé en « ${STATUS_LABEL[status].toLowerCase()} ».`, () => patch(v.id, { status: v.status }, { ...v, status }));
  }

  const togglePublished = useCallback((v: StockItem) => {
    const next = !v.isPublished;
    patch(v.id, { isPublished: next }, v);
    showUndo(
      `${v.make} ${v.model} ${next ? "publié sur le site." : "masqué du site."}`,
      () => patch(v.id, { isPublished: v.isPublished }, { ...v, isPublished: next }),
    );
  }, [patch, showUndo]);

  async function removeVehicle(v: StockItem) {
    setRows((prev) => prev.filter((r) => r.id !== v.id));
    setSelected((prev) => { const n = new Set(prev); n.delete(v.id); return n; });
    try {
      const res = await fetch(`/api/admin/vehicules/${v.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`${v.make} ${v.model} supprimé.`);
      startTransition(() => router.refresh());
    } catch {
      // Le rechargement remet la ligne à sa place : la réinsérer à la main
      // l'aurait posée en fin de liste, loin de là où elle était.
      toast.error("La suppression a échoué.");
      startTransition(() => router.refresh());
    }
  }

  const duplicate = useCallback(async (v: StockItem) => {
    if (busyRows.has(v.id)) return;
    setBusy(v.id, true);
    try {
      const res = await fetch(`/api/admin/vehicules/${v.id}/dupliquer`, { method: "POST" });
      if (!res.ok) throw new Error();
      const created: { id: string } = await res.json();
      toast.success("Copie créée. Ouvrez-la pour la compléter.");
      router.push(`/admin/vehicules/${created.id}`);
    } catch {
      toast.error("La duplication a échoué.");
    } finally {
      setBusy(v.id, false);
    }
  }, [busyRows, setBusy, toast, router]);

  /* ── Actions groupées ── */
  async function bulkPatch(delta: Partial<StockItem>, label: string) {
    const targets = filtered.filter((r) => selected.has(r.id));
    if (targets.length === 0) return;
    const before = targets.map((t) => ({ ...t }));
    await Promise.all(targets.map((t) => patch(t.id, delta, t)));
    // La sélection se vide : sans cela la barre d'actions reste par-dessus la
    // bande « Annuler », qui ne s'affichait donc jamais après un geste groupé.
    setSelected(new Set());
    showUndo(
      `${targets.length} véhicule${targets.length > 1 ? "s" : ""} ${label}`,
      () => { before.forEach((b) => patch(b.id, { status: b.status, isPublished: b.isPublished }, b)); },
    );
  }

  async function bulkDelete() {
    const targets = filtered.filter((r) => selected.has(r.id));
    setConfirmBulk(false);
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    const results = await Promise.all(
      targets.map((t) => fetch(`/api/admin/vehicules/${t.id}`, { method: "DELETE" }).then((r) => r.ok).catch(() => false)),
    );
    const failed = results.filter((ok) => !ok).length;
    if (failed > 0) toast.error(`${failed} suppression${failed > 1 ? "s ont" : " a"} échoué.`);
    else toast.success(`${targets.length} véhicule${targets.length > 1 ? "s supprimés" : " supprimé"}.`);
    startTransition(() => router.refresh());
  }

  /* ── Raccourcis ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const inField = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.tagName === "SELECT" || el?.isContentEditable;
      // Une demande de confirmation ouverte garde la main sur le clavier.
      if (document.querySelector('[aria-modal="true"]')) return;
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
        return;
      }
      if (inField || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "?") { e.preventDefault(); setShowSheet(true); return; }
      if (e.key === "Escape") { setCtxMenu(null); setStatusMenu(null); setSelected(new Set()); return; }

      // Les touches d'action portent sur la ligne survolée : c'est la cible que
      // l'œil désigne déjà, sans avoir à introduire un curseur de sélection.
      const v = hoveredRef.current;
      if (!v) return;
      if (e.key === "e" || e.key === "E") { e.preventDefault(); router.push(`/admin/vehicules/${v.id}`); }
      else if (e.key === "s" || e.key === "S") { e.preventDefault(); router.push(`/admin/vehicules/${v.id}/suivi`); }
      else if (e.key === "p" || e.key === "P") { e.preventDefault(); togglePublished(v); }
      else if (e.key === "d" || e.key === "D") { e.preventDefault(); duplicate(v); }
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (!canDelete) return;
        e.preventDefault();
        setConfirmOne(v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undoItem, router, canDelete, togglePublished, duplicate]);


  /* ── Sélection ── */
  function toggleRow(id: string, shiftKey: boolean, ordered: StockItem[]) {
    // L'ancre se lit AVANT la mise à jour : la fonction passée à setSelected
    // s'exécute au rendu suivant, quand la référence pointe déjà sur la
    // nouvelle ligne, ce qui réduisait toute plage à une seule ligne.
    const anchor = lastClicked.current;
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && anchor) {
        const from = ordered.findIndex((v) => v.id === anchor);
        const to = ordered.findIndex((v) => v.id === id);
        if (from >= 0 && to >= 0) {
          const [a, b] = from < to ? [from, to] : [to, from];
          for (let i = a; i <= b; i++) next.add(ordered[i].id);
          return next;
        }
      }
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    lastClicked.current = id;
  }

  // L'adresse suit les réglages sans recharger la page : un lien collé dans un
  // message rouvre exactement la même vue.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("statut", filter);
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "recent") params.set("tri", sort);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filter, query, sort]);

  const advActive = advActiveCount(adv);
  const allSelected = filtered.length > 0 && filtered.every((v) => selected.has(v.id));
  const filtersActive = filter !== "all" || query.trim() !== "" || advActiveCount(adv) > 0;

  function resetAll() {
    setFilter("all");
    setQuery("");
    setAdv(EMPTY_ADV);
  }

  function sortByColumn(key: SortKey, defaultDir: "asc" | "desc") {
    const current = sort.split("-")[0];
    const dir = sort.split("-")[1];
    if (current !== key) setSort(`${key}-${defaultDir}`);
    else if (dir === defaultDir) setSort(`${key}-${defaultDir === "asc" ? "desc" : "asc"}`);
    else setSort("recent");
  }

  /* ── Rendu ── */
  return (
    <div>
      {/* Trois chiffres, chacun filtre la liste */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div className="px-4 py-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Valeur du stock · hors vendus</div>
          <div className="text-[24px] mt-1" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {formatNumber(stockValue)} €
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFilter(filter === "disponible" ? "all" : "disponible")}
          className="px-4 py-3 text-left transition-colors"
          style={{ backgroundColor: T.surface, border: `1px solid ${filter === "disponible" ? T.accent : T.border}` }}
        >
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Disponibles</div>
          <div className="text-[24px] mt-1" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {counts.disponible}
            <span className="text-[13px] ml-1.5" style={{ color: T.muted }}>/ {rows.length}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setFilter(filter === "a-completer" ? "all" : "a-completer")}
          className="px-4 py-3 text-left transition-colors col-span-2 lg:col-span-1"
          style={{ backgroundColor: T.surface, border: `1px solid ${filter === "a-completer" ? T.accent : T.border}` }}
        >
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Fiches à compléter</div>
          <div className="text-[24px] mt-1" style={{ color: counts["a-completer"] > 0 ? T.warning : T.text, fontVariantNumeric: "tabular-nums" }}>
            {counts["a-completer"]}
          </div>
        </button>
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
            aria-label="Rechercher un véhicule"
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
                <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compteur + tri + vue */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-xs" style={{ color: T.muted }}>
          {filtered.length} véhicule{filtered.length > 1 ? "s" : ""}
          {filtersActive ? ` sur ${rows.length}` : ""}
        </p>
        {filtersActive && (
          <button type="button" onClick={resetAll} className="adm-act text-[11px] tracking-widest uppercase transition-colors" style={{ color: T.accent }}>
            Tout afficher
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={() => setShowFilters((x) => !x)}
            aria-pressed={showFilters}
            title="Plus de filtres"
            className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 border transition-colors"
            style={{
              borderColor: advActive > 0 || showFilters ? T.accent : T.border,
              color: advActive > 0 ? T.accent : T.textDim,
            }}
          >
            <SlidersHorizontal size={13} />
            Filtres
            {advActive > 0 && <span style={{ fontVariantNumeric: "tabular-nums" }}>{advActive}</span>}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Trier la liste"
            className="text-xs px-3 py-2 outline-none cursor-pointer"
            style={fieldStyle}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as GroupKey)}
            aria-label="Regrouper la liste"
            className="text-xs px-3 py-2 outline-none cursor-pointer hidden sm:block"
            style={fieldStyle}
          >
            {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <div className="flex flex-shrink-0" style={{ border: `1px solid ${T.border}` }}>
            {([["list", "Liste", List], ["compact", "Compact", Rows3], ["grid", "Photos", LayoutGrid]] as const).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => changeView(v)}
                aria-pressed={view === v}
                className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 transition-colors"
                style={{ backgroundColor: view === v ? T.accent : "transparent", color: view === v ? T.bg : T.textDim }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tiroir de filtres : ouvert à la demande, il ne prend aucune place au repos. */}
      {showFilters && (
        <div className="mb-4 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="sm:col-span-2">
            <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>Carburant</div>
            <div className="flex flex-wrap gap-1.5">
              {fuelOptions.map((f) => {
                const on = adv.fuels.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAdv((a) => ({ ...a, fuels: on ? a.fuels.filter((x) => x !== f) : [...a.fuels, f] }))}
                    className="adm-chip text-[11px] px-2.5 py-1.5 border transition-colors"
                    style={{ borderColor: on ? T.accent : T.border, color: on ? T.bg : T.textDim, backgroundColor: on ? T.accent : "transparent" }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>Provenance</div>
            <div className="flex flex-wrap gap-1.5">
              {originOptions.map((o) => {
                const on = adv.origins.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAdv((a) => ({ ...a, origins: on ? a.origins.filter((x) => x !== o) : [...a.origins, o] }))}
                    className="adm-chip text-[11px] px-2.5 py-1.5 border transition-colors"
                    style={{ borderColor: on ? T.accent : T.border, color: on ? T.bg : T.textDim, backgroundColor: on ? T.accent : "transparent" }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>Année</div>
            <div className="flex items-center gap-2">
              <input inputMode="numeric" value={adv.yearMin} onChange={(e) => setAdv((a) => ({ ...a, yearMin: e.target.value.replace(/\D/g, "") }))} placeholder="de" aria-label="Année minimum" className="px-3 py-2 text-sm outline-none w-full" style={fieldStyle} />
              <input inputMode="numeric" value={adv.yearMax} onChange={(e) => setAdv((a) => ({ ...a, yearMax: e.target.value.replace(/\D/g, "") }))} placeholder="à" aria-label="Année maximum" className="px-3 py-2 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>Prix maximum</div>
            <input inputMode="numeric" value={adv.priceMax} onChange={(e) => setAdv((a) => ({ ...a, priceMax: e.target.value.replace(/\D/g, "") }))} placeholder="€" aria-label="Prix maximum" className="px-3 py-2 text-sm outline-none w-full" style={fieldStyle} />
          </div>

          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>Kilométrage maximum</div>
            <input inputMode="numeric" value={adv.kmMax} onChange={(e) => setAdv((a) => ({ ...a, kmMax: e.target.value.replace(/\D/g, "") }))} placeholder="km" aria-label="Kilométrage maximum" className="px-3 py-2 text-sm outline-none w-full" style={fieldStyle} />
          </div>

          <div className="flex items-end justify-end gap-3">
            {advActive > 0 && (
              <button type="button" onClick={() => setAdv(EMPTY_ADV)} className="adm-act text-[11px] tracking-widest uppercase transition-colors" style={{ color: T.accent }}>
                Effacer ces filtres
              </button>
            )}
            <button type="button" onClick={() => setShowFilters(false)} className="adm-act text-[11px] tracking-widest uppercase transition-colors" style={{ color: T.muted }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          total={rows.length}
          query={query}
          emptyLabel={FILTERS.find((f) => f.value === filter)?.empty ?? "Aucun véhicule."}
          filter={filter}
          onReset={resetAll}
          onClearQuery={() => setQuery("")}
        />
      ) : view === "grid" ? (
        <div className="@container">
          <GridView rows={filtered} canDelete={canDelete} onDuplicate={duplicate} onDelete={setConfirmOne} />
        </div>
      ) : (
        // Les colonnes suivent la largeur du CADRE, pas celle de la fenêtre : la
        // barre latérale apparaît justement à 1024 px et vole 232 px, si bien qu'un
        // palier calé sur la fenêtre ajoutait une colonne au moment où la place
        // disparaissait.
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          {/* En-têtes triables */}
          <div
            className="hidden @[640px]:grid items-center px-4 py-2 gap-x-3
                       grid-cols-[24px_56px_minmax(140px,1fr)_100px_112px_140px]
                       @[860px]:grid-cols-[24px_56px_minmax(150px,1fr)_84px_110px_120px_168px]
                       @[1040px]:grid-cols-[24px_64px_minmax(180px,1fr)_88px_116px_72px_124px_196px]"
            style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}
          >
            <span />
            <span />
            <SortHead label="Véhicule" k="vehicule" dir="asc" className="flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Km" k="km" dir="asc" className="justify-end hidden @[860px]:flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Prix" k="prix" dir="desc" className="justify-end flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Âge" k="age" dir="desc" className="justify-end hidden @[1040px]:flex" sort={sort} onSort={sortByColumn} />
            <SortHead label="Statut" k="statut" dir="asc" className="flex" sort={sort} onSort={sortByColumn} />
            <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Actions</span>
          </div>

          {groups.map((g, gi) => (
            <div key={g.key || "tout"}>
              {g.label && (
                <div
                  className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.14em] uppercase"
                  style={{ backgroundColor: T.surfaceAlt, color: T.muted, borderTop: gi === 0 ? "none" : `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}
                >
                  {g.label}
                  <span style={{ color: T.border }}>{g.items.length}</span>
                </div>
              )}
              {g.items.map((v, i) => (
                <Row
                  key={v.id}
                  v={v}
                  index={gi === 0 && i === 0 && !g.label ? 0 : 1}
                  ordered={filtered}
                  compact={view === "compact"}
                  selected={selected.has(v.id)}
                  busy={busyRows.has(v.id)}
                  canDelete={canDelete}
                  statusMenuOpen={statusMenu === v.id}
                  onToggleSelect={toggleRow}
                  onOpenStatusMenu={setStatusMenu}
                  onChangeStatus={changeStatus}
                  onTogglePublished={togglePublished}
                  onDuplicate={duplicate}
                  onDelete={setConfirmOne}
                  onContextMenu={(x, y) => setCtxMenu({ x, y, v })}
                  onHover={(item) => { hoveredRef.current = item; }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Barre d'actions groupées */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[64] flex flex-wrap items-center gap-3 px-4 py-3"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.accent}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}
        >
          <span className="text-[12px]" style={{ color: T.text }}>
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <span style={{ width: 1, height: 18, backgroundColor: T.border }} />
          <button type="button" onClick={() => bulkPatch({ isPublished: true }, "publiés.")} className={btnGhostClass} style={btnGhostStyle}>Publier</button>
          <button type="button" onClick={() => bulkPatch({ isPublished: false }, "masqués.")} className={btnGhostClass} style={btnGhostStyle}>Masquer</button>
          <button type="button" onClick={() => bulkPatch({ status: "vendu" }, "passés en vendu.")} className={btnGhostClass} style={btnGhostStyle}>Marquer vendu</button>
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmBulk(true)}
              className="adm-act-danger text-[11px] tracking-widest uppercase transition-colors"
              style={{ color: T.muted }}
            >
              Supprimer
            </button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} aria-label="Vider la sélection" className="adm-act transition-colors" style={{ color: T.muted }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Bande « Annuler » */}
      {undoItem && (
        <div
          className={`fixed left-6 lg:left-[256px] z-[63] flex items-center gap-4 px-4 py-3 ${selected.size > 0 ? "bottom-24" : "bottom-6"}`}
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

      {ctxMenu && (
        <ContextMenu
          state={ctxMenu}
          canDelete={canDelete}
          onClose={() => setCtxMenu(null)}
          onStatus={changeStatus}
          onPublish={togglePublished}
          onDuplicate={duplicate}
          onDelete={setConfirmOne}
        />
      )}

      {showSheet && <ShortcutSheet onClose={() => setShowSheet(false)} />}

      <ConfirmDialog
        open={confirmBulk}
        title={`Supprimer ${selected.size} véhicule${selected.size > 1 ? "s" : ""} ?`}
        description="Cette action est définitive."
        onConfirm={bulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />
      <ConfirmDialog
        open={confirmOne !== null}
        title={confirmOne ? `Supprimer ${confirmOne.make} ${confirmOne.model} ?` : ""}
        description="Cette action est définitive."
        onConfirm={() => { if (confirmOne) removeVehicle(confirmOne); setConfirmOne(null); }}
        onCancel={() => setConfirmOne(null)}
      />

      <p className="text-[11px] mt-3" style={{ color: T.muted }}>
        Clic droit sur un véhicule pour toutes ses actions.{" "}
        <button type="button" onClick={() => setShowSheet(true)} className="adm-act inline-flex items-center gap-1 transition-colors" style={{ color: T.accent }}>
          <Keyboard size={12} />
          Raccourcis
        </button>
      </p>

      {/* Case « tout sélectionner », posée hors du tableau pour rester atteignable */}
      {filtered.length > 0 && view === "list" && (
        <button
          type="button"
          onClick={() => setSelected(allSelected ? new Set() : new Set(filtered.map((v) => v.id)))}
          className="adm-act text-[11px] tracking-widest uppercase mt-3 transition-colors"
          style={{ color: T.muted }}
        >
          {allSelected ? "Tout désélectionner" : `Sélectionner les ${filtered.length} véhicules affichés`}
        </button>
      )}
    </div>
  );
}

/* ── Une ligne ── */
function Row({
  v, index, ordered, compact, selected, busy, canDelete, statusMenuOpen,
  onToggleSelect, onOpenStatusMenu, onChangeStatus, onTogglePublished, onDuplicate, onDelete,
  onContextMenu, onHover,
}: {
  v: StockItem;
  index: number;
  ordered: StockItem[];
  compact: boolean;
  selected: boolean;
  busy: boolean;
  canDelete: boolean;
  statusMenuOpen: boolean;
  onToggleSelect: (id: string, shift: boolean, ordered: StockItem[]) => void;
  onOpenStatusMenu: (id: string | null) => void;
  onChangeStatus: (v: StockItem, s: VehicleStatus) => void;
  onTogglePublished: (v: StockItem) => void;
  onDuplicate: (v: StockItem) => void;
  onDelete: (v: StockItem) => void;
  onContextMenu: (x: number, y: number) => void;
  onHover: (v: StockItem | null) => void;
}) {
  const shiftRef = useRef(false);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const status = statusOf(v);
  const tone = ageTone(v.daysInStock);
  // Une seule alerte affichée, la plus grave, pour que la couleur garde son sens.
  const alert = v.openProblems > 0
    ? { label: `${v.openProblems} problème${v.openProblems > 1 ? "s" : ""} ouvert${v.openProblems > 1 ? "s" : ""}`, tone: "danger" as const }
    : v.price <= 0
      ? { label: "Prix à définir", tone: "warning" as const }
      : !v.image
        ? { label: "Sans photo", tone: "warning" as const }
        : !v.isPublished
          ? { label: "Masqué", tone: "muted" as const }
          : null;
  const manques = [...v.blocking, ...v.todo];

  return (
    <div
      className="group relative transition-colors"
      onMouseEnter={() => onHover(v)}
      onMouseLeave={() => onHover(null)}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); }}
      style={{
        borderTop: index === 0 ? "none" : `1px solid ${T.border}`,
        backgroundColor: selected ? "var(--adm-accent-soft)" : undefined,
        opacity: busy ? 0.6 : 1,
        // La ligne passe devant les suivantes tant que son menu est ouvert,
        // sinon le menu se peint dessous et devient inatteignable.
        zIndex: statusMenuOpen ? 60 : undefined,
      }}
    >
      {/* Lien de couverture : toute la ligne mène à la fiche, sans imbriquer de liens. */}
      <Link
        href={`/admin/vehicules/${v.id}`}
        aria-label={`Modifier ${v.make} ${v.model}`}
        // Le titre vit sur le lien de couverture : la grille de la ligne est en
        // pointer-events-none, une infobulle posée sur une cellule ne s'affichait
        // jamais.
        title={tooltipOf(v)}
        className="absolute inset-0 z-0"
        tabIndex={-1}
      />

      <div
        className={`relative z-10 grid items-center px-4 pointer-events-none gap-x-3 gap-y-1 ${compact ? "py-1.5" : "py-3"}
                   grid-cols-[24px_1fr]
                   @[640px]:grid-cols-[24px_56px_minmax(140px,1fr)_100px_112px_140px]
                   @[860px]:grid-cols-[24px_56px_minmax(150px,1fr)_84px_110px_120px_168px]
                   @[1040px]:grid-cols-[24px_64px_minmax(180px,1fr)_88px_116px_72px_124px_196px]`}
      >
        {/* Sélection */}
        <label
          className="pointer-events-auto inline-flex items-center justify-center cursor-pointer"
          style={{ width: 20, height: 20 }}
          onClick={(e) => e.stopPropagation()}
          // La touche Maj se lit à l'appui : l'événement « change » d'une case
          // ne la porte pas, la sélection par plage restait donc sans effet.
          onPointerDown={(e) => { shiftRef.current = e.shiftKey; }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(v.id, shiftRef.current, ordered)}
            aria-label={`Sélectionner ${v.make} ${v.model}`}
            className="cursor-pointer"
            style={{ width: 14, height: 14, accentColor: "var(--adm-accent)" }}
          />
        </label>

        {/* Photo */}
        <div className="hidden @[640px]:block">
          {compact ? <span /> : <Thumb src={v.image} alt={`${v.make} ${v.model}`} w={56} h={42} />}
        </div>

        {/* Véhicule */}
        <div className="min-w-0 flex gap-3 @[640px]:block">
          {/* Sous 640 px la vignette accompagne le nom, faute de colonne dédiée. */}
          <span className="@[640px]:hidden flex-shrink-0">
            <Thumb src={v.image} alt={`${v.make} ${v.model}`} w={44} h={33} />
          </span>
          <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-[10px] tracking-[0.18em] uppercase flex-shrink-0 truncate"
              style={{ color: T.accent, maxWidth: 110 }}
            >
              {v.make}
            </span>
            <span className="text-[15px] font-medium truncate min-w-0" style={{ color: T.text }}>{v.model}</span>
          </div>
          <div className={`text-[11px] truncate ${compact ? "hidden @[640px]:hidden" : ""}`} style={{ color: T.muted }}>
            {v.year} · <span className="@[860px]:hidden">{formatNumber(v.mileage)} km · </span>{v.fuel}
            {v.power ? ` · ${v.power} ch` : ""}
            <span className="hidden @[1040px]:inline"> · {v.color} · {v.origin}</span>
          </div>
          {/* Repères secondaires, sur la même ligne au téléphone */}
          <div className="flex flex-wrap items-center gap-2 mt-1 @[640px]:hidden">
            <span className="text-[13px] font-semibold" style={{ color: T.text }}>
              {v.price > 0 ? `${formatNumber(v.price)} €` : "Prix à définir"}
            </span>
            <StatusBadge status={v.status} />
            {alert && <Tag tone={alert.tone}>{alert.label}</Tag>}
          </div>
          </div>
        </div>

        {/* Km */}
        <div className="hidden @[860px]:block text-[13px] text-right" style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>
          {formatNumber(v.mileage)}
        </div>

        {/* Prix et marge */}
        <div className="hidden @[640px]:block text-right">
          {v.price > 0 ? (
            <span className="text-[14px] font-semibold" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
              {formatNumber(v.price)} €
            </span>
          ) : (
            <span className="text-[12px]" style={{ color: T.warning }}>Prix à définir</span>
          )}
          {v.marginCents !== null && (
            <div className="text-[11px] font-medium" style={{ color: v.marginCents >= 0 ? T.success : T.danger, fontVariantNumeric: "tabular-nums" }}>
              {v.marginCents >= 0 ? "+" : "−"}{formatNumber(Math.abs(Math.round(v.marginCents / 100)))} €
            </div>
          )}
        </div>

        {/* Âge */}
        <div className="hidden @[1040px]:block text-right">
          <span
            className="text-[12px]"
            title={`En stock depuis ${v.daysInStock} jour${v.daysInStock > 1 ? "s" : ""}`}
            style={{ color: tone === "danger" ? T.danger : tone === "warning" ? T.warning : T.muted, fontVariantNumeric: "tabular-nums" }}
          >
            {formatDays(v.daysInStock)}
          </span>
        </div>

        {/* Statut et alerte, hauteur fixe pour que les lignes restent régulières */}
        <div
          className="hidden @[640px]:flex flex-col items-start justify-center gap-1 pointer-events-auto relative"
          // En vue compacte la hauteur n'est plus réservée : c'est elle qui
          // fixait le plancher de 58 px et rendait le cran presque inutile.
          style={{ minHeight: compact ? 0 : 46 }}
        >
          <button
            type="button"
            ref={badgeRef}
            onPointerDown={(e) => {
              // L'ouverture se joue sur l'appui, dans le même événement que la
              // fermeture par clic extérieur : sinon un second clic sur la
              // pastille fermait puis rouvrait aussitôt le menu.
              e.preventDefault();
              e.stopPropagation();
              onOpenStatusMenu(statusMenuOpen ? null : v.id);
            }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="adm-chip inline-flex items-center gap-1 transition-colors"
            title="Changer le statut"
          >
            <StatusBadge status={v.status} />
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.muted }} />
          </button>
          {/* Un seul repère secondaire, pour que toutes les lignes gardent la
              même hauteur : l'alerte si elle existe, la note de fiche sinon. */}
          {compact ? null : alert ? (
            <span title={manques.length > 0 ? `À compléter : ${manques.join(", ")}.` : undefined}>
              {alert.tone === "danger" ? (
                <Tag tone="danger"><AlertTriangle size={9} className="inline mr-1" />{alert.label}</Tag>
              ) : (
                <Tag tone={alert.tone}>{alert.label}</Tag>
              )}
            </span>
          ) : v.completeness < COMPLETENESS_TOTAL ? (
            <span className="text-[10px]" style={{ color: T.muted }} title={`À compléter : ${manques.join(", ")}.`}>
              Fiche {v.completeness}/{COMPLETENESS_TOTAL}
            </span>
          ) : null}
          {statusMenuOpen && (
            <StatusMenu current={status} onPick={(s) => onChangeStatus(v, s)} onClose={() => onOpenStatusMenu(null)} triggerRef={badgeRef} />
          )}
        </div>

        {/* Actions */}
        <div className="hidden @[640px]:flex items-center justify-end gap-0.5 pointer-events-auto adm-row-actions">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePublished(v); }}
            title={v.isPublished ? "Masquer du site public" : "Publier sur le site public"}
            aria-label={v.isPublished ? "Masquer du site public" : "Publier sur le site public"}
            className="adm-act inline-flex items-center justify-center transition-colors"
            style={{ width: 28, height: 28, color: v.isPublished ? T.muted : T.warning }}
          >
            {v.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <RowActions v={v} canDelete={canDelete} onDuplicate={onDuplicate} onDelete={onDelete} />
          <ChevronRight size={14} style={{ color: T.border }} />
        </div>

        {/* Actions au téléphone : toujours visibles, cibles larges */}
        <div className="flex @[640px]:hidden items-center gap-1 col-span-2 pointer-events-auto mt-1" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onTogglePublished(v); }}
            aria-label={v.isPublished ? "Masquer du site public" : "Publier sur le site public"}
            className="inline-flex items-center justify-center flex-1"
            style={{ height: 40, color: v.isPublished ? T.muted : T.warning }}
          >
            {v.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <Link href={`/admin/vehicules/${v.id}`} aria-label="Modifier la fiche" className="inline-flex items-center justify-center flex-1" style={{ height: 40, color: T.accent }}>
            <Pencil size={16} />
          </Link>
          <Link href={`/admin/vehicules/${v.id}/suivi`} aria-label="Ouvrir le suivi" className="inline-flex items-center justify-center flex-1" style={{ height: 40, color: T.muted }}>
            <ClipboardList size={16} />
          </Link>
          <Link href={`/vehicules/${v.id}`} target="_blank" aria-label="Voir l'annonce publique" className="inline-flex items-center justify-center flex-1" style={{ height: 40, color: T.muted }}>
            <ExternalLink size={16} />
          </Link>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onDelete(v); }}
              aria-label="Supprimer le véhicule"
              className="inline-flex items-center justify-center flex-1"
              style={{ height: 40, color: T.muted }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Vue photos ── */
function GridView({ rows, canDelete, onDuplicate, onDelete }: {
  rows: StockItem[];
  canDelete: boolean;
  onDuplicate: (v: StockItem) => void;
  onDelete: (v: StockItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 @[560px]:grid-cols-2 @[900px]:grid-cols-3 gap-4">
      {rows.map((v) => {
        const sold = v.status === "vendu";
        return (
          <div key={v.id} className="adm-veh adm-card" style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }}>
            <Link
              href={`/admin/vehicules/${v.id}`}
              className="block relative overflow-hidden"
              style={{ aspectRatio: "16 / 10", backgroundColor: T.float }}
            >
              {v.image ? (
                <Image
                  src={v.image}
                  alt={`${v.make} ${v.model}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  className="object-cover"
                  style={{ opacity: sold ? 0.5 : 1 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: T.border }}>
                  <Car size={26} />
                </div>
              )}
              <span className="absolute top-2 right-2 flex flex-col items-end gap-1 pointer-events-none">
                {!v.isPublished && (
                  <span className="text-[10px] tracking-[0.15em] uppercase px-2 py-1" style={{ backgroundColor: T.warning, color: T.bg }}>Masqué</span>
                )}
                {v.openProblems > 0 && (
                  <span className="text-[10px] tracking-[0.15em] uppercase px-2 py-1" style={{ backgroundColor: T.danger, color: T.bg }}>
                    {v.openProblems} problème{v.openProblems > 1 ? "s" : ""}
                  </span>
                )}
              </span>
              <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 pointer-events-none"
                style={{ backgroundColor: "rgba(4,11,22,0.7)", color: v.photoCount > 0 ? T.textDim : T.warning }}>
                {v.photoCount > 0 ? `${v.photoCount} photo${v.photoCount > 1 ? "s" : ""}` : "Photos manquantes"}
              </span>
            </Link>
            <div className="p-4">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[10px] tracking-[0.18em] uppercase flex-shrink-0" style={{ color: T.accent }}>{v.make}</span>
                <span className="text-[13px] font-medium truncate" style={{ color: T.text }}>{v.model}</span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: T.muted }}>
                {v.year} · {formatNumber(v.mileage)} km · {v.fuel}{v.power ? ` · ${v.power} ch` : ""} · {v.origin}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[14px] font-semibold" style={{ color: v.price > 0 ? T.text : T.warning, fontVariantNumeric: "tabular-nums" }}>
                  {v.price > 0 ? `${formatNumber(v.price)} €` : "Prix à définir"}
                </span>
                <StatusBadge status={v.status} />
              </div>
              <div className="flex items-center gap-0.5 mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                <RowActions v={v} canDelete={canDelete} onDuplicate={onDuplicate} onDelete={onDelete} />
                <span className="ml-auto text-[10px]" style={{ color: ageTone(v.daysInStock) === "muted" ? T.muted : T.warning }}>
                  {formatDays(v.daysInStock)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Écran vide ── */
function EmptyState({ total, query, emptyLabel, filter, onReset, onClearQuery }: {
  total: number;
  query: string;
  emptyLabel: string;
  filter: string;
  onReset: () => void;
  onClearQuery: () => void;
}) {
  const hasQuery = query.trim() !== "";
  const hasFilter = filter !== "all";

  let icon = <Car size={28} />;
  let title = "Aucun véhicule pour l'instant.";
  let hint = "Ajoutez votre première annonce pour la voir apparaître ici.";
  let action = (
    <Link href="/admin/vehicules/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>+ Ajouter le premier</Link>
  );

  if (total > 0) {
    icon = hasQuery ? <Search size={24} /> : <Car size={26} />;
    if (hasQuery && hasFilter) {
      title = `${emptyLabel.replace(/ pour l'instant\.$/, "")} pour « ${query.trim()} ».`;
      hint = "Élargissez la recherche ou changez de filtre.";
    } else if (hasQuery) {
      title = `Aucun véhicule pour « ${query.trim()} ».`;
      hint = "La recherche porte sur la marque, le modèle, l'année, le carburant, la couleur et la provenance.";
    } else {
      title = emptyLabel;
      hint = "Ce filtre reviendra utile dès qu'une fiche entrera dans cette catégorie.";
    }
    action = hasQuery && !hasFilter
      ? <button type="button" onClick={onClearQuery} className={btnGhostClass} style={btnGhostStyle}>Effacer la recherche</button>
      : <button type="button" onClick={onReset} className={btnGhostClass} style={btnGhostStyle}>Tout afficher</button>;
  }

  return (
    <div className="flex flex-col items-center text-center px-6 py-14 gap-3" style={{ border: `1px solid ${T.border}` }}>
      <span style={{ color: T.border }}>{icon}</span>
      <p className="text-sm" style={{ color: T.textDim }}>{title}</p>
      <p className="text-[12px] max-w-sm" style={{ color: T.muted }}>{hint}</p>
      <div className="mt-2">{action}</div>
    </div>
  );
}
