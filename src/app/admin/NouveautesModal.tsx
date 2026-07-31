"use client";

// Fiche « nouveautés » d'un module, ouverte par le « i » de la barre de
// navigation. Le contenu vit dans nouveautes.ts, en français courant.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { T } from "./ui";
import type { Nouveaute } from "./nouveautes";

export default function NouveautesModal({ nouveaute, onClose }: { nouveaute: Nouveaute; onClose: () => void }) {
  // Le « i » vit dans la barre de navigation, qui est collante : une fenêtre
  // posée là reste prisonnière de la colonne et le contenu de la page
  // transparaît au travers. Elle s'affiche donc à la racine de la page.
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!monte) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Nouveautés du module ${nouveaute.titre}`}
    >
      <div
        className="w-full max-w-lg max-h-full overflow-y-auto p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 36, height: 36, backgroundColor: "var(--adm-accent-soft)", border: "1px solid var(--adm-accent-border)", color: T.accent }}
          >
            <Sparkles size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium" style={{ color: T.text }}>
              {nouveaute.titre} · ce qui a changé
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: T.muted }}>
              Mise à jour du {nouveaute.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="adm-act ml-auto flex-shrink-0 inline-flex items-center justify-center w-8 h-8"
            style={{ color: T.muted }}
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm mb-5" style={{ color: T.textDim }}>
          {nouveaute.resume}
        </p>

        <div className="space-y-5">
          {nouveaute.groupes.map((g) => (
            <div key={g.titre}>
              <p className="text-[11px] tracking-[0.16em] uppercase mb-2" style={{ color: T.accent }}>
                {g.titre}
              </p>
              <ul className="space-y-1.5">
                {g.points.map((p) => (
                  <li key={p} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: T.textDim }}>
                    <span aria-hidden="true" style={{ color: T.accent }}>·</span>
                    <span className="min-w-0">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
