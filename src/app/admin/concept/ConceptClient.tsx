"use client";

// ── MAQUETTE CONCEPT (jetable) ──────────────────────────────────────────────
// Dashboard cible du futur admin : sidebar, KPIs animés, graphiques SVG maison,
// halos de profondeur, touches argentées. Données factices sauf photos.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, Car, FileText, Wallet, MessagesSquare, Users, CalendarClock,
  Radio, Search, Bell, ChevronRight, ArrowUpRight, ArrowDownRight, BadgeCheck,
  Clock3, Handshake, Banknote, Table2, ChartArea, Plus, Sparkles, type LucideIcon,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

/* ── Jetons locaux de la maquette ── */
const C = {
  bg: "#060D1A",
  surface: "#0E1B33",
  surfaceAlt: "#0A1426",
  border: "#1B3055",
  borderSilver: "rgba(199,211,232,0.28)",
  text: "#F0F5FF",
  textDim: "#C8D8EE",
  muted: "#7C92B5",
  silver: "#C7D3E8",
  accent: "#6B9FEE",
  success: "#4ED1A1",
  danger: "#FF6B35",
};
// Couleurs de graphique validées (dataviz, mode sombre sur #112240) :
const CHART = { blue: "#4B7FD8", amber: "#C08428", green: "#2FA97D", spark: "#566B93" };

/* ── Données factices ── */
const MONTHS = ["Août", "Sept", "Oct", "Nov", "Déc", "Jan", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil"];
const DATA = {
  "12": {
    stockValue: [148, 156, 149, 163, 171, 168, 182, 176, 190, 197, 205, 214],
    sales: [2, 3, 1, 4, 3, 5],
    kpis: { value: 214500, valueDelta: 8.2, dispo: 12, dispoDelta: 3, devis: 7, devisHint: "2 en attente de signature", ventes: 5, ventesDelta: 25 },
  },
  "6": {
    stockValue: [182, 176, 190, 197, 205, 214],
    sales: [1, 4, 3, 3, 4, 5],
    kpis: { value: 214500, valueDelta: 4.6, dispo: 12, dispoDelta: 2, devis: 7, devisHint: "2 en attente de signature", ventes: 5, ventesDelta: 25 },
  },
} as const;
type Period = keyof typeof DATA;

const DONUT = [
  { label: "Disponibles", value: 12, color: CHART.blue },
  { label: "Réservés", value: 3, color: CHART.amber },
  { label: "Vendus (mois)", value: 5, color: CHART.green },
];
// Angles des segments précalculés (données statiques) : écart ≈ 2px de surface.
const DONUT_GAP = 0.035;
const DONUT_TOTAL = DONUT.reduce((s, seg) => s + seg.value, 0);
const DONUT_ANGLES = (() => {
  let acc = -Math.PI / 2;
  return DONUT.map((seg) => {
    const span = (seg.value / DONUT_TOTAL) * Math.PI * 2;
    const range = { a0: acc + DONUT_GAP / 2, a1: acc + span - DONUT_GAP / 2 };
    acc += span;
    return range;
  });
})();

const ACTIVITY = [
  { icon: BadgeCheck, color: C.success, text: "Devis 2026-014 accepté", detail: "Audi TT 40 TFSI · M. Lambert", time: "il y a 12 min" },
  { icon: Sparkles, color: C.accent, text: "Fiche créée par l'assistant IA", detail: "BMW M240i xDrive · 34 s de saisie", time: "il y a 1 h" },
  { icon: Users, color: C.silver, text: "Nouveau lead entrant", detail: "Recherche personnalisée · SUV hybride", time: "il y a 3 h" },
  { icon: Handshake, color: C.success, text: "Vente conclue", detail: "Renault Megane 3 RS · 15 490 €", time: "hier" },
  { icon: CalendarClock, color: C.accent, text: "RDV atelier planifié", detail: "Contrôle technique · jeudi 10 h", time: "hier" },
];

type NavItem = { icon: LucideIcon; label: string; active?: boolean; soon?: boolean };
const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Pilotage", items: [{ icon: LayoutDashboard, label: "Tableau de bord", active: true }] },
  {
    section: "Activité",
    items: [
      { icon: Car, label: "Stock" },
      { icon: FileText, label: "Devis & factures" },
      { icon: Users, label: "Clients & leads", soon: true },
      { icon: CalendarClock, label: "Planning atelier", soon: true },
      { icon: Radio, label: "Diffusion", soon: true },
    ],
  },
  {
    section: "Équipe",
    items: [
      { icon: MessagesSquare, label: "Atelier" },
      { icon: Wallet, label: "Comptes" },
    ],
  },
];

type Vehicle = { id: string; make: string; model: string; year: number; price: number; status: string; image: string | null };

/* ── Compteur animé (ease-out expo) ── */
function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * t);
      setValue(Math.round(from + (target - from) * (t === 1 ? 1 : eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ── Sparkline 12 points : trait discret, dernier point accentué ── */
function Sparkline({ data }: { data: readonly number[] }) {
  const w = 84, h = 28, pad = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const y = (v: number) => (max === min ? h / 2 : pad + (h - 2 * pad) * (1 - (v - min) / (max - min)));
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lx = x(data.length - 1), ly = y(data[data.length - 1]);
  return (
    <svg width={w} height={h} aria-hidden>
      <path d={d} fill="none" stroke={CHART.spark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill={C.accent} stroke={C.surface} strokeWidth="2" />
    </svg>
  );
}

/* ── Badge de variation (statut : icône + valeur) ── */
function Delta({ value, suffix = "%", label }: { value: number; suffix?: string; label: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: up ? C.success : C.danger }} title={label}>
      <Icon size={13} />
      {up ? "+" : ""}{value}{suffix}
      <span className="font-normal" style={{ color: C.muted }}>{label}</span>
    </span>
  );
}

/* ── Tuile KPI ── */
function StatTile({
  label, value, compact, delta, hint, spark, icon: Icon, index,
}: {
  label: string; value: number; compact?: boolean; delta?: React.ReactNode; hint?: string;
  spark?: readonly number[]; icon: typeof Banknote; index: number;
}) {
  const n = useCountUp(value);
  return (
    <div
      className="ia-c-card ia-c-enter relative p-5 min-w-0"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, animationDelay: `${80 + index * 90}ms` }}
    >
      <div className="ia-c-hairline" />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: C.muted }}>{label}</span>
        <Icon size={16} style={{ color: C.silver, opacity: 0.75, flexShrink: 0 }} />
      </div>
      <div className="text-[28px] leading-none font-light whitespace-nowrap mt-3" style={{ color: C.text }}>
        {compact ? `${formatNumber(n)} €` : formatNumber(n)}
      </div>
      <div className="mt-2.5 min-h-[16px] relative z-[1]">
        {delta}
        {hint && <span className="text-[11px]" style={{ color: C.muted }}>{hint}</span>}
      </div>
      {spark && (
        <div className="absolute right-5 bottom-4 pointer-events-none" style={{ opacity: 0.9 }}>
          <Sparkline data={spark} />
        </div>
      )}
    </div>
  );
}

/* ── Graphique en aires : valeur du stock ── */
function AreaChart({ data, labels }: { data: readonly number[]; labels: readonly string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const W = 660, H = 240, PL = 46, PR = 18, PT = 16, PB = 30;
  const min = 130, max = 230; // bornes fixes arrondies -> ticks propres
  const x = (i: number) => PL + (i * (W - PL - PR)) / (data.length - 1);
  const y = (v: number) => PT + (H - PT - PB) * (1 - (v - min) / (max - min));
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - PB} L${x(0).toFixed(1)},${H - PB} Z`;
  const ticks = [150, 175, 200, 225];
  const last = data.length - 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-medium" style={{ color: C.text }}>Valeur du stock</h3>
          <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>En milliers d&apos;euros, annonces disponibles</p>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-2.5 py-1.5 transition-colors"
          style={{ border: `1px solid ${C.border}`, color: C.muted }}
        >
          {asTable ? <ChartArea size={13} /> : <Table2 size={13} />}
          {asTable ? "Graphique" : "Tableau"}
        </button>
      </div>

      {asTable ? (
        <table className="w-full mt-3 text-sm" style={{ color: C.textDim }}>
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="text-left font-normal text-[11px] uppercase tracking-widest py-2" style={{ borderBottom: `1px solid ${C.border}` }}>Mois</th>
              <th className="text-right font-normal text-[11px] uppercase tracking-widest py-2" style={{ borderBottom: `1px solid ${C.border}` }}>Valeur</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
            {data.map((v, i) => (
              <tr key={i}>
                <td className="py-1.5" style={{ borderBottom: `1px solid ${C.surfaceAlt}` }}>{labels[i]}</td>
                <td className="py-1.5 text-right" style={{ borderBottom: `1px solid ${C.surfaceAlt}` }}>{formatNumber(v * 1000)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
            <defs>
              <linearGradient id="ia-c-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity="0.16" />
                <stop offset="100%" stopColor={C.accent} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={C.border} strokeWidth="1" opacity="0.55" />
                <text x={PL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={C.muted}>{t} k</text>
              </g>
            ))}
            {labels.map((m, i) => (
              (data.length <= 6 || i % 2 === 0) && (
                <text key={m + i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill={C.muted}>{m}</text>
              )
            ))}
            <path d={area} fill="url(#ia-c-area)" />
            <path d={line} fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke={C.silver} strokeWidth="1" opacity="0.4" />
            )}
            {hover !== null && (
              <circle cx={x(hover)} cy={y(data[hover])} r="4.5" fill={C.accent} stroke={C.surface} strokeWidth="2" />
            )}
            <circle cx={x(last)} cy={y(data[last])} r="4" fill={C.accent} stroke={C.surface} strokeWidth="2" />
            <text x={x(last) - 8} y={y(data[last]) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill={C.textDim}>
              {formatNumber(data[last] * 1000)} €
            </text>
            <rect
              x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} fill="transparent"
              onMouseMove={(e) => {
                const r = (e.target as SVGRectElement).getBoundingClientRect();
                const px = ((e.clientX - r.left) / r.width) * (W - PL - PR) + PL;
                let best = 0, bd = Infinity;
                for (let i = 0; i < data.length; i++) {
                  const d = Math.abs(x(i) - px);
                  if (d < bd) { bd = d; best = i; }
                }
                setHover(best);
              }}
              onMouseLeave={() => setHover(null)}
            />
          </svg>
          {hover !== null && (
            <div
              className="absolute pointer-events-none px-3 py-2"
              style={{
                left: `${(x(hover) / W) * 100}%`,
                top: 0,
                transform: `translateX(${hover > data.length / 2 ? "-108%" : "8%"})`,
                backgroundColor: C.surfaceAlt,
                border: `1px solid ${C.borderSilver}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              }}
            >
              <div className="text-sm font-semibold whitespace-nowrap" style={{ color: C.text }}>{formatNumber(data[hover] * 1000)} €</div>
              <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: C.muted }}>{labels[hover]}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Donut : répartition du stock ── */
function Donut() {
  const [hover, setHover] = useState<number | null>(null);
  const total = DONUT_TOTAL;
  const R = 74, r = 52, CX = 100, CY = 100;

  const segs = DONUT.map((d, i) => {
    const { a0, a1 } = DONUT_ANGLES[i];
    const Ro = R + (hover === i ? 4 : 0);
    const p = (a: number, rad: number) => `${CX + rad * Math.cos(a)},${CY + rad * Math.sin(a)}`;
    const largeArc = a1 - a0 > Math.PI ? 1 : 0;
    const path = `M${p(a0, Ro)} A${Ro},${Ro} 0 ${largeArc} 1 ${p(a1, Ro)} L${p(a1, r)} A${r},${r} 0 ${largeArc} 0 ${p(a0, r)} Z`;
    return { ...d, path, i };
  });

  return (
    <div>
      <h3 className="text-sm font-medium" style={{ color: C.text }}>Répartition du stock</h3>
      <p className="text-[11px] mt-0.5 mb-2" style={{ color: C.muted }}>{total} véhicules ce mois</p>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 200 200" width="164" height="164">
            {segs.map((s) => (
              <path
                key={s.label}
                d={s.path}
                fill={s.color}
                opacity={hover === null || hover === s.i ? 1 : 0.35}
                style={{ transition: "opacity 0.18s ease" }}
                onMouseEnter={() => setHover(s.i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[26px] font-light leading-none" style={{ color: C.text }}>
              {hover === null ? total : DONUT[hover].value}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] mt-1" style={{ color: C.muted }}>
              {hover === null ? "véhicules" : DONUT[hover].label}
            </span>
          </div>
        </div>
        <ul className="space-y-2.5 min-w-0">
          {DONUT.map((d, i) => (
            <li
              key={d.label}
              className="flex items-center gap-2.5 cursor-default"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ opacity: hover === null || hover === i ? 1 : 0.5, transition: "opacity 0.18s ease" }}
            >
              <span style={{ width: 10, height: 10, backgroundColor: d.color, flexShrink: 0 }} />
              <span className="text-xs" style={{ color: C.textDim }}>{d.label}</span>
              <span className="text-xs font-semibold ml-auto pl-3" style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Barres : ventes par mois ── */
function SalesBars({ data, labels }: { data: readonly number[]; labels: readonly string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 190, PB = 26, PT = 18;
  const max = Math.max(...data);
  const bw = 22;
  const slot = W / data.length;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / (max + 1));
  const maxIdx = data.indexOf(max);

  return (
    <div>
      <h3 className="text-sm font-medium" style={{ color: C.text }}>Ventes par mois</h3>
      <p className="text-[11px] mt-0.5 mb-2" style={{ color: C.muted }}>6 derniers mois</p>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
          <line x1="0" x2={W} y1={H - PB} y2={H - PB} stroke={C.border} strokeWidth="1" />
          {data.map((v, i) => {
            const bx = i * slot + (slot - bw) / 2;
            const by = y(v);
            const bh = H - PB - by;
            const rr = Math.min(4, bh);
            return (
              <g key={i}>
                <path
                  d={`M${bx},${H - PB} L${bx},${by + rr} Q${bx},${by} ${bx + rr},${by} L${bx + bw - rr},${by} Q${bx + bw},${by} ${bx + bw},${by + rr} L${bx + bw},${H - PB} Z`}
                  fill={CHART.blue}
                  style={{ filter: hover === i ? "brightness(1.25)" : "none", transition: "filter 0.15s ease" }}
                />
                {i === maxIdx && (
                  <text x={bx + bw / 2} y={by - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.textDim}>{v}</text>
                )}
                <text x={bx + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={C.muted}>{labels[i]}</text>
                <rect
                  x={i * slot} y={PT} width={slot} height={H - PT - PB} fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            className="absolute pointer-events-none px-3 py-1.5"
            style={{
              left: `${((hover + 0.5) / data.length) * 100}%`,
              top: 0,
              transform: "translateX(-50%)",
              backgroundColor: C.surfaceAlt,
              border: `1px solid ${C.borderSilver}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}
          >
            <span className="text-sm font-semibold" style={{ color: C.text }}>{data[hover]}</span>
            <span className="text-[10px] uppercase tracking-widest ml-2" style={{ color: C.muted }}>vente{data[hover] > 1 ? "s" : ""} · {labels[hover]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ConceptClient({ vehicles }: { vehicles: Vehicle[] }) {
  const [period, setPeriod] = useState<Period>("12");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const d = DATA[period];
  const monthLabels = useMemo(() => MONTHS.slice(12 - d.stockValue.length), [d]);
  const salesLabels = MONTHS.slice(6);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex" style={{ backgroundColor: C.bg, color: C.text }}>
      <style>{`
        @keyframes ia-c-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .ia-c-enter { animation: ia-c-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .ia-c-card { transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease; }
        .ia-c-card:hover { border-color: ${C.borderSilver} !important; box-shadow: 0 14px 44px rgba(0,0,0,0.4), 0 0 0 1px rgba(199,211,232,0.06); transform: translateY(-2px); }
        .ia-c-hairline { position: absolute; top: 0; left: 12%; right: 12%; height: 1px;
          background: linear-gradient(to right, transparent, rgba(199,211,232,0.35), transparent); }
        .ia-c-nav:hover { color: ${C.text} !important; background: rgba(107,159,238,0.06); }
        .ia-c-veh img { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
        .ia-c-veh:hover img { transform: scale(1.06); }
      `}</style>

      {/* ── Sidebar ── */}
      <aside
        className="w-[232px] flex-shrink-0 flex flex-col hidden lg:flex"
        style={{ backgroundColor: C.surfaceAlt, borderRight: `1px solid ${C.border}` }}
      >
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="text-[13px] tracking-[0.3em] uppercase font-semibold" style={{ color: C.text }}>
            Intelligence
          </div>
          <div className="text-[9px] tracking-[0.42em] uppercase mt-1" style={{ color: C.silver }}>
            Automobile
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="px-2 mb-2 text-[9px] tracking-[0.28em] uppercase" style={{ color: C.muted }}>
                {group.section}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <span
                      className="ia-c-nav relative flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] cursor-pointer transition-colors"
                      style={{
                        color: item.active ? C.text : C.muted,
                        backgroundColor: item.active ? "rgba(107,159,238,0.10)" : "transparent",
                        fontWeight: item.active ? 600 : 400,
                      }}
                    >
                      {item.active && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-[2px]"
                          style={{ background: `linear-gradient(to bottom, transparent, ${C.accent}, transparent)` }}
                        />
                      )}
                      <item.icon size={15} style={{ color: item.active ? C.accent : C.muted, flexShrink: 0 }} />
                      <span className="truncate">{item.label}</span>
                      {item.soon && (
                        <span
                          className="ml-auto text-[8px] tracking-[0.14em] uppercase px-1.5 py-0.5 flex-shrink-0"
                          style={{ border: `1px solid ${C.borderSilver}`, color: C.silver }}
                        >
                          Bientôt
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 flex items-center gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <span
            className="flex items-center justify-center w-8 h-8 text-[11px] font-semibold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #24406E, #12233F)", border: `1px solid ${C.borderSilver}`, color: C.silver }}
          >
            CV
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: C.textDim }}>César Vachon</div>
            <div className="text-[10px]" style={{ color: C.muted }}>Fondateur</div>
          </div>
        </div>
      </aside>

      {/* ── Colonne principale ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="relative z-20 flex items-center gap-4 px-6 h-14 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "rgba(10,20,38,0.7)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase" style={{ color: C.muted }}>
            <span>Admin</span>
            <ChevronRight size={12} />
            <span style={{ color: C.textDim }}>Tableau de bord</span>
          </div>

          <div className="relative ml-auto w-full max-w-xs hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
            <input
              ref={searchRef}
              placeholder="Rechercher véhicule, devis, client…"
              onFocus={() => setPaletteOpen(true)}
              onBlur={() => setTimeout(() => setPaletteOpen(false), 150)}
              className="w-full pl-9 pr-12 py-2 text-xs outline-none"
              style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${paletteOpen ? C.borderSilver : C.border}`, color: C.text, transition: "border-color 0.2s" }}
            />
            <kbd
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 tracking-widest"
              style={{ border: `1px solid ${C.border}`, color: C.muted }}
            >
              CTRL K
            </kbd>
            {paletteOpen && (
              <div
                className="absolute top-full mt-2 left-0 right-0 py-2 z-10"
                style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.borderSilver}`, boxShadow: "0 18px 48px rgba(0,0,0,0.55)" }}
              >
                {[
                  { icon: Car, label: "Audi TT 40 TFSI S-LINE", hint: "Stock · disponible" },
                  { icon: FileText, label: "Devis 2026-014 — M. Lambert", hint: "Accepté" },
                  { icon: Plus, label: "Créer un devis", hint: "Action" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3 px-3 py-2 cursor-pointer ia-c-nav" style={{ color: C.textDim }}>
                    <r.icon size={14} style={{ color: C.accent }} />
                    <span className="text-xs truncate">{r.label}</span>
                    <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: C.muted }}>{r.hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="relative p-1.5" style={{ color: C.muted }} aria-label="Notifications">
            <Bell size={16} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
          </button>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Halos de profondeur */}
          <div
            className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
            style={{
              background: `radial-gradient(640px 300px at 18% -5%, rgba(107,159,238,0.13), transparent 70%),
                           radial-gradient(560px 280px at 85% 0%, rgba(199,211,232,0.07), transparent 70%)`,
            }}
          />

          <div className="relative max-w-6xl mx-auto px-6 py-8">
            {/* En-tête + filtre période */}
            <div className="ia-c-enter flex flex-wrap items-end justify-between gap-4 mb-7" style={{ animationDelay: "0ms" }}>
              <div>
                <div style={{ width: 24, height: 2, background: `linear-gradient(to right, ${C.accent}, transparent)` }} className="mb-3" />
                <h1 className="text-[26px] font-light" style={{ letterSpacing: "-0.01em" }}>
                  Bonjour César
                  <span className="ml-3 text-sm align-middle" style={{ color: C.muted }}>mercredi 2 juillet</span>
                </h1>
              </div>
              <div className="flex" style={{ border: `1px solid ${C.border}` }}>
                {(["6", "12"] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className="text-[11px] tracking-widest uppercase px-3.5 py-2 transition-colors"
                    style={{
                      backgroundColor: period === p ? "rgba(107,159,238,0.14)" : "transparent",
                      color: period === p ? C.text : C.muted,
                      fontWeight: period === p ? 600 : 400,
                    }}
                  >
                    {p} mois
                  </button>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
              <StatTile index={0} label="Valeur du stock" value={d.kpis.value} compact icon={Banknote}
                delta={<Delta value={d.kpis.valueDelta} label="vs préc." />} spark={d.stockValue} />
              <StatTile index={1} label="Disponibles" value={d.kpis.dispo} icon={BadgeCheck}
                delta={<Delta value={d.kpis.dispoDelta} suffix="" label="ce mois" />} />
              <StatTile index={2} label="Devis en cours" value={d.kpis.devis} icon={FileText} hint={d.kpis.devisHint} />
              <StatTile index={3} label="Ventes du mois" value={d.kpis.ventes} icon={Handshake}
                delta={<Delta value={d.kpis.ventesDelta} label="vs mois dernier" />} />
            </div>

            {/* Graphiques rangée 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
              <div className="ia-c-card ia-c-enter relative xl:col-span-2 p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, animationDelay: "460ms" }}>
                <div className="ia-c-hairline" />
                <AreaChart data={d.stockValue} labels={monthLabels} />
              </div>
              <div className="ia-c-card ia-c-enter relative p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, animationDelay: "540ms" }}>
                <div className="ia-c-hairline" />
                <Donut />
              </div>
            </div>

            {/* Graphiques rangée 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
              <div className="ia-c-card ia-c-enter relative p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, animationDelay: "620ms" }}>
                <div className="ia-c-hairline" />
                <SalesBars data={d.sales} labels={salesLabels} />
              </div>
              <div className="ia-c-card ia-c-enter relative xl:col-span-2 p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, animationDelay: "700ms" }}>
                <div className="ia-c-hairline" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium" style={{ color: C.text }}>Activité récente</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase" style={{ color: C.muted }}>
                    Temps réel
                    <span className="w-1.5 h-1.5 rounded-full ml-1" style={{ backgroundColor: C.success, boxShadow: `0 0 6px ${C.success}` }} />
                  </span>
                </div>
                <ul className="space-y-1">
                  {ACTIVITY.map((a, i) => (
                    <li key={i} className="flex items-center gap-3.5 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.surfaceAlt}` }}>
                      <span
                        className="flex items-center justify-center w-7 h-7 flex-shrink-0"
                        style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${C.border}` }}
                      >
                        <a.icon size={14} style={{ color: a.color }} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] truncate" style={{ color: C.textDim }}>{a.text}</div>
                        <div className="text-[11px] truncate" style={{ color: C.muted }}>{a.detail}</div>
                      </div>
                      <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: C.muted }}>{a.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Dernières entrées : photo d'abord */}
            <div className="ia-c-enter flex items-center justify-between mb-3" style={{ animationDelay: "780ms" }}>
              <h3 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: C.muted }}>Dernières entrées</h3>
              <span className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase cursor-pointer" style={{ color: C.accent }}>
                Tout le stock
                <ChevronRight size={12} />
              </span>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 pb-10">
              {vehicles.map((v, i) => (
                <div
                  key={v.id}
                  className="ia-c-veh ia-c-card ia-c-enter relative min-w-0"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, animationDelay: `${840 + i * 80}ms` }}
                >
                  <div className="overflow-hidden" style={{ aspectRatio: "16 / 10", backgroundColor: C.surfaceAlt }}>
                    {v.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.image} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={22} style={{ color: C.muted }} />
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[10px] tracking-widest uppercase flex-shrink-0" style={{ color: C.accent }}>{v.make}</span>
                      <span className="text-[13px] font-medium truncate" style={{ color: C.text }}>{v.model}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{formatNumber(v.price)} €</span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color: v.status === "disponible" ? C.accent : C.muted }}>
                        {v.status === "disponible" && <Clock3 size={11} />}
                        {v.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
