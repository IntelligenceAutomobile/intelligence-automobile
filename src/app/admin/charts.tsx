"use client";

// Graphiques SVG maison du back-office (courbe, donut, barres, sparkline, KPI).
// Couleurs de remplissage validées daltonisme (mode sombre, surface #112240) :
// bleu #4B7FD8 · ambre #C08428 · vert #2FA97D — ΔE min 18 (cible ≥ 12).
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight, ArrowDownRight, Banknote, BadgeCheck, Clock3, Handshake,
  FileText, Table2, ChartArea, type LucideIcon,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { T, CHART } from "./ui";

const SILVER_BORDER = "rgba(199,211,232,0.28)";

/* Format de valeur sérialisable (les fonctions ne passent pas la frontière
   serveur → client) : euro, ou unité avec pluriel automatique. */
export type ValueFormat = { kind?: "euro"; unit?: string };

function fmt(v: number, f?: ValueFormat): string {
  const base = formatNumber(v);
  if (f?.kind === "euro") return `${base} €`;
  if (f?.unit) {
    const plural = v > 1 && !f.unit.endsWith("s") ? "s" : "";
    return `${base} ${f.unit}${plural}`;
  }
  return base;
}

/* ── Compteur animé ── */
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

/* ── Sparkline : trait discret, dernier point accentué ── */
export function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 84, h = 28, pad = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const y = (v: number) => (max === min ? h / 2 : pad + (h - 2 * pad) * (1 - (v - min) / (max - min)));
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} aria-hidden>
      <path d={d} fill="none" stroke={CHART.spark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="4" fill={T.accent} stroke={T.surface} strokeWidth="2" />
    </svg>
  );
}

/* ── Tuile KPI animée ── */
const KPI_ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  "badge-check": BadgeCheck,
  clock: Clock3,
  handshake: Handshake,
  "file-text": FileText,
};

export function KpiTile({
  label, value, euro = false, delta, hint, spark, icon, index = 0,
}: {
  label: string;
  value: number;
  euro?: boolean;
  delta?: { value: number; suffix?: string; label: string } | null;
  hint?: string;
  spark?: number[];
  icon: keyof typeof KPI_ICONS;
  index?: number;
}) {
  const n = useCountUp(value);
  const Icon = KPI_ICONS[icon];
  const up = (delta?.value ?? 0) >= 0;
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className="adm-card adm-enter p-5 min-w-0"
      style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: `${80 + index * 90}ms` }}
    >
      <div className="adm-hairline" />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>{label}</span>
        <Icon size={16} style={{ color: "#C7D3E8", opacity: 0.75, flexShrink: 0 }} />
      </div>
      <div className="text-[28px] leading-none font-light whitespace-nowrap mt-3" style={{ color: T.text }}>
        {euro ? `${formatNumber(n)} €` : formatNumber(n)}
      </div>
      <div className="mt-2.5 min-h-[16px] relative z-[1]">
        {delta && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: up ? T.success : T.danger }}>
            <DeltaIcon size={13} />
            {up ? "+" : ""}{delta.value}{delta.suffix ?? ""}
            <span className="font-normal" style={{ color: T.muted }}>{delta.label}</span>
          </span>
        )}
        {hint && <span className="text-[11px]" style={{ color: T.muted }}>{hint}</span>}
      </div>
      {spark && spark.length > 1 && (
        <div className="absolute right-5 bottom-4 pointer-events-none" style={{ opacity: 0.9 }}>
          <Sparkline data={spark} />
        </div>
      )}
    </div>
  );
}

/* ── Échelle : ticks arrondis ── */
function niceTicks(maxValue: number, count = 4): number[] {
  const max = Math.max(1, maxValue);
  const rawStep = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = step; v <= max + step * 0.5; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/* ── Courbe en aires : une série, crosshair + tooltip + vue tableau ── */
export function AreaChart({
  title, subtitle, data, labels, format,
}: {
  title: string;
  subtitle?: string;
  data: number[];
  labels: string[];
  format?: ValueFormat;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const W = 660, H = 240, PL = 46, PR = 18, PT = 16, PB = 30;
  const ticks = useMemo(() => niceTicks(Math.max(...data)), [data]);
  const maxY = ticks[ticks.length - 1] * 1.08;
  const x = (i: number) => PL + (i * (W - PL - PR)) / Math.max(1, data.length - 1);
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / maxY);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - PB} L${x(0).toFixed(1)},${H - PB} Z`;
  const last = data.length - 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-medium" style={{ color: T.text }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-2.5 py-1.5 transition-colors"
          style={{ border: `1px solid ${T.border}`, color: T.muted }}
        >
          {asTable ? <ChartArea size={13} /> : <Table2 size={13} />}
          {asTable ? "Graphique" : "Tableau"}
        </button>
      </div>

      {asTable ? (
        <table className="w-full mt-3 text-sm" style={{ color: T.textDim }}>
          <thead>
            <tr style={{ color: T.muted }}>
              <th className="text-left font-normal text-[11px] uppercase tracking-widest py-2" style={{ borderBottom: `1px solid ${T.border}` }}>Mois</th>
              <th className="text-right font-normal text-[11px] uppercase tracking-widest py-2" style={{ borderBottom: `1px solid ${T.border}` }}>Valeur</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
            {data.map((v, i) => (
              <tr key={i}>
                <td className="py-1.5" style={{ borderBottom: `1px solid ${T.surfaceAlt}` }}>{labels[i]}</td>
                <td className="py-1.5 text-right" style={{ borderBottom: `1px solid ${T.surfaceAlt}` }}>{fmt(v, format)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
            <defs>
              <linearGradient id="adm-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.accent} stopOpacity="0.16" />
                <stop offset="100%" stopColor={T.accent} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={T.border} strokeWidth="1" opacity="0.55" />
                <text x={PL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={T.muted}>{formatNumber(t)}</text>
              </g>
            ))}
            {labels.map((m, i) => (
              (data.length <= 7 || i % 2 === 0) && (
                <text key={m + i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill={T.muted}>{m}</text>
              )
            ))}
            <path d={area} fill="url(#adm-area)" />
            <path d={line} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {hover !== null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="#C7D3E8" strokeWidth="1" opacity="0.4" />
                <circle cx={x(hover)} cy={y(data[hover])} r="4.5" fill={T.accent} stroke={T.surface} strokeWidth="2" />
              </>
            )}
            <circle cx={x(last)} cy={y(data[last])} r="4" fill={T.accent} stroke={T.surface} strokeWidth="2" />
            <text x={x(last) - 8} y={y(data[last]) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill={T.textDim}>
              {fmt(data[last], format)}
            </text>
            <rect
              x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} fill="transparent"
              onMouseMove={(e) => {
                const r = (e.target as SVGRectElement).getBoundingClientRect();
                const px = ((e.clientX - r.left) / r.width) * (W - PL - PR) + PL;
                let best = 0, bd = Infinity;
                for (let i = 0; i < data.length; i++) {
                  const dd = Math.abs(x(i) - px);
                  if (dd < bd) { bd = dd; best = i; }
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
                backgroundColor: T.surfaceAlt,
                border: `1px solid ${SILVER_BORDER}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              }}
            >
              <div className="text-sm font-semibold whitespace-nowrap" style={{ color: T.text }}>{fmt(data[hover], format)}</div>
              <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: T.muted }}>{labels[hover]}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Donut : angles calculés hors rendu ── */
export type DonutSegment = { label: string; value: number; color: string };

function donutAngles(segments: DonutSegment[], gap: number) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let acc = -Math.PI / 2;
  return segments.map((seg) => {
    const span = (seg.value / total) * Math.PI * 2;
    const range = { a0: acc + gap / 2, a1: acc + Math.max(gap, span) - gap / 2 };
    acc += span;
    return range;
  });
}

export function Donut({ title, subtitle, segments, centerLabel }: {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = segments.reduce((s, d) => s + d.value, 0);
  const R = 74, r = 52, CX = 100, CY = 100;
  const angles = useMemo(() => donutAngles(segments, 0.035), [segments]);

  return (
    <div>
      <h3 className="text-sm font-medium" style={{ color: T.text }}>{title}</h3>
      {subtitle && <p className="text-[11px] mt-0.5 mb-2" style={{ color: T.muted }}>{subtitle}</p>}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 200 200" width="164" height="164">
            {segments.map((s, i) => {
              if (s.value === 0) return null;
              const { a0, a1 } = angles[i];
              const Ro = R + (hover === i ? 4 : 0);
              const p = (a: number, rad: number) => `${CX + rad * Math.cos(a)},${CY + rad * Math.sin(a)}`;
              const largeArc = a1 - a0 > Math.PI ? 1 : 0;
              const path = `M${p(a0, Ro)} A${Ro},${Ro} 0 ${largeArc} 1 ${p(a1, Ro)} L${p(a1, r)} A${r},${r} 0 ${largeArc} 0 ${p(a0, r)} Z`;
              return (
                <path
                  key={s.label}
                  d={path}
                  fill={s.color}
                  opacity={hover === null || hover === i ? 1 : 0.35}
                  style={{ transition: "opacity 0.18s ease" }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[26px] font-light leading-none" style={{ color: T.text }}>
              {hover === null ? total : segments[hover].value}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] mt-1 px-2 text-center" style={{ color: T.muted }}>
              {hover === null ? centerLabel : segments[hover].label}
            </span>
          </div>
        </div>
        <ul className="space-y-2.5 min-w-0 flex-1">
          {segments.map((d, i) => (
            <li
              key={d.label}
              className="flex items-center gap-2.5 cursor-default"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ opacity: hover === null || hover === i ? 1 : 0.5, transition: "opacity 0.18s ease" }}
            >
              <span style={{ width: 10, height: 10, backgroundColor: d.color, flexShrink: 0 }} />
              <span className="text-xs" style={{ color: T.textDim }}>{d.label}</span>
              <span className="text-xs font-semibold ml-auto pl-3" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Barres : une série, valeur du maximum étiquetée ── */
export function Bars({ title, subtitle, data, labels, format }: {
  title: string;
  subtitle?: string;
  data: number[];
  labels: string[];
  format?: ValueFormat;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 190, PB = 26, PT = 18;
  const max = Math.max(...data, 1);
  const bw = 22;
  const slot = W / data.length;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / (max + 1));
  const maxIdx = data.indexOf(max);

  return (
    <div>
      <h3 className="text-sm font-medium" style={{ color: T.text }}>{title}</h3>
      {subtitle && <p className="text-[11px] mt-0.5 mb-2" style={{ color: T.muted }}>{subtitle}</p>}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
          <line x1="0" x2={W} y1={H - PB} y2={H - PB} stroke={T.border} strokeWidth="1" />
          {data.map((v, i) => {
            const bx = i * slot + (slot - bw) / 2;
            const by = y(v);
            const bh = H - PB - by;
            const rr = Math.min(4, bh);
            return (
              <g key={i}>
                {v > 0 && (
                  <path
                    d={`M${bx},${H - PB} L${bx},${by + rr} Q${bx},${by} ${bx + rr},${by} L${bx + bw - rr},${by} Q${bx + bw},${by} ${bx + bw},${by + rr} L${bx + bw},${H - PB} Z`}
                    fill={CHART.blue}
                    style={{ filter: hover === i ? "brightness(1.25)" : "none", transition: "filter 0.15s ease" }}
                  />
                )}
                {i === maxIdx && v > 0 && (
                  <text x={bx + bw / 2} y={by - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill={T.textDim}>{v}</text>
                )}
                <text x={bx + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={T.muted}>{labels[i]}</text>
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
            className="absolute pointer-events-none px-3 py-1.5 whitespace-nowrap"
            style={{
              left: `${((hover + 0.5) / data.length) * 100}%`,
              top: 0,
              transform: "translateX(-50%)",
              backgroundColor: T.surfaceAlt,
              border: `1px solid ${SILVER_BORDER}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}
          >
            <span className="text-sm font-semibold" style={{ color: T.text }}>{fmt(data[hover], format)}</span>
            <span className="text-[10px] uppercase tracking-widest ml-2" style={{ color: T.muted }}>{labels[hover]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
