"use client";

import { useState } from "react";
import { SERVICES, NUM_GRADIENT, CheckIcon } from "./shared";

/* ─── D — Accordéon éditorial ─────────────────────────────────────────────
   Une seule ligne ouverte à la fois. L'œil est aspiré vers la ligne active. */
export function VariantAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-5xl mx-auto" style={{ borderTop: "1px solid #1B3055" }}>
        {SERVICES.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.id} style={{ borderBottom: "1px solid #1B3055", borderLeft: isOpen ? "2px solid #6B9FEE" : "2px solid transparent", backgroundColor: isOpen ? "rgba(107,159,238,0.04)" : "transparent", transition: "background-color 0.35s ease, border-color 0.35s ease" }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "clamp(1rem, 3vw, 2rem)", padding: "clamp(1.3rem, 3vw, 1.9rem) clamp(1rem, 3vw, 2rem)" }}
              >
                <span style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, ...NUM_GRADIENT }}>{it.num}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "clamp(1.2rem, 2.4vw, 1.8rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: isOpen ? "#F0F5FF" : "#C4D8EE", lineHeight: 1.1, transition: "color 0.35s ease" }}>{it.title}</span>
                  <span style={{ display: "block", fontSize: "0.9rem", color: "#8BB8F5", fontWeight: 500, marginTop: "0.25rem" }}>{it.hook}</span>
                </span>
                <span aria-hidden="true" style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%", border: "1px solid rgba(107,159,238,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B9FEE", fontSize: "1.2rem", lineHeight: 1, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.35s ease", backgroundColor: isOpen ? "rgba(107,159,238,0.12)" : "transparent" }}>+</span>
              </button>
              <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                  <div style={{ padding: "0 clamp(1rem, 3vw, 2rem) clamp(1.6rem, 3vw, 2.2rem)", paddingLeft: "clamp(3.2rem, 8vw, 5.4rem)" }}>
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#A8C6F4", margin: "0 0 1.3rem", maxWidth: "620px" }}>{it.lead}</p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.7rem" }} className="sm:grid-cols-2">
                      {it.points.map((pt) => (
                        <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "13px", color: "#D4E2F4", lineHeight: 1.4 }}>
                          <CheckIcon />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
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

/* ─── E — Dossier à onglets ────────────────────────────────────────────────
   Liste des services à gauche, détail à droite. Façon configurateur premium. */
export function VariantTabs() {
  const [active, setActive] = useState(0);
  const it = SERVICES[active];
  return (
    <section style={{ backgroundColor: "#040B16", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3.5rem)", alignItems: "stretch" }}>
        {/* Colonne onglets */}
        <div className="flex flex-row lg:flex-col lg:w-[34%]" style={{ gap: "0.5rem", overflowX: "auto" }}>
          {SERVICES.map((s, i) => {
            const on = active === i;
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                style={{ flexShrink: 0, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.9rem", padding: "1rem 1.2rem", borderRadius: "10px", border: on ? "1px solid rgba(107,159,238,0.4)" : "1px solid rgba(107,159,238,0.12)", background: on ? "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)" : "transparent", transition: "border-color 0.3s ease, background 0.3s ease" }}
              >
                <span style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em", flexShrink: 0, ...(on ? NUM_GRADIENT : { color: "#48688F" }) }}>{s.num}</span>
                <span style={{ fontSize: "0.95rem", fontWeight: on ? 900 : 600, textTransform: "uppercase", letterSpacing: "-0.01em", color: on ? "#F0F5FF" : "#8FB0DA", whiteSpace: "nowrap" }}>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Panneau détail */}
        <div className="lg:w-[66%]" style={{ position: "relative", background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)", border: "1px solid rgba(107,159,238,0.14)", borderRadius: "14px", padding: "clamp(1.8rem, 4vw, 3rem)", overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", top: "-0.15em", right: "0.1em", fontSize: "clamp(6rem, 12vw, 11rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(107,159,238,0.10)", userSelect: "none", pointerEvents: "none" }}>{it.num}</span>
          <div style={{ position: "relative" }}>
            <div style={{ width: "44px", height: "3px", borderRadius: "2px", background: "linear-gradient(to right, #6B9FEE, transparent)", marginBottom: "1.3rem" }} />
            <h3 style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.6rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", color: "#F0F5FF", lineHeight: 1.02, margin: 0 }}>{it.title}</h3>
            <p style={{ fontSize: "1.05rem", color: "#8BB8F5", fontWeight: 500, margin: "0.7rem 0 0" }}>{it.hook}</p>
            <p style={{ fontSize: "0.98rem", lineHeight: 1.7, color: "#C4D8EE", margin: "1.3rem 0 0", maxWidth: "560px" }}>{it.lead}</p>
            <ul style={{ listStyle: "none", margin: "1.8rem 0 0", padding: 0, display: "grid", gap: "0.85rem" }} className="sm:grid-cols-2">
              {it.points.map((pt) => (
                <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "14px", color: "#D4E2F4", lineHeight: 1.4 }}>
                  <CheckIcon />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
