"use client";

// Éditeur marque blanche de la démonstration /demoprooo.
// Reproduit l'éditeur du back-office (mêmes presets, color picker, champs nom /
// sous-titre) mais l'effet est RÉEL et immédiat : au changement de teinte, on
// surcharge --adm-accent sur .adm-root, ce qui recolore toute la démo en direct
// (sidebar, boutons, graphiques, badges). Les déclinaisons soft / border / light
// se dérivent automatiquement via color-mix (voir admin.css).
//
// Aucune persistance, aucun fetch : « Enregistrer » affiche un toast de démo. La
// teinte choisie reste appliquée tant qu'on navigue dans la démonstration, c'est
// voulu (le layout n'est pas remonté entre les pages).
import { useState } from "react";
import { Palette, RotateCcw, BadgeCheck, ChevronRight, Star } from "lucide-react";
import {
  T, SectionCard, fieldStyle, labelClass,
  btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle,
} from "@/app/admin/ui";
import { useToast } from "@/app/admin/toast";
import DemoActionButton from "../DemoActionButton";
import { DEMO_BRAND, DEMO_REVIEW_LINK } from "../demo";

const DEFAULT_ACCENT = "#6B9FEE";

const PRESETS = [
  { accent: "#6B9FEE", label: "Bleu" },
  { accent: "#E8734A", label: "Orange" },
  { accent: "#4ED1A1", label: "Vert" },
  { accent: "#C89B3C", label: "Or" },
  { accent: "#A78BFA", label: "Violet" },
  { accent: "#EC5E7B", label: "Rose" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function MarqueClient() {
  const toast = useToast();
  const [name, setName] = useState(DEMO_BRAND.name);
  const [tagline, setTagline] = useState(DEMO_BRAND.tagline);
  const [reviewLink, setReviewLink] = useState(DEMO_REVIEW_LINK);

  // Teinte de départ : celle déjà appliquée à la démo, au cas où l'on revient sur
  // cette page après avoir changé de couleur ailleurs. Au premier chargement, la
  // valeur lue vaut le bleu par défaut posé par le layout (pas d'écart d'hydratation).
  const [accent, setAccent] = useState<string>(() => {
    if (typeof document === "undefined") return DEFAULT_ACCENT;
    const root = document.querySelector(".adm-root");
    if (root instanceof HTMLElement) {
      const current = getComputedStyle(root).getPropertyValue("--adm-accent").trim();
      if (HEX.test(current)) return current;
    }
    return DEFAULT_ACCENT;
  });

  // Effet live réel : recolore toute la démonstration.
  function pick(color: string) {
    setAccent(color);
    const root = document.querySelector(".adm-root");
    if (root instanceof HTMLElement) root.style.setProperty("--adm-accent", color);
  }

  function reset() {
    pick(DEFAULT_ACCENT);
    toast.success("Bleu Intelligence Automobile rétabli.");
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Identité">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Nom de l&apos;enseigne</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 text-sm outline-none w-full"
              style={fieldStyle}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Sous-titre</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Back-office, Gestion, DMS…"
              className="px-4 py-3 text-sm outline-none w-full"
              style={fieldStyle}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} style={{ color: T.textDim }}>Couleur d&apos;accent</label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.accent}
                type="button"
                title={p.label}
                onClick={() => pick(p.accent)}
                className="w-9 h-9 transition-transform hover:scale-110"
                style={{
                  backgroundColor: p.accent,
                  border: accent.toLowerCase() === p.accent.toLowerCase() ? "2px solid #F0F5FF" : `1px solid ${T.border}`,
                }}
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(e) => pick(e.target.value)}
              aria-label="Couleur personnalisée"
              className="w-9 h-9 cursor-pointer bg-transparent"
              style={{ border: `1px solid ${T.border}`, padding: 2 }}
            />
            <span className="text-xs ml-1" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>{accent.toUpperCase()}</span>
          </div>
          <p className="text-[12px] mt-3 flex items-start gap-2" style={{ color: T.muted }}>
            <Palette size={14} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
            Le changement s&apos;applique tout de suite à l&apos;ensemble de la démonstration : la colonne de gauche, les boutons, les graphiques et les badges prennent la teinte choisie.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Avis clients">
        <div>
          <label className={labelClass} style={{ color: T.textDim }}>Lien Google « laisser un avis »</label>
          <input
            value={reviewLink}
            onChange={(e) => setReviewLink(e.target.value)}
            placeholder="https://g.page/r/…/review"
            className="px-4 py-3 text-sm outline-none w-full"
            style={fieldStyle}
          />
        </div>
        <p className="text-[12px] flex items-start gap-2" style={{ color: T.muted }}>
          <Star size={14} style={{ color: T.warning, flexShrink: 0, marginTop: 1 }} />
          Ce lien est utilisé par la page « Avis clients » pour inviter vos acheteurs à vous noter sur Google. Récupérez-le dans votre fiche d&apos;établissement Google (bouton « Demander des avis »).
        </p>
      </SectionCard>

      {/* Aperçu : la teinte est déjà appliquée à toute la démo ; l'aperçu reprend
          la même valeur pour montrer sidebar et boutons côte à côte. */}
      <div style={{ ["--adm-accent" as never]: accent }}>
        <SectionCard title="Aperçu en direct">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="p-4 sm:w-56 flex-shrink-0" style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <span className="block text-[12px] tracking-[0.24em] uppercase font-semibold" style={{ color: T.text }}>
                {name || "Votre enseigne"}
              </span>
              <span className="block text-[8px] tracking-[0.38em] uppercase mt-1" style={{ color: "#C7D3E8" }}>
                {tagline || "Back-office"}
              </span>
              <div className="mt-4 space-y-1">
                <span
                  className="relative flex items-center gap-2 px-2 py-1.5 text-[11px]"
                  style={{ color: T.text, backgroundColor: "var(--adm-accent-soft)", fontWeight: 600 }}
                >
                  <span className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: "linear-gradient(to bottom, transparent, var(--adm-accent), transparent)" }} />
                  <Palette size={12} style={{ color: "var(--adm-accent)" }} />
                  Section active
                </span>
                <span className="flex items-center gap-2 px-2 py-1.5 text-[11px]" style={{ color: T.muted }}>
                  <ChevronRight size={12} />
                  Autre section
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                <div style={{ width: 24, height: 2, backgroundColor: "var(--adm-accent)" }} className="mb-3" />
                <div className="text-2xl font-light" style={{ color: "var(--adm-accent)" }}>128 500 €</div>
                <div className="text-[10px] tracking-widest uppercase mt-1" style={{ color: T.textDim }}>Valeur du stock</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={btnPrimaryClass} style={btnPrimaryStyle}>
                  <BadgeCheck size={13} />
                  Bouton principal
                </span>
                <span
                  className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
                  style={{ backgroundColor: "var(--adm-accent-soft)", border: "1px solid var(--adm-accent-border)", color: "var(--adm-accent)" }}
                >
                  Disponible
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
          <BadgeCheck size={13} />
          Enregistrer
        </DemoActionButton>
        <button type="button" onClick={reset} className={btnGhostClass} style={btnGhostStyle}>
          <RotateCcw size={13} />
          Rétablir le bleu Intelligence Automobile
        </button>
      </div>
    </div>
  );
}
