"use client";

import { useMemo, useState } from "react";
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
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "disponible", label: "Disponibles" },
  { value: "reserve", label: "Réservés" },
  { value: "vendu", label: "Vendus" },
];

export default function StockList({ vehicles }: { vehicles: StockItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (!q) return true;
      return `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q);
    });
  }, [vehicles, query, filter]);

  return (
    <div>
      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6">
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

      <p className="text-xs mb-3" style={{ color: T.muted }}>
        {filtered.length} véhicule{filtered.length > 1 ? "s" : ""}
        {filter !== "all" || query ? ` sur ${vehicles.length}` : ""}
      </p>

      <div style={{ border: `1px solid ${T.border}` }}>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: T.textDim }}>
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
        ) : (
          filtered.map((v, i) => (
            <div
              key={v.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 transition-colors hover:bg-[#0A1628]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <Thumb src={v.image} alt={`${v.make} ${v.model}`} />
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>
                      {v.make}
                    </span>
                    <span className="text-sm font-medium truncate" style={{ color: T.text }}>
                      {v.model}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: T.muted }}>
                    {v.year} · {formatNumber(v.mileage)} km · {v.fuel} · {v.origin}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:ml-auto flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: T.text }}>
                  {formatNumber(v.price)} €
                </span>
                <StatusBadge status={v.status} />
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
