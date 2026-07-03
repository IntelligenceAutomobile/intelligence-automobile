"use client";

// ── PAGE DE TEST (jetable) ─────────────────────────────────────────────────
// 5 directions visuelles pour le tableau de bord, commutables par onglets :
// profondeur, reliefs, lisibilité typographique, mise en avant, fond clair.
// Données factices ; aucun impact sur le vrai dashboard.
import { useState, type CSSProperties } from "react";
import { Banknote, BadgeCheck, Handshake, FileText, Users, CalendarClock, Sparkles } from "lucide-react";

type Skin = {
  key: string;
  label: string;
  intent: string;
  pageBg: string;
  pageFx?: string; // background décoratif (halos)
  text: string;
  textDim: string;
  muted: string;
  border: string;
  card: CSSProperties;
  heroCard?: CSSProperties; // carte "Valeur du stock" (mise en avant)
  valueStyle: CSSProperties;
  labelStyle: CSSProperties;
  panelTitleStyle: CSSProperties;
  accent: string;
  chartLine: string;
  topBars?: string[]; // liseré haut par tuile KPI
};

const SKINS: Skin[] = [
  {
    key: "v1",
    label: "V1 · Relief sculpté",
    intent: "Profondeur par ombres portées fortes + arête lumineuse en haut de chaque carte : les blocs « sortent » de la page.",
    pageBg: "#070F1E",
    text: "#F0F5FF", textDim: "#C8D8EE", muted: "#7C92B5", border: "#1B3055",
    card: {
      background: "linear-gradient(180deg, #14264A 0%, #0D1B36 100%)",
      border: "1px solid #23406E",
      boxShadow: "0 18px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
    },
    valueStyle: { fontSize: 28, fontWeight: 300, color: "#F0F5FF" },
    labelStyle: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7C92B5" },
    panelTitleStyle: { fontSize: 14, fontWeight: 500, color: "#F0F5FF" },
    accent: "#6B9FEE",
    chartLine: "#6B9FEE",
  },
  {
    key: "v2",
    label: "V2 · Verre dépoli",
    intent: "Surfaces translucides floutées sur des halos colorés : ambiance high-tech, profondeur par superposition.",
    pageBg: "#050B18",
    pageFx:
      "radial-gradient(700px 340px at 12% -5%, rgba(107,159,238,0.20), transparent 70%), radial-gradient(600px 300px at 88% 8%, rgba(78,209,161,0.10), transparent 70%), radial-gradient(520px 300px at 50% 110%, rgba(199,211,232,0.08), transparent 70%)",
    text: "#F0F5FF", textDim: "#C8D8EE", muted: "#8CA1C4", border: "rgba(199,211,232,0.14)",
    card: {
      backgroundColor: "rgba(17,34,64,0.52)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(199,211,232,0.16)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    },
    valueStyle: { fontSize: 28, fontWeight: 300, color: "#FFFFFF" },
    labelStyle: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8CA1C4" },
    panelTitleStyle: { fontSize: 14, fontWeight: 500, color: "#FFFFFF" },
    accent: "#8BB8F5",
    chartLine: "#8BB8F5",
  },
  {
    key: "v3",
    label: "V3 · Lisibilité éditoriale",
    intent: "Zéro effet : contraste et typographie. Valeurs plus grandes en blanc pur, libellés plus clairs, interlignes généreux.",
    pageBg: "#0B1526",
    text: "#FFFFFF", textDim: "#E7EFFC", muted: "#9FB3D4", border: "#24406E",
    card: { backgroundColor: "#101F3C", border: "1px solid #24406E" },
    valueStyle: { fontSize: 34, fontWeight: 400, color: "#FFFFFF", letterSpacing: "-0.01em" },
    labelStyle: { fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B9C9E6", fontWeight: 600 },
    panelTitleStyle: { fontSize: 16, fontWeight: 600, color: "#FFFFFF" },
    accent: "#7FAAF2",
    chartLine: "#7FAAF2",
  },
  {
    key: "v4",
    label: "V4 · Mise en avant",
    intent: "Hiérarchie assumée : la valeur du stock devient une carte héro qui rayonne, chaque KPI porte un liseré de couleur.",
    pageBg: "#070F1E",
    pageFx: "radial-gradient(640px 300px at 20% -5%, rgba(107,159,238,0.13), transparent 70%)",
    text: "#F0F5FF", textDim: "#C8D8EE", muted: "#7C92B5", border: "#1B3055",
    card: { backgroundColor: "#112240", border: "1px solid #1B3055" },
    heroCard: {
      backgroundColor: "#112240",
      border: "1px solid rgba(107,159,238,0.55)",
      boxShadow: "0 0 46px rgba(107,159,238,0.22), 0 18px 40px rgba(0,0,0,0.45)",
    },
    valueStyle: { fontSize: 28, fontWeight: 300, color: "#F0F5FF" },
    labelStyle: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7C92B5" },
    panelTitleStyle: { fontSize: 14, fontWeight: 500, color: "#F0F5FF" },
    accent: "#6B9FEE",
    chartLine: "#6B9FEE",
    topBars: ["#6B9FEE", "#4ED1A1", "#2FA97D", "#F0B45A", "#C7D3E8"],
  },
  {
    key: "v5",
    label: "V5 · Clair studio",
    intent: "Fond clair : cartes blanches, ombres douces, texte encre. Autre univers, lisibilité maximale de jour.",
    pageBg: "#F2F5FA",
    text: "#16264B", textDim: "#33456F", muted: "#5A6E92", border: "#E3E9F2",
    card: { backgroundColor: "#FFFFFF", border: "1px solid #E3E9F2", boxShadow: "0 10px 28px rgba(23,43,77,0.08)" },
    valueStyle: { fontSize: 28, fontWeight: 400, color: "#16264B" },
    labelStyle: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#5A6E92" },
    panelTitleStyle: { fontSize: 14, fontWeight: 600, color: "#16264B" },
    accent: "#3D6FD8",
    chartLine: "#3D6FD8",
  },
];

const KPIS = [
  { label: "Valeur du stock", value: "120 769 €", hint: "Annonces disponibles", icon: Banknote, hero: true },
  { label: "Disponibles", value: "5", hint: "+2 ce mois", icon: BadgeCheck },
  { label: "Vendus", value: "3", hint: "Au total", icon: Handshake },
  { label: "Devis en cours", value: "1", hint: "1 en attente", icon: FileText },
  { label: "Leads actifs", value: "4", hint: "+4 ce mois", icon: Users },
];

const ACTIVITY = [
  { icon: Sparkles, text: "Fiche créée par l'assistant IA", detail: "BMW M240i xDrive", time: "il y a 1 h" },
  { icon: Users, text: "Nouveau lead — Sophie Laurent", detail: "Recherche SUV hybride", time: "il y a 3 h" },
  { icon: CalendarClock, text: "Essai planifié — Garage Martin", detail: "Vendredi 10 h · TT 40 TFSI", time: "hier" },
];

/* Mini courbe statique */
function MiniArea({ line, border, muted }: { line: string; border: string; muted: string }) {
  return (
    <svg viewBox="0 0 320 120" className="w-full" style={{ display: "block" }}>
      {[30, 60, 90].map((y) => (
        <line key={y} x1="0" x2="320" y1={y} y2={y} stroke={border} strokeWidth="1" opacity="0.5" />
      ))}
      <path d="M8,100 L60,92 L112,96 L164,72 L216,60 L268,38 L312,24 L312,116 L8,116 Z" fill={line} opacity="0.10" />
      <path d="M8,100 L60,92 L112,96 L164,72 L216,60 L268,38 L312,24" fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" />
      <circle cx="312" cy="24" r="4" fill={line} />
      <text x="10" y="114" fontSize="9" fill={muted}>Août</text>
      <text x="290" y="114" fontSize="9" fill={muted}>Juil</text>
    </svg>
  );
}

/* Mini donut statique (couleurs data conservées) */
function MiniDonut({ text, muted }: { text: string; muted: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 100 100" width="96" height="96">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#4B7FD8" strokeWidth="14" strokeDasharray="149 240" transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#C08428" strokeWidth="14" strokeDasharray="30 240" strokeDashoffset="-152" transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#2FA97D" strokeWidth="14" strokeDasharray="52 240" strokeDashoffset="-185" transform="rotate(-90 50 50)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 22, fontWeight: 300, color: text }}>8</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs" style={{ color: muted }}>
        <li className="flex items-center gap-2"><span style={{ width: 8, height: 8, backgroundColor: "#4B7FD8" }} /> Disponibles · 5</li>
        <li className="flex items-center gap-2"><span style={{ width: 8, height: 8, backgroundColor: "#C08428" }} /> Réservés · 0</li>
        <li className="flex items-center gap-2"><span style={{ width: 8, height: 8, backgroundColor: "#2FA97D" }} /> Vendus · 3</li>
      </ul>
    </div>
  );
}

export default function ConceptsDashClient() {
  const [idx, setIdx] = useState(0);
  const s = SKINS[idx];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: s.pageBg }}>
      {s.pageFx && <div className="pointer-events-none fixed inset-0" style={{ background: s.pageFx }} />}

      {/* Sélecteur de variantes */}
      <div
        className="sticky top-0 z-10 px-6 py-3 flex flex-wrap items-center gap-2"
        style={{ backgroundColor: s.key === "v5" ? "rgba(242,245,250,0.9)" : "rgba(7,15,30,0.85)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${s.border}` }}
      >
        {SKINS.map((sk, i) => (
          <button
            key={sk.key}
            type="button"
            onClick={() => setIdx(i)}
            className="text-[11px] tracking-widest uppercase px-3 py-2 transition-colors"
            style={{
              backgroundColor: i === idx ? s.accent : "transparent",
              color: i === idx ? (s.key === "v5" ? "#FFFFFF" : "#070F1E") : s.muted,
              border: `1px solid ${i === idx ? s.accent : s.border}`,
            }}
          >
            {sk.label}
          </button>
        ))}
        <span className="text-[11px] w-full sm:w-auto sm:ml-3" style={{ color: s.muted }}>{s.intent}</span>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="mb-7">
          <div style={{ width: 24, height: 2, background: `linear-gradient(to right, ${s.accent}, transparent)` }} className="mb-3" />
          <h1 style={{ fontSize: 26, fontWeight: s.key === "v3" ? 500 : 300, color: s.text, letterSpacing: "-0.01em" }}>
            Bonjour Fab
            <span className="ml-3 align-middle" style={{ fontSize: 14, color: s.muted }}>vendredi 3 juillet</span>
          </h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
          {KPIS.map((k, i) => {
            const isHero = Boolean(s.heroCard && k.hero);
            return (
              <div
                key={k.label}
                className={`relative p-5 min-w-0 ${isHero ? "col-span-2 xl:col-span-1" : ""}`}
                style={isHero ? s.heroCard : s.card}
              >
                {s.topBars && (
                  <div className="absolute top-0 left-0 right-0" style={{ height: 2, backgroundColor: s.topBars[i] }} />
                )}
                <div className="flex items-start justify-between gap-2">
                  <span style={s.labelStyle}>{k.label}</span>
                  <k.icon size={16} style={{ color: s.muted, opacity: 0.85, flexShrink: 0 }} />
                </div>
                <div className="mt-3 whitespace-nowrap" style={isHero ? { ...s.valueStyle, color: s.accent } : s.valueStyle}>
                  {k.value}
                </div>
                <div className="mt-2 text-[11px]" style={{ color: s.muted }}>{k.hint}</div>
              </div>
            );
          })}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
          <div className="relative p-5 xl:col-span-2" style={s.card}>
            <h3 style={s.panelTitleStyle}>Entrées en stock</h3>
            <p className="text-[11px] mt-0.5 mb-3" style={{ color: s.muted }}>12 derniers mois</p>
            <MiniArea line={s.chartLine} border={s.border} muted={s.muted} />
          </div>
          <div className="relative p-5" style={s.card}>
            <h3 style={s.panelTitleStyle}>Répartition du stock</h3>
            <p className="text-[11px] mt-0.5 mb-4" style={{ color: s.muted }}>État actuel</p>
            <MiniDonut text={s.text} muted={s.muted} />
          </div>
        </div>

        {/* Activité */}
        <div className="relative p-5" style={s.card}>
          <h3 style={s.panelTitleStyle}>Activité récente</h3>
          <ul className="mt-3">
            {ACTIVITY.map((a, i) => (
              <li
                key={i}
                className="flex items-center gap-3.5 py-2.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${s.border}` }}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 flex-shrink-0"
                  style={{ border: `1px solid ${s.border}`, color: s.accent, backgroundColor: s.key === "v5" ? "#F2F6FC" : "rgba(107,159,238,0.07)" }}
                >
                  <a.icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] truncate" style={{ color: s.textDim }}>{a.text}</span>
                  <span className="block text-[11px] truncate" style={{ color: s.muted }}>{a.detail}</span>
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: s.muted }}>{a.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] mt-4" style={{ color: s.muted }}>
          Page de test : données factices, aucune incidence sur le vrai tableau de bord. Dites-moi la variante (ou le mélange) à appliquer.
        </p>
      </div>
    </div>
  );
}
