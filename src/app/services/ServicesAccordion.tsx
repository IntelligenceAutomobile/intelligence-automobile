"use client";

import { useState, useEffect } from "react";

type Item = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  points: string[];
};

const NUM_GRADIENT = {
  backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
      <path d="M5 12.5l4 4L19 6.5" stroke="#5BD89A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Plaque provisoire d'immatriculation. Depuis le 1er janvier 2026 : fond rose,
   caracteres noirs, date de fin de validite empilee a l'extremite droite
   (arrete du 21 novembre 2025). La date vient du serveur pour que le rendu
   serveur et le rendu client coincident. */
function WwPlate({ mm, yy }: { mm: string; yy: string }) {
  return (
    <svg
      viewBox="0 0 268 48"
      role="img"
      aria-label={`Plaque provisoire d'immatriculation WW, valable jusqu'au mois ${mm} de l'annee ${yy}`}
      className="sa-plate"
    >
      <rect x="1" y="1" width="266" height="46" rx="5" fill="#F87FB4" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
      <path d="M6 1h22v46H6a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5z" fill="#003399" />
      <g fill="#FFCC00">
        <circle cx="14.5" cy="8.5" r="1" /><circle cx="17.75" cy="9.37" r="1" />
        <circle cx="20.13" cy="11.75" r="1" /><circle cx="21" cy="15" r="1" />
        <circle cx="20.13" cy="18.25" r="1" /><circle cx="17.75" cy="20.63" r="1" />
        <circle cx="14.5" cy="21.5" r="1" /><circle cx="11.25" cy="20.63" r="1" />
        <circle cx="8.87" cy="18.25" r="1" /><circle cx="8" cy="15" r="1" />
        <circle cx="8.87" cy="11.75" r="1" /><circle cx="11.25" cy="9.37" r="1" />
      </g>
      <text x="14.5" y="38" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700">F</text>
      <text x="128" y="34" textAnchor="middle" fill="#0D0D0D" fontFamily="Arial, Helvetica, sans-serif" fontSize="25" fontWeight="700" letterSpacing="1.5">WW-123-AA</text>
      <line x1="222" y1="8" x2="222" y2="40" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
      <text x="245" y="22" textAnchor="middle" fill="#0D0D0D" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="700">{mm}</text>
      <text x="245" y="38" textAnchor="middle" fill="#0D0D0D" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="700">{yy}</text>
    </svg>
  );
}

export default function ServicesAccordion({ items, plateMonth, plateYear }: { items: Item[]; plateMonth: string; plateYear: string }) {
  const [open, setOpen] = useState(0);

  // Ouvre la bonne fiche quand on arrive avec un #ancre (pastilles du hero) ou qu'on la change.
  useEffect(() => {
    function openFromHash() {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!id) return;
      const idx = items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        setOpen(idx);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [items]);

  return (
    <section id="prestations" style={{ backgroundColor: "#070F1E", padding: "clamp(3rem, 8vh, 6rem) 6vw", scrollMarginTop: "100px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: reduce) {
          .sa-body { transition: none !important; }
          .sa-toggle { transition: none !important; }
        }
        /* Plaque WW : posee sur la ligne du sous-titre, donc visible avant meme
           d'ouvrir le bloc. Repoussee d'environ trois largeurs de plaque vers la
           droite et legerement penchee. Elle revient sous la phrase quand
           l'ecran manque de largeur. */
        .sa-subrow { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; margin-top: 0.3rem; }
        .sa-plate { width: 130px; height: auto; flex-shrink: 0; margin-left: min(390px, 28vw); transform: rotate(-2.6deg); filter: drop-shadow(0 5px 12px rgba(0,0,0,0.5)); }
        @media (max-width: 760px) {
          /* Sur petit ecran la plaque passe au-dessus de la phrase. */
          .sa-subrow { flex-direction: column-reverse; align-items: flex-start; gap: 0.55rem; margin-top: 0.6rem; }
          .sa-plate { margin-left: 0; }
        }
        @media (max-width: 600px) { .sa-plate { width: 115px; } }
      ` }} />
      <div className="max-w-5xl mx-auto" style={{ borderTop: "1px solid #1B3055" }}>
        {items.map((it, i) => {
          const isOpen = open === i;
          const hasPlate = it.id === "demarches";
          return (
            <div
              key={it.id}
              id={it.id}
              style={{
                scrollMarginTop: "120px",
                borderBottom: "1px solid #1B3055",
                borderLeft: isOpen ? "2px solid #6B9FEE" : "2px solid transparent",
                backgroundColor: isOpen ? "rgba(107,159,238,0.04)" : "transparent",
                transition: "background-color 0.35s ease, border-color 0.35s ease",
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "clamp(1rem, 3vw, 2rem)", padding: "clamp(1.3rem, 3vw, 1.9rem) clamp(1rem, 3vw, 2rem)" }}
              >
                <span style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, ...NUM_GRADIENT }}>{it.num}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "clamp(1.2rem, 2.4vw, 1.8rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: isOpen ? "#F0F5FF" : "#C4D8EE", lineHeight: 1.1, transition: "color 0.35s ease" }}>{it.title}</span>
                  {hasPlate ? (
                    <span className="sa-subrow">
                      <span style={{ fontSize: "0.9rem", color: "#8BB8F5", fontWeight: 500 }}>{it.subtitle}</span>
                      <WwPlate mm={plateMonth} yy={plateYear} />
                    </span>
                  ) : (
                    <span style={{ display: "block", fontSize: "0.9rem", color: "#8BB8F5", fontWeight: 500, marginTop: "0.3rem" }}>{it.subtitle}</span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className="sa-toggle"
                  style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%", border: "1px solid rgba(107,159,238,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B9FEE", fontSize: "1.2rem", lineHeight: 1, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.35s ease", backgroundColor: isOpen ? "rgba(107,159,238,0.12)" : "transparent" }}
                >
                  +
                </span>
              </button>
              <div className="sa-body" style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.4s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                  <div style={{ padding: "0 clamp(1rem, 3vw, 2rem) clamp(1.7rem, 3vw, 2.2rem)", paddingLeft: "clamp(3.2rem, 8vw, 5.4rem)", maxWidth: "760px" }}>
                    {it.paragraphs.map((p, j) => (
                      <p key={j} style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "#A8C6F4", margin: j === 0 ? "0" : "0.8rem 0 0" }}>{p}</p>
                    ))}
                    <ul className="sm:grid-cols-2" style={{ listStyle: "none", margin: "1.6rem 0 0", padding: 0, display: "grid", gap: "0.75rem 2rem" }}>
                      {it.points.map((pt) => (
                        <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "13px", color: "#D4E2F4", lineHeight: 1.45 }}>
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
