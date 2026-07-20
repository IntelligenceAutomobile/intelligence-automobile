"use client";

import { useState } from "react";

type Step = { num: string; title: string; description: string; tagline: string };

const NUM_GRADIENT = {
  backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/* Surligne en magenta ce qui est entre [[ ]] (plaques WW). */
function Pinked({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[|\]\]/).map((part, j) =>
        j % 2 === 1 ? (
          <span key={j} style={{ color: "#FF14E1", fontWeight: 700 }}>{part}</span>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </>
  );
}

export default function MethodeSteps({ steps, importSteps }: { steps: Step[]; importSteps: string[] }) {
  const [active, setActive] = useState(0);
  const it = steps[active];
  const lines = it.description.split("\n");

  return (
    <div className="flex flex-col lg:flex-row" style={{ gap: "clamp(1rem, 3vw, 2.5rem)", alignItems: "stretch" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ms-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .ms-panel-in { animation: none !important; } }
      ` }} />

      {/* Onglets : pastilles numérotées en ligne sur mobile, liste verticale sur desktop */}
      <div
        className="grid grid-cols-6 lg:flex lg:flex-col lg:w-[36%]"
        style={{ gap: "0.5rem", flexShrink: 0 }}
        role="tablist"
        aria-label="Les étapes de la méthode"
      >
        {steps.map((s, i) => {
          const on = active === i;
          return (
            <button
              key={s.num}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              className="items-center justify-center lg:justify-start"
              style={{
                cursor: "pointer",
                display: "flex",
                gap: "0.85rem",
                padding: "0.9rem 0.75rem",
                borderRadius: "10px",
                textAlign: "left",
                border: on ? "1px solid rgba(107,159,238,0.4)" : "1px solid rgba(107,159,238,0.12)",
                background: on ? "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)" : "transparent",
                transition: "border-color 0.3s ease, background 0.3s ease",
              }}
            >
              <span style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, flexShrink: 0, ...(on ? NUM_GRADIENT : { color: "#48688F" }) }}>{s.num}</span>
              <span className="hidden lg:block" style={{ fontSize: "0.9rem", fontWeight: on ? 900 : 600, textTransform: "uppercase", letterSpacing: "-0.01em", color: on ? "#F0F5FF" : "#8FB0DA", lineHeight: 1.15 }}>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Panneau détail */}
      <div
        className="lg:w-[64%]"
        role="tabpanel"
        style={{ position: "relative", background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)", border: "1px solid rgba(107,159,238,0.14)", borderRadius: "14px", padding: "clamp(1.6rem, 4vw, 3rem)", overflow: "hidden" }}
      >
        <span aria-hidden="true" style={{ position: "absolute", top: 0, right: "0.1em", fontSize: "clamp(5rem, 12vw, 11rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(107,159,238,0.10)", userSelect: "none", pointerEvents: "none" }}>{it.num}</span>
        <div key={active} className="ms-panel-in" style={{ position: "relative", animation: "ms-fade 0.4s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
          <div style={{ width: "44px", height: "3px", borderRadius: "2px", background: "linear-gradient(to right, #6B9FEE, transparent)", marginBottom: "1.2rem" }} />
          <p className="lg:hidden" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B9FEE", margin: "0 0 0.6rem" }}>Étape {it.num} / {String(steps.length).padStart(2, "0")}</p>
          <h3 style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", color: "#F0F5FF", lineHeight: 1.05, margin: "0 0 1.3rem" }}>{it.title}</h3>

          {lines.map((line, i) => (
            <p key={i} style={{ fontSize: "clamp(0.9rem, 1.4vw, 1rem)", lineHeight: 1.7, color: "#C4D8EE", margin: i < lines.length - 1 ? "0 0 0.65rem" : 0 }}>{line}</p>
          ))}

          {it.num === "04" && (
            <ul style={{ listStyle: "none", margin: "1.3rem 0 0", padding: 0, display: "grid", gap: "0.6rem" }}>
              {importSteps.map((item, k) => (
                <li key={k} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", fontSize: "13px", color: "#A8C6F4", lineHeight: 1.55 }}>
                  <span style={{ color: "#6B9FEE", flexShrink: 0, fontWeight: 700, marginTop: "1px" }}>—</span>
                  <span><Pinked text={item} /></span>
                </li>
              ))}
            </ul>
          )}

          <p style={{ display: "flex", gap: "0.6rem", fontSize: "13px", fontStyle: "italic", fontWeight: 500, color: "#C6CCD6", margin: "1.4rem 0 0", lineHeight: 1.6 }}>
            <span style={{ color: "#6B9FEE", flexShrink: 0, fontStyle: "normal" }}>→</span>
            <span>{it.tagline}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
