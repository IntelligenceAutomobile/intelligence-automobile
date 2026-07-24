"use client";

import { openLienAnnonce } from "@/lib/lien-annonce";

/**
 * Encart posé entre le titre d'une section et son formulaire, pour le client qui
 * arrive avec une annonce déjà repérée (mandat d'import) ou déjà publiée
 * (reprise d'annonce). Volontairement discret : cadre en pointillé sur fond
 * quasi transparent, le détail du service arrivant dans le formulaire une fois
 * le lien collé. Le nom du service est posé sur le trait, comme une étiquette.
 */
export default function AnnonceLine({
  chip,
  title,
  text,
  cta,
  background = "#070F1E",
  style,
}: {
  chip: string;
  title: string;
  text: string;
  cta: string;
  /** Fond de la section : l'étiquette s'y découpe pour interrompre le pointillé. */
  background?: string;
  /** Ajustement des marges selon l'endroit où l'encart est posé. */
  style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{`
        .ia-annonce-line {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          width: 100%;
          margin-top: 42px;
          padding: 20px;
          text-align: left;
          font: inherit;
          cursor: pointer;
          background-color: rgba(107,159,238,0.03);
          border: 1px dashed rgba(107,159,238,0.5);
          transition: background-color 0.18s, border-color 0.18s;
        }
        .ia-annonce-line:hover {
          background-color: rgba(107,159,238,0.09);
          border-style: solid;
          border-color: #6B9FEE;
        }
        .ia-annonce-line:focus-visible {
          outline: 2px solid #6B9FEE;
          outline-offset: 3px;
        }
        /* Le pictogramme reste collé au texte quand celui-ci passe sur
           plusieurs lignes ; seul le rappel d'action passe à la ligne. */
        .ia-annonce-body {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1 1 300px;
        }
        .ia-annonce-chip {
          position: absolute;
          top: -8px;
          left: 17px;
          padding: 0 9px;
          line-height: 16px;
          color: #6B9FEE;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
      `}</style>

      <button type="button" className="ia-annonce-line" style={style} onClick={openLienAnnonce}>
        <span className="ia-annonce-chip" style={{ backgroundColor: background }}>
          {chip}
        </span>

        <span className="ia-annonce-body">
          <svg
            width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#6B9FEE"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }}
          >
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>

          <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#DCE8F8" }}>
            <b style={{ color: "#F0F5FF", fontWeight: 700 }}>{title}</b> {text}
          </span>
        </span>

        <span
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6B9FEE",
            whiteSpace: "nowrap",
          }}
        >
          {cta}
        </span>
      </button>
    </>
  );
}
