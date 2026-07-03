"use client";

// Palette de commandes (Ctrl+K) : navigation, actions et recherche
// véhicules / devis. Les données sont chargées à la première ouverture.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Car, FileText, Plus, LayoutDashboard, Wallet, MessagesSquare,
  Users, CalendarClock, Radio, CornerDownLeft, type LucideIcon,
} from "lucide-react";
import { T } from "./ui";

type Item = { icon: LucideIcon; label: string; hint: string; href: string };

const STATIC_ITEMS: Item[] = [
  { icon: Plus, label: "Ajouter un véhicule", hint: "Action", href: "/admin/vehicules/nouveau" },
  { icon: Plus, label: "Nouveau devis", hint: "Action", href: "/admin/devis/nouveau" },
  { icon: LayoutDashboard, label: "Tableau de bord", hint: "Page", href: "/admin" },
  { icon: Car, label: "Stock", hint: "Page", href: "/admin/vehicules" },
  { icon: FileText, label: "Devis", hint: "Page", href: "/admin/devis" },
  { icon: Users, label: "Clients & leads", hint: "Page", href: "/admin/clients" },
  { icon: CalendarClock, label: "Planning atelier", hint: "Page", href: "/admin/planning" },
  { icon: Radio, label: "Diffusion", hint: "Page", href: "/admin/diffusion" },
  { icon: MessagesSquare, label: "Atelier", hint: "Page", href: "/admin/atelier" },
  { icon: Wallet, label: "Comptes", hint: "Page", href: "/admin/comptes" },
];

type VehicleLite = { id: string; make: string; model: string; year: number; status: string };
type QuoteLite = { id: string; number: string; clientName?: string | null; clientCompany?: string | null; status: string };
type ClientLite = { id: string; name: string; company: string; email: string };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [vehicles, setVehicles] = useState<VehicleLite[] | null>(null);
  const [quotes, setQuotes] = useState<QuoteLite[] | null>(null);
  const [clients, setClients] = useState<ClientLite[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const [vRes, qRes, cRes] = await Promise.all([
        fetch("/api/admin/vehicules"),
        fetch("/api/admin/devis"),
        fetch("/api/admin/clients"),
      ]);
      if (vRes.ok) setVehicles(await vRes.json());
      if (qRes.ok) setQuotes(await qRes.json());
      if (cRes.ok) setClients(await cRes.json());
    } catch {
      /* la palette reste utilisable avec les actions statiques */
    }
  }, []);

  const openPalette = useCallback(() => {
    setQuery("");
    setSelected(0);
    setOpen(true);
    load();
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openPalette();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const stat = STATIC_ITEMS.filter((i) => !q || i.label.toLowerCase().includes(q));
    const veh: Item[] = (vehicles ?? [])
      .filter((v) => q && `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((v) => ({ icon: Car, label: `${v.make} ${v.model} · ${v.year}`, hint: `Stock · ${v.status}`, href: `/admin/vehicules/${v.id}` }));
    const qts: Item[] = (quotes ?? [])
      .filter((d) => q && `${d.number} ${d.clientName ?? ""} ${d.clientCompany ?? ""}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((d) => ({
        icon: FileText,
        label: `Devis ${d.number}${d.clientCompany || d.clientName ? ` — ${d.clientCompany || d.clientName}` : ""}`,
        hint: d.status,
        href: `/admin/devis/${d.id}`,
      }));
    const cls: Item[] = (clients ?? [])
      .filter((c) => q && `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({
        icon: Users,
        label: c.company ? `${c.company} — ${c.name}` : c.name,
        hint: "Client",
        href: `/admin/clients/${c.id}`,
      }));
    return [...stat.slice(0, q ? 4 : 8), ...veh, ...cls, ...qts];
  }, [query, vehicles, quotes, clients]);

  function go(item: Item) {
    setOpen(false);
    router.push(item.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="relative w-60 items-center gap-2 pl-9 pr-14 py-2 text-xs text-left hidden sm:flex"
        style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.muted }}
      >
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
        <span className="truncate">Rechercher…</span>
        <kbd
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 tracking-widest"
          style={{ border: `1px solid ${T.border}`, color: T.muted }}
        >
          CTRL K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] px-6"
          style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg mx-auto mt-[14vh]"
            style={{ backgroundColor: T.surface, border: "1px solid rgba(199,211,232,0.28)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative" style={{ borderBottom: `1px solid ${T.border}` }}>
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter" && results[selected]) go(results[selected]);
                }}
                placeholder="Rechercher un véhicule, un devis, une action…"
                className="w-full pl-11 pr-4 py-3.5 text-sm outline-none bg-transparent"
                style={{ color: T.text }}
              />
            </div>
            <div className="py-2 max-h-[320px] overflow-y-auto">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm" style={{ color: T.muted }}>Aucun résultat.</p>
              ) : (
                results.map((r, i) => (
                  <div
                    key={r.href + r.label}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                    style={{ backgroundColor: i === selected ? "rgba(107,159,238,0.10)" : "transparent", color: T.textDim }}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => go(r)}
                  >
                    <r.icon size={14} style={{ color: T.accent, flexShrink: 0 }} />
                    <span className="text-[13px] truncate">{r.label}</span>
                    <span className="text-[10px] uppercase tracking-widest ml-auto flex-shrink-0" style={{ color: T.muted }}>{r.hint}</span>
                    {i === selected && <CornerDownLeft size={12} style={{ color: T.muted, flexShrink: 0 }} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
