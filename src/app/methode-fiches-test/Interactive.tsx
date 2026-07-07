"use client";

import { useState } from "react";
import { STEPS, NUM_GRADIENT, Lines, ImportList } from "./shared";

function Tagline({ text }: { text: string }) {
  return (
    <p style={{ display: "flex", gap: "0.6rem", fontSize: "12.5px", fontStyle: "italic", fontWeight: 500, color: "#C6CCD6", margin: "1.2rem 0 0", lineHeight: 1.6 }}>
      <span style={{ color: "#6B9FEE", flexShrink: 0, fontStyle: "normal" }}>→</span>
      <span>{text}</span>
    </p>
  );
}

/* ─── D — Accordéon éditorial ─────────────────────────────────────────────── */
export function MethodeAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-5xl mx-auto" style={{ borderTop: "1px solid #1B3055" }}>
        {STEPS.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.num} style={{ borderBottom: "1px solid #1B3055", borderLeft: isOpen ? "2px solid #6B9FEE" : "2px solid transparent", backgroundColor: isOpen ? "rgba(107,159,238,0.04)" : "transparent", transition: "background-color 0.35s ease, border-color 0.35s ease" }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "clamp(1rem, 3vw, 2rem)", padding: "clamp(1.2rem, 3vw, 1.7rem) clamp(1rem, 3vw, 2rem)" }}
              >
                <span style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, ...NUM_GRADIENT }}>{it.num}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: isOpen ? "#F0F5FF" : "#C4D8EE", lineHeight: 1.12, transition: "color 0.35s ease" }}>{it.title}</span>
                <span aria-hidden="true" style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%", border: "1px solid rgba(107,159,238,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B9FEE", fontSize: "1.2rem", lineHeight: 1, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.35s ease", backgroundColor: isOpen ? "rgba(107,159,238,0.12)" : "transparent" }}>+</span>
              </button>
              <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                  <div style={{ padding: "0 clamp(1rem, 3vw, 2rem) clamp(1.5rem, 3vw, 2rem)", paddingLeft: "clamp(3rem, 8vw, 5rem)", maxWidth: "680px" }}>
                    <Lines text={it.description} size="14px" />
                    {it.num === "04" && <ImportList />}
                    <Tagline text={it.tagline} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── E — Dossier à onglets ────────────────────────────────────────────────── */
export function MethodeTabs() {
  const [active, setActive] = useState(0);
  const it = STEPS[active];
  return (
    <section style={{ backgroundColor: "#040B16", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3.5rem)", alignItems: "stretch" }}>
        {/* Colonne onglets */}
        <div className="flex flex-row lg:flex-col lg:w-[36%]" style={{ gap: "0.5rem", overflowX: "auto" }}>
          {STEPS.map((s, i) => {
            const on = active === i;
            return (
              <button
                key={s.num}
                onClick={() => setActive(i)}
                style={{ flexShrink: 0, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.95rem 1.2rem", borderRadius: "10px", border: on ? "1px solid rgba(107,159,238,0.4)" : "1px solid rgba(107,159,238,0.12)", background: on ? "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)" : "transparent", transition: "border-color 0.3s ease, background 0.3s ease" }}
              >
                <span style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em", flexShrink: 0, ...(on ? NUM_GRADIENT : { color: "#48688F" }) }}>{s.num}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: on ? 900 : 600, textTransform: "uppercase", letterSpacing: "-0.01em", color: on ? "#F0F5FF" : "#8FB0DA", lineHeight: 1.15 }}>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Panneau détail */}
        <div className="lg:w-[64%]" style={{ position: "relative", background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)", border: "1px solid rgba(107,159,238,0.14)", borderRadius: "14px", padding: "clamp(1.8rem, 4vw, 3rem)", overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", top: "-0.15em", right: "0.1em", fontSize: "clamp(6rem, 12vw, 11rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(107,159,238,0.10)", userSelect: "none", pointerEvents: "none" }}>{it.num}</span>
          <div style={{ position: "relative" }}>
            <div style={{ width: "44px", height: "3px", borderRadius: "2px", background: "linear-gradient(to right, #6B9FEE, transparent)", marginBottom: "1.3rem" }} />
            <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", color: "#F0F5FF", lineHeight: 1.04, margin: "0 0 1.4rem" }}>{it.title}</h3>
            <Lines text={it.description} color="#C4D8EE" size="1rem" />
            {it.num === "04" && <ImportList />}
            <Tagline text={it.tagline} />
          </div>
        </div>
      </div>
    </section>
  );
}
