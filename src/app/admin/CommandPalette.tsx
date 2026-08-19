"use client";

// Palette de commandes (Ctrl+K) : navigation, actions et recherche
// véhicules / devis. Les données sont chargées à la première ouverture.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Car, FileText, ReceiptText, BellRing, Plus, LayoutDashboard, Wallet, MessagesSquare,
  Users, HandCoins, ShieldCheck, Star, UserCog, CalendarClock, Radio, CornerDownLeft, FileBadge,
  NotebookPen, FolderKanban, Undo2, BarChart3, type LucideIcon,
} from "lucide-react";
import { can, type Role, type Capability } from "@/lib/roles";
import { formatDateFr, STATUS_LABEL, type QuoteStatus } from "@/lib/devis";
import { T } from "./ui";

// `prive` marque les écrans nominatifs : ils restent introuvables pour les
// autres comptes, palette de commandes comprise.
type Item = { icon: LucideIcon; label: string; hint: string; href: string; cap?: Capability; prive?: boolean };

const STATIC_ITEMS: Item[] = [
  { icon: Plus, label: "Ajouter un véhicule", hint: "Action", href: "/admin/vehicules/nouveau" },
  { icon: Plus, label: "Nouveau devis", hint: "Action", href: "/admin/devis/nouveau" },
  { icon: Plus, label: "Nouvelle réunion", hint: "Action", href: "/admin/reunions?nouvelle=1" },
  { icon: Plus, label: "Nouvelle estimation", hint: "Action", href: "/admin/reprises/nouvelle" },
  { icon: Plus, label: "Nouveau projet", hint: "Action", href: "/admin/projets?nouveau=1" },
  { icon: LayoutDashboard, label: "Tableau de bord", hint: "Page", href: "/admin" },
  { icon: BarChart3, label: "Audience", hint: "Page", href: "/admin/audience", prive: true },
  { icon: Car, label: "Stock", hint: "Page", href: "/admin/vehicules" },
  { icon: FileText, label: "Devis", hint: "Page", href: "/admin/devis" },
  { icon: ReceiptText, label: "Factures", hint: "Page", href: "/admin/factures" },
  { icon: BellRing, label: "Relances", hint: "Page", href: "/admin/relances" },
  { icon: Users, label: "Clients & leads", hint: "Page", href: "/admin/clients" },
  { icon: HandCoins, label: "Reprises", hint: "Page", href: "/admin/reprises" },
  { icon: CalendarClock, label: "Planning atelier", hint: "Page", href: "/admin/planning" },
  { icon: Radio, label: "Diffusion", hint: "Page", href: "/admin/diffusion" },
  { icon: ShieldCheck, label: "Garanties", hint: "Page", href: "/admin/garanties" },
  { icon: FileBadge, label: "Immatriculations", hint: "Page", href: "/admin/immatriculations" },
  { icon: Star, label: "Avis clients", hint: "Page", href: "/admin/avis" },
  { icon: MessagesSquare, label: "Atelier", hint: "Page", href: "/admin/atelier" },
  { icon: FolderKanban, label: "Projets", hint: "Page", href: "/admin/projets" },
  { icon: NotebookPen, label: "Réunions", hint: "Page", href: "/admin/reunions" },
  { icon: Wallet, label: "Comptes", hint: "Page", href: "/admin/comptes", cap: "finances" },
  { icon: UserCog, label: "Utilisateurs", hint: "Réglages", href: "/admin/utilisateurs", cap: "users" },
  // Maquette de référence sortie de l'en-tête du stock : la palette est une
  // surface de navigation durable et cherchable, contrairement à un bouton.
  { icon: Car, label: "Aperçu ancienne modale véhicule", hint: "Maquette", href: "/admin/vehicules/modale-apercu" },
];

type MeetingLite = {
  id: string;
  date: string;
  title: string;
  kind: string;
  decisions: { id: string; content: string }[];
};
type VehicleLite = { id: string; make: string; model: string; year: number; status: string };
type QuoteLite = { id: string; number: string; docType?: string; clientName?: string | null; clientCompany?: string | null; status: string };
type ClientLite = { id: string; name: string; company: string; email: string };

export default function CommandPalette({ role, audience = false }: { role: Role; audience?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [vehicles, setVehicles] = useState<VehicleLite[] | null>(null);
  const [quotes, setQuotes] = useState<QuoteLite[] | null>(null);
  const [clients, setClients] = useState<ClientLite[] | null>(null);
  const [meetings, setMeetings] = useState<MeetingLite[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const [vRes, qRes, cRes, rRes] = await Promise.all([
        fetch("/api/admin/vehicules"),
        fetch("/api/admin/devis?light=1"),
        fetch("/api/admin/clients"),
        fetch("/api/admin/reunions"),
      ]);
      if (vRes.ok) setVehicles(await vRes.json());
      if (qRes.ok) setQuotes(await qRes.json());
      if (cRes.ok) setClients(await cRes.json());
      if (rRes.ok) setMeetings(await rRes.json());
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
    const stat = STATIC_ITEMS.filter(
      (i) => (!i.cap || can(role, i.cap)) && (!i.prive || audience) && (!q || i.label.toLowerCase().includes(q))
    );
    const veh: Item[] = (vehicles ?? [])
      .filter((v) => q && `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((v) => ({ icon: Car, label: `${v.make} ${v.model} · ${v.year}`, hint: `Stock · ${v.status}`, href: `/admin/vehicules/${v.id}` }));
    const qts: Item[] = (quotes ?? [])
      .filter((d) => q && `${d.number} ${d.clientName ?? ""} ${d.clientCompany ?? ""}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((d) => {
        // Le type se lit sur docType : deviné au préfixe « FAC- », une facture
        // renumérotée à la main s'affichait comme un devis, avec le mauvais lien.
        const isFac = d.docType === "facture";
        const isAvoir = d.docType === "avoir";
        const typeLabel = isAvoir ? "Avoir" : isFac ? "Facture" : "Devis";
        return {
          icon: isAvoir ? Undo2 : isFac ? ReceiptText : FileText,
          label: `${typeLabel} ${d.number}${d.clientCompany || d.clientName ? ` — ${d.clientCompany || d.clientName}` : ""}`,
          // Le code interne « envoye » s'affichait tel quel dans la palette.
          hint: isFac || isAvoir ? typeLabel : STATUS_LABEL[d.status as QuoteStatus] ?? d.status,
          href: `/admin/devis/${d.id}`,
        };
      });
    const cls: Item[] = (clients ?? [])
      .filter((c) => q && `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({
        icon: Users,
        label: c.company ? `${c.company} — ${c.name}` : c.name,
        hint: "Client",
        href: `/admin/clients/${c.id}`,
      }));
    // Réunions et décisions. Une décision prise il y a six mois se retrouve en
    // tapant trois mots, depuis n'importe quelle page.
    const reu: Item[] = [];
    if (q) {
      for (const m of meetings ?? []) {
        const titre = m.title.trim() || `Réunion du ${formatDateFr(m.date)}`;
        if (`${titre} ${m.kind} ${formatDateFr(m.date)}`.toLowerCase().includes(q)) {
          reu.push({ icon: NotebookPen, label: titre, hint: `Réunion · ${formatDateFr(m.date)}`, href: `/admin/reunions/${m.id}` });
        }
        for (const d of m.decisions) {
          if (reu.length >= 6) break;
          if (d.content.toLowerCase().includes(q)) {
            reu.push({
              icon: NotebookPen,
              label: d.content,
              hint: `Décision · ${formatDateFr(m.date)}`,
              href: `/admin/reunions/${m.id}`,
            });
          }
        }
        if (reu.length >= 6) break;
      }
    }

    return [...stat.slice(0, q ? 4 : 9), ...veh, ...cls, ...qts, ...reu.slice(0, 6)];
  }, [query, vehicles, quotes, clients, meetings, role]);

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
                placeholder="Rechercher un véhicule, un devis, une décision…"
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
                    // La ligne choisie se ramène dans la zone visible : les
                    // résultats du bas (réunions, décisions) restaient hors champ,
                    // la flèche bas descendait sans que rien ne défile.
                    ref={
                      i === selected
                        ? (el) => {
                            el?.scrollIntoView({ block: "nearest" });
                          }
                        : undefined
                    }
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
