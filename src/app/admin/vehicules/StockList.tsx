"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { T, StatusBadge, Thumb, fieldStyle } from "../ui";
import DeleteVehiculeButton from "./DeleteVehiculeButton";

export type StockItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  origin: string;
  status: string;
  image: string | null;
  isPublished: boolean;
};

const FILTERS = [
  { value: "all", label: "Tous" },
  { value: "disponible", label: "Disponibles" },
  { value: "reserve", label: "Réservés" },
  { value: "vendu", label: "Vendus" },
];

const SORTS = [
  { value: "recent", label: "Plus récent" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "km-asc", label: "Km croissant" },
  { value: "km-desc", label: "Km décroissant" },
];

function Tag({ children, tone }: { children: React.ReactNode; tone: "muted" | "warn" }) {
  const c =
    tone === "warn"
      ? { bg: "rgba(240,180,90,0.10)", bd: "rgba(240,180,90,0.38)", fg: "#F0B45A" }
      : { bg: "transparent", bd: T.border, fg: T.muted };
  return (
    <span
      className="inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 whitespace-nowrap"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.bd}`, color: c.fg }}
    >
      {children}
    </span>
  );
}

function RowActions({ v }: { v: StockItem }) {
  return (
    <>
      <Link
        href={`/vehicules/${v.id}`}
        target="_blank"
        className="inline-block py-2 -my-2 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.textDim }}
      >
        Voir
      </Link>
      <Link
        href={`/admin/vehicules/${v.id}`}
        className="inline-block py-2 -my-2 text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
        style={{ color: T.accent }}
      >
        Modifier
      </Link>
      <DeleteVehiculeButton id={v.id} />
    </>
  );
}

export default function StockList({
  vehicles,
  initialFilter = "all",
}: {
  vehicles: StockItem[];
  initialFilter?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState<"list" | "grid">("list");

  useEffect(() => {
    const v = localStorage.getItem("admin_stock_view");
    if (v === "grid" || v === "list") setView(v);
  }, []);
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);
  function changeView(v: "list" | "grid") {
    setView(v);
    localStorage.setItem("admin_stock_view", v);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = vehicles.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (!q) return true;
      return `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q);
    });
    const by: Record<string, (a: StockItem, b: StockItem) => number> = {
      "price-desc": (a, b) => b.price - a.price,
      "price-asc": (a, b) => a.price - b.price,
      "km-asc": (a, b) => a.mileage - b.mileage,
      "km-desc": (a, b) => b.mileage - a.mileage,
    };
    if (sort !== "recent" && by[sort]) list = [...list].sort(by[sort]);
    return list;
  }, [vehicles, query, filter, sort]);

  const viewBtn = (v: "list" | "grid", label: string) => (
    <button
      type="button"
      onClick={() => changeView(v)}
      className="text-[11px] tracking-widest uppercase px-3 py-2 transition-colors"
      style={{
        backgroundColor: view === v ? T.accent : "transparent",
        color: view === v ? T.bg : T.textDim,
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Recherche + filtres de statut */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une marque, un modèle…"
          className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] sm:max-w-xs w-full"
          style={fieldStyle}
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className="text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
                style={{
                  borderColor: active ? T.accent : T.border,
                  color: active ? T.bg : T.textDim,
                  backgroundColor: active ? T.accent : "transparent",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compteur + tri + vue */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-xs" style={{ color: T.muted }}>
          {filtered.length} véhicule{filtered.length > 1 ? "s" : ""}
          {filter !== "all" || query ? ` sur ${vehicles.length}` : ""}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs px-3 py-2 outline-none focus:border-[#6B9FEE] cursor-pointer"
            style={fieldStyle}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex flex-shrink-0" style={{ border: `1px solid ${T.border}` }}>
            {viewBtn("list", "Liste")}
            {viewBtn("grid", "Grille")}
          </div>
        </div>
      </div>

      {/* Liste vide */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          {vehicles.length === 0 ? (
            <>
              Aucun véhicule.{" "}
              <Link href="/admin/vehicules/nouveau" style={{ color: T.accent }}>
                Ajouter le premier.
              </Link>
            </>
          ) : (
            "Aucun résultat pour cette recherche."
          )}
        </div>
      ) : view === "grid" ? (
        /* ── Vue grille ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }}>
              <Link href={`/admin/vehicules/${v.id}`} className="block" style={{ aspectRatio: "4 / 3", backgroundColor: T.float }}>
                {v.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.image} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: T.muted }}>
                    Sans photo
                  </div>
                )}
              </Link>
              <div className="p-4">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>{v.make}</span>
                  <span className="text-sm font-medium truncate" style={{ color: T.text }}>{v.model}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: T.muted }}>
                  {v.year} · {formatNumber(v.mileage)} km
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-semibold" style={{ color: T.text }}>{formatNumber(v.price)} €</span>
                  <span className="flex flex-wrap items-center gap-2 justify-end">
                    <StatusBadge status={v.status} />
                    {!v.isPublished && <Tag tone="muted">Masqué</Tag>}
                    {!v.image && <Tag tone="warn">Sans photo</Tag>}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                  <RowActions v={v} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Vue liste ── */
        <div style={{ border: `1px solid ${T.border}` }}>
          {filtered.map((v, i) => (
            <div
              key={v.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 transition-colors hover:bg-[#0A1628]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <Thumb src={v.image} alt={`${v.make} ${v.model}`} />
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>{v.make}</span>
                    <span className="text-sm font-medium truncate" style={{ color: T.text }}>{v.model}</span>
                  </div>
                  <span className="text-xs" style={{ color: T.muted }}>
                    {v.year} · {formatNumber(v.mileage)} km · {v.fuel} · {v.origin}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:ml-auto flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: T.text }}>{formatNumber(v.price)} €</span>
                <StatusBadge status={v.status} />
                {!v.isPublished && <Tag tone="muted">Masqué</Tag>}
                {!v.image && <Tag tone="warn">Sans photo</Tag>}
                <RowActions v={v} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
