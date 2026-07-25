"use client";

// Carnet clients de la démonstration : liste filtrable côté client (aucun fetch).
// Alimenté par des lignes déjà sérialisées côté serveur (src/lib/demo-data.ts).
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Building2, Mail, Phone } from "lucide-react";
import { T, Tag, fieldStyle } from "@/app/admin/ui";
import { DEMO_BASE } from "../demo";

export type CarnetRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  activeLeads: number;
  ago: string;
};

export default function ClientsCarnet({ clients }: { clients: CarnetRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.name} ${c.company} ${c.email} ${c.phone}`.toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <>
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

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Aucun résultat pour cette recherche.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`${DEMO_BASE}/clients/${c.id}`}
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
                {c.activeLeads > 0 && <Tag tone="accent">{c.activeLeads} lead{c.activeLeads > 1 ? "s" : ""} actif{c.activeLeads > 1 ? "s" : ""}</Tag>}
                <span className="text-[10px]" style={{ color: T.muted }}>{c.ago}</span>
                <ChevronRight size={14} style={{ color: T.muted }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
