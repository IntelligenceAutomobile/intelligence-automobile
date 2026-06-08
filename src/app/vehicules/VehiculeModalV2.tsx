"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ModalVehicle } from "./VehiculeModal";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTitle(make: string, model: string, power?: number | null) {
  const dispMatch = model.match(/(\d+\.\d+)/);
  if (!dispMatch) return { name: `${make} ${model}`, subtitle: null };

  const dispIdx = model.indexOf(dispMatch[0]);
  const namePart = model.slice(0, dispIdx).trim();
  const rest = model.slice(dispIdx);

  const parts = rest
    .split(/\s+(?=S\s+line\b|Competition\b|S\s*tronic\b|quattro\b|DSG\b|Ambition\b|Prestige\b)/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (power && parts.length > 0) parts[0] = `${parts[0]} ${power} ch`;

  return { name: `${make} ${namePart}`, subtitle: parts.join(" — ") };
}

const CATEGORIES: { label: string; keys: string[] }[] = [
  { label: "Motorisation", keys: ["hybride", "électrique", "chargeur", "boîte", "norme", "consommation", "phev", "e-tron", "quattro", "s tronic", "dsg"] },
  { label: "Design & S line", keys: ["pack s line", "jante", "bouclier", "bas de caisse", "feux", "led", "spoiler", "diffuseur", "échappement", "carbone", "phare"] },
  { label: "Confort & Techno", keys: ["siège", "volant", "climat", "démarrage", "rétroviseur", "navigation", "bluetooth", "régulateur", "caméra", "keyless", "virtual", "mmi", "b&o", "bang", "éclairage", "vitres", "connectivité"] },
  { label: "Sécurité", keys: ["airbag", "esp", "asr", "stationnement", "isofix", "frein"] },
];

function categorize(features: string[]) {
  const used = new Set<string>();
  const result: { label: string; items: string[] }[] = [];
  for (const cat of CATEGORIES) {
    const matched = features.filter(
      (f) => !used.has(f) && cat.keys.some((k) => f.toLowerCase().includes(k))
    );
    if (matched.length) {
      matched.forEach((f) => used.add(f));
      result.push({ label: cat.label, items: matched });
    }
  }
  const rest = features.filter((f) => !used.has(f));
  if (rest.length) result.push({ label: "Autres", items: rest });
  return result;
}

function renderDesc(text: string) {
  const parts = text.split(/([\d][\d\s,]*(?:ch système|ch|km\/h|km|L\/100\s*km|%|rapports))/g);
  return parts.map((part, i) =>
    /^\d/.test(part)
      ? <span key={i} style={{ color: "#6B9FEE", fontWeight: 600 }}>{part}</span>
      : part
  );
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function VehiculeModalV2({
  vehicle,
  onClose,
}: {
  vehicle: ModalVehicle;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [facturesOpen, setFacturesOpen] = useState(false);
  const [facturesUnlocked, setFacturesUnlocked] = useState(false);
  const [facturesPassword, setFacturesPassword] = useState("");
  const [facturesError, setFacturesError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const toggleCategory = (label: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const scrollY = window.scrollY;
    document.body.style.cssText = `position:fixed;top:-${scrollY}px;left:0;right:0;overflow-y:scroll;`;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.cssText = "";
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const factures = vehicle.factures ?? [];

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  { e.stopPropagation(); setLightboxIndex((i) => i !== null ? (i - 1 + factures.length) % factures.length : null); }
      if (e.key === "ArrowRight") { e.stopPropagation(); setLightboxIndex((i) => i !== null ? (i + 1) % factures.length : null); }
      if (e.key === "Escape")     { e.stopPropagation(); setLightboxIndex(null); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lightboxIndex, factures.length]);

  const images = vehicle.images ?? [];
  const totalImages = images.length;
  const img = images[imgIndex] ?? null;
  const isAvailable = vehicle.status !== "vendu";

  const prevImg = () => setImgIndex((i) => (i - 1 + totalImages) % totalImages);
  const nextImg = () => setImgIndex((i) => (i + 1) % totalImages);

  const features = vehicle.features ?? [];
  const pointsForts = features.slice(0, 6);
  const categories = categorize(features);
  const { name, subtitle } = parseTitle(vehicle.make, vehicle.model, vehicle.power);

  const descriptionParagraphs = (vehicle.description?.split("\n\n") ?? [])
    .filter(p =>
      !p.toLowerCase().includes("accident") &&
      !p.toLowerCase().includes("contrôle technique") &&
      !p.toLowerCase().includes("intelligence automobile prend en charge") &&
      !p.toLowerCase().includes("essai disponible")
    )
    .slice(0, 2);

  const etatFacts = (vehicle.description?.split("\n\n") ?? [])
    .find(p => p.toLowerCase().includes("accident") || p.toLowerCase().includes("contrôle technique"))
    ?.split(/\.\s+/)
    .map(s => s.replace(/\.$/, "").trim())
    .filter(Boolean) ?? [];

  const maintenanceEntries = vehicle.maintenance ?? [];
  const visibleMaintenance = showAllMaintenance
    ? maintenanceEntries
    : maintenanceEntries.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50">

      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(2, 8, 18, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.28s ease",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-6"
        onClick={onClose}
      >
        <div
          className="relative w-full sm:max-w-[640px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: "#0D1E35",
            maxHeight: "92svh",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(48px)",
            transition: "opacity 0.32s ease, transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pull indicator mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
            <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: "#1B3055" }} />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 flex items-center justify-center"
            style={{
              width: "34px", height: "34px", borderRadius: "50%",
              backgroundColor: "rgba(10, 22, 40, 0.85)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(27,48,85,0.7)",
              color: "#C8D8EE", fontSize: "1rem", cursor: "pointer", lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* ── SCROLLABLE BODY ── */}
          <div className="overflow-y-auto flex-1 overscroll-contain">

            {/* PHOTO CAROUSEL */}
            <div className="relative flex-shrink-0" style={{ height: "260px" }}>
              {img ? (
                <img
                  src={img}
                  alt={`${vehicle.make} ${vehicle.model} ${imgIndex + 1}/${totalImages}`}
                  className="w-full h-full object-cover"
                  style={{ transition: "opacity 0.2s ease" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#070F1E" }}>
                  <span className="text-xs tracking-widest uppercase" style={{ color: "#1B3055" }}>Photos à venir</span>
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, #0A1628 0%, rgba(10,22,40,0.3) 55%, transparent 100%)" }}
              />
              {totalImages > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center" style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(7,15,30,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(107,159,238,0.3)", color: "#F0F5FF", cursor: "pointer", fontSize: "1.3rem" }} aria-label="Photo précédente">‹</button>
                  <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center" style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(7,15,30,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(107,159,238,0.3)", color: "#F0F5FF", cursor: "pointer", fontSize: "1.3rem" }} aria-label="Photo suivante">›</button>
                  <div className="absolute bottom-3 right-4 z-20" style={{ backgroundColor: "rgba(7,15,30,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: "20px", padding: "3px 10px", color: "#C8D8EE", fontSize: "10px", letterSpacing: "0.15em" }}>
                    {imgIndex + 1} / {totalImages}
                  </div>
                </>
              )}
            </div>

            {/* CONTENU */}
            <div className="px-6 pb-6 sm:px-8 pt-5">

              {/* Marque · Origine · Statut */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                  {vehicle.make}{vehicle.origin ? ` · ${vehicle.origin}` : ""}
                </span>
                {vehicle.status && (
                  <span
                    className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1"
                    style={{
                      backgroundColor: isAvailable ? "rgba(107,159,238,0.1)" : "rgba(27,48,85,0.4)",
                      color: isAvailable ? "#6B9FEE" : "#C8D8EE",
                      borderRadius: "6px",
                    }}
                  >
                    {isAvailable ? "Disponible" : "Vendu"}
                  </span>
                )}
              </div>

              {/* Titre */}
              <h2 className="font-black uppercase leading-[0.88] mb-1" style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", letterSpacing: "-0.025em", color: "#F0F5FF" }}>
                {name}
              </h2>
              {subtitle && (
                <p className="mb-5 font-light" style={{ color: "#A8C4F0", fontSize: "0.8rem", letterSpacing: "0.03em" }}>
                  {subtitle}
                </p>
              )}

              {/* Bloc prix */}
              {!vehicle.isDemo && (
                <div className="flex items-center justify-center gap-2 px-4 py-2" style={{ backgroundColor: "rgba(107,159,238,0.06)", border: "1px solid rgba(107,159,238,0.18)", borderBottom: "none" }}>
                  <span style={{ color: "#6B9FEE", fontSize: "9px" }}>✓</span>
                  <span className="text-[10px] tracking-wide" style={{ color: "#A8C4F0" }}>Garantie 12 mois incluse</span>
                </div>
              )}
              <div style={{ backgroundColor: "#070F1E", border: "1px solid #1B3055" }}>
                <div className="font-black leading-none text-center py-5 px-4" style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", color: "#F0F5FF", letterSpacing: "-0.03em" }}>
                  {vehicle.price}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ backgroundColor: "#1B3055", borderTop: "1px solid #1B3055" }}>
                  {[
                    { label: "Année", value: String(vehicle.year) },
                    { label: "Kilométrage", value: vehicle.mileage },
                    { label: "Carburant", value: vehicle.fuel },
                    { label: "Boîte", value: vehicle.transmission ?? "—" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center justify-center py-3 px-2 text-center" style={{ backgroundColor: "#0D1F3A" }}>
                      <span className="text-[8px] tracking-[0.3em] uppercase mb-1" style={{ color: "#6B9FEE" }}>{s.label}</span>
                      <span className="font-black text-sm" style={{ color: "#F0F5FF" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                {(vehicle.power || vehicle.color || vehicle.origin) && (
                  <div className="grid gap-px" style={{ backgroundColor: "#1B3055", borderTop: "1px solid #1B3055", gridTemplateColumns: `repeat(${[vehicle.power, vehicle.color, vehicle.origin].filter(Boolean).length}, 1fr)` }}>
                    {[
                      vehicle.power ? { label: "Puissance", value: `${vehicle.power} ch` } : null,
                      vehicle.color ? { label: "Couleur", value: vehicle.color } : null,
                      vehicle.origin ? { label: "Origine", value: vehicle.origin } : null,
                    ].filter(Boolean).map((s) => (
                      <div key={s!.label} className="flex flex-col items-center justify-center py-3 px-2 text-center" style={{ backgroundColor: "#0D1F3A" }}>
                        <span className="text-[8px] tracking-[0.3em] uppercase mb-1" style={{ color: "#6B9FEE" }}>{s!.label}</span>
                        <span className="font-black text-sm" style={{ color: "#F0F5FF" }}>{s!.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!vehicle.isDemo && (
                <div className="flex flex-col gap-1.5 px-4 py-2.5 mb-6" style={{ backgroundColor: "rgba(107,159,238,0.06)", border: "1px solid rgba(107,159,238,0.18)", borderTop: "none" }}>
                  {["Financement possible", "Démarches administratives prises en charge"].map((g) => (
                    <div key={g} className="flex items-center gap-2">
                      <span style={{ color: "#6B9FEE", fontSize: "9px" }}>✓</span>
                      <span className="text-[10px] tracking-wide" style={{ color: "#A8C4F0" }}>{g}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6" style={{ borderTop: "1px solid #1B3055" }} />

              {/* Points forts */}
              {pointsForts.length > 0 && (
                <div className="mb-6">
                  <p className="text-[9px] tracking-[0.35em] uppercase mb-3 text-center" style={{ color: "#C8D8EE" }}>Points forts</p>
                  <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: "#1B3055" }}>
                    {pointsForts.map((f) => (
                      <div
                        key={f}
                        className="flex items-start gap-2 px-3 py-3.5 text-[11px]"
                        style={{ backgroundColor: "#0A1628", color: "#D4E2F4", fontWeight: 400 }}
                      >
                        <span className="flex-shrink-0 mt-0.5" style={{ color: "#6B9FEE", fontSize: "6px" }}>●</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description condensée */}
              {descriptionParagraphs.length > 0 && (
                <div className="mb-6 flex flex-col gap-3">
                  <p className="text-xs leading-loose" style={{ color: "#C8D8EE", fontWeight: 400 }}>
                    {renderDesc(descriptionParagraphs[0])}
                  </p>
                  {descriptionParagraphs.length > 1 && (
                    <>
                      {showFullDesc && (
                        <p className="text-xs leading-loose" style={{ color: "#C8D8EE", fontWeight: 400 }}>
                          {renderDesc(descriptionParagraphs[1])}
                        </p>
                      )}
                      <button
                        onClick={() => setShowFullDesc((v) => !v)}
                        className="flex items-center gap-1 text-[10px] tracking-wide transition-opacity hover:opacity-80 self-start"
                        style={{ color: "#6B9FEE" }}
                      >
                        {showFullDesc ? "Réduire ↑" : "Lire plus ↓"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* État & historique — badges */}
              {etatFacts.length > 0 && (
                <div className="mb-6">
                  <p className="text-[9px] tracking-[0.35em] uppercase mb-3 text-center" style={{ color: "#C8D8EE" }}>État &amp; historique</p>
                  <div className="flex flex-wrap gap-2">
                    {etatFacts.map((fact, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px]"
                        style={{ backgroundColor: "rgba(107,159,238,0.07)", border: "1px solid rgba(107,159,238,0.18)", color: "#C8D8EE", borderRadius: "4px", fontWeight: 400 }}
                      >
                        <span style={{ color: "#6B9FEE" }}>✓</span>
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6" style={{ borderTop: "1px solid #1B3055" }} />

              {/* Équipements — accordéon */}
              {categories.length > 0 && (
                <div className="mb-6">
                  <p className="text-[9px] tracking-[0.35em] uppercase mb-3 text-center" style={{ color: "#C8D8EE" }}>Équipements</p>
                  <div className="flex flex-col gap-2">
                    {categories.map((cat) => (
                      <div key={cat.label}>
                        <button
                          onClick={() => toggleCategory(cat.label)}
                          className="w-full flex items-center justify-between px-4 py-3 transition-opacity hover:opacity-80"
                          style={{ backgroundColor: "#070F1E", border: "1px solid #1B3055", borderLeft: "3px solid #6B9FEE" }}
                        >
                          <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                            {cat.label}
                          </span>
                          <span
                            className="text-sm transition-transform duration-200"
                            style={{ color: "#6B9FEE", display: "inline-block", transform: openCategories.has(cat.label) ? "rotate(90deg)" : "rotate(0deg)" }}
                          >
                            ›
                          </span>
                        </button>
                        {openCategories.has(cat.label) && (
                          <div style={{ border: "1px solid #1B3055", borderTop: "none" }}>
                            {Array.from({ length: Math.ceil(cat.items.length / 2) }, (_, i) => (
                              <div key={i} className="grid grid-cols-2" style={{ borderTop: "1px solid #1B3055", backgroundColor: "#0A1628" }}>
                                {[0, 1].map((j) => {
                                  const item = cat.items[i * 2 + j];
                                  return (
                                    <div key={j} className="flex items-start gap-2 px-4 py-3.5 text-[11px]" style={{ color: item ? "#D4E2F4" : "transparent", fontWeight: 400, borderLeft: j === 1 ? "1px solid #1B3055" : "none" }}>
                                      <span className="flex-shrink-0 mt-0.5" style={{ color: "#6B9FEE" }}>—</span>
                                      {item ?? ""}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique d'entretien */}
              {maintenanceEntries.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-center" style={{ color: "#C8D8EE" }}>Entretien</p>
                    <span className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1" style={{ backgroundColor: "rgba(107,159,238,0.1)", color: "#6B9FEE", borderRadius: "6px" }}>
                      {maintenanceEntries.length} interventions
                    </span>
                  </div>
                  <div style={{ border: "1px solid #1B3055", backgroundColor: "#070F1E" }}>
                    {visibleMaintenance.map((entry, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i > 0 ? "1px solid #1B3055" : "none" }}>
                        <span className="text-[9px] tracking-wide flex-shrink-0 pt-px" style={{ color: "#6B9FEE", minWidth: "52px" }}>{entry.date}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] leading-snug" style={{ color: "#F0F5FF" }}>{entry.operation}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: "#C8D8EE" }}>{entry.km}</p>
                        </div>
                        {entry.amount && entry.amount !== "—" && (
                          <span className="text-[9px] font-bold flex-shrink-0 tabular-nums" style={{ color: "#6B9FEE" }}>{entry.amount}</span>
                        )}
                      </div>
                    ))}
                    {maintenanceEntries.length > 5 && (
                      <button type="button" onClick={() => setShowAllMaintenance((v) => !v)} className="w-full px-4 py-3 text-center" style={{ borderTop: "1px solid #1B3055" }}>
                        <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#6B9FEE" }}>
                          {showAllMaintenance ? "Réduire" : `+${maintenanceEntries.length - 5} interventions`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Factures & Documents */}
              {factures.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setFacturesOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "#070F1E", border: "1px solid #1B3055", borderLeft: "3px solid #6B9FEE" }}
                  >
                    <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                      Factures &amp; Documents
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[8px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5"
                        style={{ backgroundColor: "rgba(107,159,238,0.1)", color: "#6B9FEE", borderRadius: "4px" }}
                      >
                        {factures.length}
                      </span>
                      <span
                        className="text-sm transition-transform duration-200"
                        style={{ color: "#6B9FEE", display: "inline-block", transform: facturesOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      >
                        ›
                      </span>
                    </div>
                  </button>
                  {facturesOpen && (
                    <div style={{ border: "1px solid #1B3055", borderTop: "none" }}>
                      {!facturesUnlocked ? (
                        <div className="px-5 py-5" style={{ backgroundColor: "#070F1E" }}>
                          <p className="text-xs mb-4" style={{ color: "#C8D8EE" }}>
                            Contactez-nous pour obtenir le code d&apos;accès aux documents.
                          </p>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (facturesPassword === "Password123!") {
                                setFacturesUnlocked(true);
                                setFacturesError(false);
                              } else {
                                setFacturesError(true);
                                setFacturesPassword("");
                              }
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="password"
                              value={facturesPassword}
                              onChange={(e) => { setFacturesPassword(e.target.value); setFacturesError(false); }}
                              placeholder="Mot de passe"
                              className="flex-1 px-3 py-2.5 border text-xs outline-none"
                              style={{
                                backgroundColor: "#112240",
                                borderColor: facturesError ? "#FF6B35" : "#1B3055",
                                color: "#F0F5FF",
                              }}
                            />
                            <button
                              type="submit"
                              className="px-4 py-2.5 text-[9px] font-semibold tracking-widest uppercase"
                              style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                            >
                              Accéder
                            </button>
                          </form>
                          {facturesError && (
                            <p className="text-[10px] mt-2" style={{ color: "#FF6B35" }}>
                              Mot de passe incorrect
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          className="grid grid-cols-2 gap-px"
                          style={{ backgroundColor: "#1B3055" }}
                        >
                          {factures.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setLightboxIndex(i)}
                              className="relative overflow-hidden group"
                              style={{ aspectRatio: "4/3", backgroundColor: "#070F1E" }}
                            >
                              <img
                                src={src}
                                alt={`Document ${i + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                style={{ opacity: 0.85 }}
                              />
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                                style={{ backgroundColor: "rgba(107,159,238,0.12)" }}
                              >
                                <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#F0F5FF" }}>Agrandir</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Branding */}
              <div className="flex items-center justify-center gap-3 py-4">
                <div style={{ width: "20px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.5 }} />
                <span className="text-[10px] font-semibold tracking-[0.4em] uppercase" style={{ color: "#A8C4F0" }}>
                  Sélection premium — Intelligence Automobile
                </span>
                <div style={{ width: "20px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.5 }} />
              </div>

            </div>
          </div>

          {/* ── CTA STICKY ── */}
          <div
            className="flex-shrink-0 px-6 pt-4 pb-5 sm:px-8"
            style={{ borderTop: "1px solid #1B3055", backgroundColor: "#0D1E35" }}
          >
            {isAvailable ? (
              <Link
                href={`/contact?vehicule=${encodeURIComponent(`${vehicle.make} ${vehicle.model} ${vehicle.year}`)}&sujet=reservation`}
                className="block w-full text-center text-xs font-bold tracking-[0.2em] uppercase py-4 transition-all duration-300 hover:-translate-y-px hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                onClick={onClose}
              >
                Réserver ce véhicule
              </Link>
            ) : (
              <Link
                href="/contact?service=mandat"
                className="block w-full text-center text-xs font-bold tracking-[0.2em] uppercase py-4"
                style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                onClick={onClose}
              >
                Trouver un véhicule similaire
              </Link>
            )}
            {!vehicle.isDemo && (
              <div className="flex gap-3 mt-3">
                {vehicle.dossierUrl && (
                  <a
                    href={vehicle.dossierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs font-semibold tracking-wide uppercase py-3 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                    style={{ color: "#6B9FEE", border: "1px solid rgba(107,159,238,0.25)" }}
                    onClick={onClose}
                  >
                    <span>↓</span> Dossier
                  </a>
                )}
                <Link
                  href={`/vehicules/${vehicle.id}${vehicle.layoutVariant ? `/${vehicle.layoutVariant}` : ""}`}
                  className="flex-1 text-center text-xs font-semibold tracking-wide uppercase py-3 transition-opacity hover:opacity-80"
                  style={{ border: "1px solid #1B3055", color: "#C8D8EE" }}
                  onClick={onClose}
                >
                  Fiche complète →
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── LIGHTBOX FACTURES ── */}
      {lightboxIndex !== null && factures.length > 0 && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(2,8,18,0.97)" }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Fermer */}
          <button
            className="absolute top-4 right-4 flex items-center justify-center"
            style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(10,22,40,0.9)", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "1.2rem", cursor: "pointer", lineHeight: 1 }}
            onClick={() => setLightboxIndex(null)}
          >
            ×
          </button>

          {/* Compteur */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] uppercase"
            style={{ color: "#C8D8EE" }}
          >
            {lightboxIndex + 1} / {factures.length}
          </div>

          {/* Image + flèches collées */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {factures.length > 1 && (
              <button
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(10,22,40,0.85)", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
                onClick={() => setLightboxIndex((i) => i !== null ? (i - 1 + factures.length) % factures.length : null)}
                aria-label="Précédent"
              >
                ‹
              </button>
            )}
            <img
              src={factures[lightboxIndex]}
              alt={`Document ${lightboxIndex + 1}`}
              className="object-contain"
              style={{ maxHeight: "82vh", maxWidth: "calc(80vw - 112px)" }}
            />
            {factures.length > 1 && (
              <button
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(10,22,40,0.85)", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
                onClick={() => setLightboxIndex((i) => i !== null ? (i + 1) % factures.length : null)}
                aria-label="Suivant"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
