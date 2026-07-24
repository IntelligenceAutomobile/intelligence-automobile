"use client";

import { openLienAnnonce } from "@/lib/lien-annonce";

/**
 * Carte posée dans la colonne de gauche, au-dessus de l'encadré d'information
 * (« Marchés couverts / Marques traitées »). Reprend l'habillage exact de cet
 * encadré (fond bleuté léger, intitulé à pastille, lien souligné en bas) pour
 * se fondre parmi les garanties. Un clic ouvre le champ lien dans le formulaire.
 */
export default function AnnonceCard({
  label,
  title,
  text,
  cta,
}: {
  label: string;
  title: string;
  text: string;
  cta: string;
}) {
  return (
    <>
      <style>{`
        .ia-annonce-card {
          display: block;
          width: 100%;
          text-align: left;
          font: inherit;
          cursor: pointer;
          background-color: rgba(107,159,238,0.06);
          border: 1px solid rgba(107,159,238,0.18);
          padding: 20px;
          transition: background-color 0.18s, border-color 0.18s;
        }
        .ia-annonce-card:hover {
          background-color: rgba(107,159,238,0.11);
          border-color: rgba(107,159,238,0.4);
        }
        .ia-annonce-card:focus-visible {
          outline: 2px solid #6B9FEE;
          outline-offset: 3px;
        }
      `}</style>

      <button type="button" className="ia-annonce-card" onClick={openLienAnnonce}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6B9FEE",
            marginBottom: "11px",
            fontWeight: 600,
          }}
        >
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C6CCD6", flexShrink: 0 }} />
          {label}
        </span>

        <span style={{ display: "block", fontSize: "0.875rem", color: "#DCE8F8", lineHeight: 1.7 }}>
          <b style={{ color: "#F0F5FF", fontWeight: 700 }}>{title}</b> {text}
        </span>

        <span
          style={{
            display: "inline-block",
            marginTop: "15px",
            paddingTop: "14px",
            borderTop: "1px solid rgba(107,159,238,0.22)",
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6B9FEE",
            fontWeight: 700,
          }}
        >
          {cta}
        </span>
      </button>
    </>
  );
}
