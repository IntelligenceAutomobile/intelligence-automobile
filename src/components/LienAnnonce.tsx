"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";
import { OPEN_LIEN_EVENT } from "@/lib/lien-annonce";

export type Similaire = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  image: string | null;
};

const fieldStyle: React.CSSProperties = {
  backgroundColor: "#071428",
  border: "1px solid #2A4878",
  color: "#F0F5FF",
  outline: "none",
  width: "100%",
  padding: "14px 16px",
  fontSize: "1rem",
  transition: "border-color 0.2s",
};

/**
 * État du lien d'annonce dans un formulaire public : ouverture du champ,
 * saisie, et véhicules du stock à proposer en regard. La marque et le modèle
 * sont poussés par le formulaire, qui garde ses propres champs.
 */
export function useLienAnnonce() {
  const [ouvert, setOuvert] = useState(false);
  const [lien, setLien] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [resultats, setResultats] = useState<{ cle: string; items: Similaire[] }>({ cle: "", items: [] });
  const aLien = lien.trim().length > 6;

  // Une recherche vaut pour un couple marque/modèle donné : la clé sert à la
  // fois de déclencheur et de garde, pour éviter d'afficher les véhicules
  // d'une marque saisie précédemment.
  const cle = aLien && marque.trim().length >= 2 ? `${marque.trim()}|${modele.trim()}` : "";
  const similaires = cle && resultats.cle === cle ? resultats.items : [];

  const ouvrir = useCallback(() => setOuvert(true), []);

  // L'encart posé plus haut dans la page demande l'ouverture du champ.
  useEffect(() => {
    window.addEventListener(OPEN_LIEN_EVENT, ouvrir);
    return () => window.removeEventListener(OPEN_LIEN_EVENT, ouvrir);
  }, [ouvrir]);

  useEffect(() => {
    if (!cle) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ make: marque.trim(), model: modele.trim() });
      fetch(`/api/vehicules/similaires?${params}`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setResultats({ cle, items: Array.isArray(data?.vehicles) ? data.vehicles : [] }))
        // Recherche abandonnée ou réseau absent : le bandeau reste masqué.
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [cle, marque, modele]);

  const reset = useCallback(() => {
    setOuvert(false);
    setLien("");
    setMarque("");
    setModele("");
    setResultats({ cle: "", items: [] });
  }, []);

  return { ouvert, ouvrir, lien, setLien, setMarque, setModele, similaires, aLien, reset };
}

export type LienAnnonceState = ReturnType<typeof useLienAnnonce>;

/**
 * Ligne repliée « j'ai déjà une annonce », le champ qu'elle ouvre, et le rappel
 * du service une fois le lien saisi. À poser en tête de la carte « véhicule ».
 */
export function LienAnnonceField({
  state,
  labels,
}: {
  state: LienAnnonceState;
  labels: {
    rowLabel: string;
    rowCta: string;
    label: string;
    placeholder: string;
    noteTitle: string;
    noteText: string;
  };
}) {
  const champRef = useRef<HTMLInputElement>(null);
  const ouvert = state.ouvert;

  // Le champ vient d'apparaître : on l'amène sous les yeux et on y place le curseur.
  useEffect(() => {
    if (!ouvert) return;
    champRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    champRef.current?.focus({ preventScroll: true });
  }, [ouvert]);

  return (
    <>
      <style>{`
        .ia-lien-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; width: 100%; padding: 14px 17px;
          text-align: left; font: inherit; cursor: pointer;
          background-color: rgba(107,159,238,0.07);
          border: 1px solid rgba(107,159,238,0.32);
          transition: background-color 0.18s;
        }
        .ia-lien-row:hover { background-color: rgba(107,159,238,0.12); }
        .ia-lien-row:focus-visible { outline: 2px solid #6B9FEE; outline-offset: 3px; }
      `}</style>

      {ouvert ? (
        <div>
          <label
            style={{
              display: "block", fontSize: "11px", letterSpacing: "0.2em",
              textTransform: "uppercase", marginBottom: "12px", color: "#DCE8F8",
            }}
          >
            {labels.label}
          </label>
          <input
            ref={champRef}
            name="lien" type="url" placeholder={labels.placeholder}
            value={state.lien}
            onChange={(e) => state.setLien(e.target.value)}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      ) : (
        <button type="button" className="ia-lien-row" onClick={state.ouvrir}>
          <span style={{ fontSize: "0.875rem", color: "#DCE8F8" }}>{labels.rowLabel}</span>
          <span
            style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#6B9FEE", whiteSpace: "nowrap",
            }}
          >
            {labels.rowCta}
          </span>
        </button>
      )}

      {state.aLien && (
        <div
          style={{
            backgroundColor: "rgba(107,159,238,0.07)",
            border: "1px solid rgba(107,159,238,0.26)",
            borderLeft: "2px solid #6B9FEE",
            padding: "16px 18px",
          }}
        >
          <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "#DCE8F8" }}>
            <span style={{ color: "#F0F5FF", fontWeight: 700 }}>{labels.noteTitle}</span>{" "}
            {labels.noteText}
          </p>
        </div>
      )}
    </>
  );
}

/** Bandeau des véhicules du stock correspondant à ce que le client a saisi. */
export function StockSimilaire({
  items,
  label,
  countOne,
  count,
}: {
  items: Similaire[];
  label: string;
  countOne: string;
  /** Gabarit du décompte, « %n » remplacé par le nombre de fiches. */
  count: string;
}) {
  if (items.length === 0) return null;

  return (
    <div style={{ backgroundColor: "#071428", border: "1px solid #1B3055", padding: "16px" }}>
      <style>{`
        .ia-lien-car {
          display: block; text-decoration: none;
          background-color: #070F1E; border: 1px solid #1B3055;
          transition: border-color 0.18s;
        }
        .ia-lien-car:hover { border-color: #6B9FEE; }
      `}</style>

      <p
        className="flex items-center justify-between gap-3 flex-wrap"
        style={{
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#6B9FEE", marginBottom: "14px",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#9FB7D8", letterSpacing: "0.1em" }}>
          {items.length === 1 ? countOne : count.replace("%n", String(items.length))}
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map((v) => (
          // Nouvel onglet : la fiche s'ouvre sans faire perdre le formulaire en cours.
          <a key={v.id} className="ia-lien-car" href={`/vehicules/${v.id}`} target="_blank" rel="noopener">
            {v.image ? (
              <img
                src={v.image} alt=""
                style={{
                  display: "block", width: "100%", aspectRatio: "4 / 3",
                  objectFit: "cover", borderBottom: "1px solid #1B3055",
                }}
              />
            ) : (
              <span
                style={{
                  display: "block", width: "100%", aspectRatio: "4 / 3",
                  background: "linear-gradient(135deg, #14243F, #0B1930)",
                  borderBottom: "1px solid #1B3055",
                }}
              />
            )}
            <span style={{ display: "block", padding: "10px 11px" }}>
              <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.3, color: "#F0F5FF" }}>
                {v.make} {v.model}
              </span>
              <span style={{ display: "block", fontSize: "0.72rem", color: "#9FB7D8", marginTop: "4px" }}>
                {v.year} · {formatNumber(v.mileage)} km
              </span>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#6B9FEE", marginTop: "6px" }}>
                {formatNumber(v.price)} €
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
