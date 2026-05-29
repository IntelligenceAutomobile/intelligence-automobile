"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type MaintenanceEntry = {
  date: string;
  km: string;
  operation: string;
  amount?: string;
};

export type ModalVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: string;
  fuel: string;
  price: string;
  images: string[];
  transmission?: string;
  color?: string;
  origin?: string;
  power?: number | null;
  description?: string;
  features?: string[];
  status?: string;
  isDemo?: boolean;
  finition?: string;
  couple?: string;
  acceleration?: string;
  tires?: string;
  maintenance?: MaintenanceEntry[];
  dossierUrl?: string;
  layoutVariant?: string;
};

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

function whyCopy(fuel: string, make: string) {
  if (fuel === "Hybride")
    return "Compacte premium à motorisation hybride rechargeable, idéale pour un usage mixte ville/route. Faible consommation, finition sportive S line et polyvalence au quotidien.";
  if (fuel === "Électrique")
    return "Véhicule 100 % électrique premium issu du marché européen, avec une configuration rare et un historique transparent. Autonomie élevée, zéro compromis.";
  return `${make} de référence sur son segment — sélectionnée pour la cohérence de sa configuration et son potentiel de valeur résiduelle. Une acquisition maîtrisée, accompagnée de A à Z.`;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function VehiculeModal({
  vehicle,
  onClose,
}: {
  vehicle: ModalVehicle;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

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
  const firstParagraph = vehicle.description?.split("\n\n")[0] ?? null;

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
            backgroundColor: "#0A1628",
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
              color: "#8AABD4", fontSize: "1rem", cursor: "pointer", lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 overscroll-contain">

            {/* ── PHOTO CAROUSEL ── */}
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
                  <button
                    onClick={prevImg}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                    style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      backgroundColor: "rgba(7,15,30,0.85)",
                      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      color: "#F0F5FF", cursor: "pointer", fontSize: "1.3rem",
                    }}
                    aria-label="Photo précédente"
                  >‹</button>
                  <button
                    onClick={nextImg}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                    style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      backgroundColor: "rgba(7,15,30,0.85)",
                      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      color: "#F0F5FF", cursor: "pointer", fontSize: "1.3rem",
                    }}
                    aria-label="Photo suivante"
                  >›</button>
                  <div
                    className="absolute bottom-3 right-4 z-20"
                    style={{
                      backgroundColor: "rgba(7,15,30,0.75)", backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)", borderRadius: "20px",
                      padding: "3px 10px", color: "#8AABD4", fontSize: "10px", letterSpacing: "0.15em",
                    }}
                  >
                    {imgIndex + 1} / {totalImages}
                  </div>
                </>
              )}
            </div>

            {/* ── CONTENU ── */}
            <div className="px-6 pb-8 sm:px-8 pt-5">

              {/* 1. Marque · Origine · Statut */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                  {vehicle.make}{vehicle.origin ? ` · ${vehicle.origin}` : ""}
                </span>
                {vehicle.status && (
                  <span
                    className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1"
                    style={{
                      backgroundColor: isAvailable ? "rgba(107,159,238,0.1)" : "rgba(27,48,85,0.4)",
                      color: isAvailable ? "#6B9FEE" : "#8AABD4",
                      borderRadius: "6px",
                    }}
                  >
                    {isAvailable ? "Disponible" : "Vendu"}
                  </span>
                )}
              </div>

              {/* 2. Titre hiérarchisé */}
              <h2
                className="font-black uppercase leading-[0.88] mb-1"
                style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", letterSpacing: "-0.025em", color: "#F0F5FF" }}
              >
                {name}
              </h2>
              {subtitle && (
                <p className="mb-5 font-light" style={{ color: "#8AABD4", fontSize: "0.8rem", letterSpacing: "0.03em" }}>
                  {subtitle}
                </p>
              )}

              {/* 3. Encart prix */}
              <div
                className="mb-5 p-4"
                style={{ backgroundColor: "#070F1E", border: "1px solid #1B3055" }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div
                    className="font-black leading-none"
                    style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", color: "#F0F5FF", letterSpacing: "-0.03em" }}
                  >
                    {vehicle.price}
                  </div>
                  <span
                    className="text-[9px] tracking-[0.3em] uppercase flex-shrink-0"
                    style={{ color: "#6B9FEE" }}
                  >
                    {vehicle.year}
                  </span>
                </div>
                {!vehicle.isDemo && (
                  <div className="flex flex-col gap-1 mt-3">
                    {["Garantie 12 mois incluse", "Financement possible", "Démarches administratives prises en charge"].map((g) => (
                      <div key={g} className="flex items-center gap-2">
                        <span style={{ color: "#6B9FEE", fontSize: "9px" }}>✓</span>
                        <span className="text-[10px]" style={{ color: "#8AABD4" }}>{g}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Badges specs primaires */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-1" style={{ backgroundColor: "#1B3055" }}>
                {[
                  { label: "Année", value: String(vehicle.year) },
                  { label: "Kilométrage", value: vehicle.mileage },
                  { label: "Carburant", value: vehicle.fuel },
                  { label: "Boîte", value: vehicle.transmission ?? "—" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center justify-center py-4 px-2 text-center" style={{ backgroundColor: "#0A1628" }}>
                    <span className="text-[8px] tracking-[0.3em] uppercase mb-1" style={{ color: "#6B9FEE" }}>{s.label}</span>
                    <span className="font-black text-sm" style={{ color: "#F0F5FF" }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Specs secondaires discrètes */}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-5 mt-2">
                {[
                  vehicle.power ? `${vehicle.power} ch` : null,
                  vehicle.color ?? null,
                  vehicle.origin ? `Origine ${vehicle.origin}` : null,
                  vehicle.finition ?? null,
                  vehicle.tires ?? null,
                ].filter(Boolean).map((s) => (
                  <span key={s} className="text-[9px] tracking-[0.15em]" style={{ color: "#1B3055" }}>{s}</span>
                ))}
              </div>

              <div className="mb-5" style={{ borderTop: "1px solid #1B3055" }} />

              {/* 5. Points forts */}
              {pointsForts.length > 0 && (
                <div className="mb-5">
                  <p className="text-[9px] tracking-[0.35em] uppercase mb-3" style={{ color: "#8AABD4" }}>
                    Points forts
                  </p>
                  <ul className="flex flex-col gap-2">
                    {pointsForts.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#8AABD4", fontWeight: 300 }}>
                        <span className="flex-shrink-0 mt-0.5" style={{ color: "#6B9FEE" }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description courte */}
              {firstParagraph && (
                <p className="text-xs leading-relaxed mb-5" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  {firstParagraph}
                </p>
              )}

              <div className="mb-5" style={{ borderTop: "1px solid #1B3055" }} />

              {/* 6. Pourquoi ce véhicule ? */}
              <div className="mb-5">
                <p className="text-[9px] tracking-[0.35em] uppercase mb-2" style={{ color: "#8AABD4" }}>
                  Pourquoi ce véhicule ?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  {whyCopy(vehicle.fuel, vehicle.make)}
                </p>
              </div>

              {/* 7. Équipements par catégorie */}
              {categories.length > 0 && (
                <div className="mb-5">
                  <p className="text-[9px] tracking-[0.35em] uppercase mb-4" style={{ color: "#8AABD4" }}>
                    Équipements
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {categories.map((cat) => (
                      <div key={cat.label}>
                        <p
                          className="text-[8px] tracking-[0.3em] uppercase mb-2 pb-1.5"
                          style={{ color: "#6B9FEE", borderBottom: "1px solid #1B3055" }}
                        >
                          {cat.label}
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {cat.items.map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-[10px]" style={{ color: "#8AABD4", fontWeight: 300 }}>
                              <span className="flex-shrink-0 mt-0.5" style={{ color: "#1B3055" }}>—</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique d'entretien */}
              {maintenanceEntries.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#6B9FEE" }}>Entretien</p>
                    <span
                      className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1"
                      style={{ backgroundColor: "rgba(107,159,238,0.1)", color: "#6B9FEE", borderRadius: "6px" }}
                    >
                      {maintenanceEntries.length} factures documentées
                    </span>
                  </div>
                  <div style={{ border: "1px solid #1B3055", backgroundColor: "#070F1E" }}>
                    {visibleMaintenance.map((entry, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i > 0 ? "1px solid #1B3055" : "none" }}>
                        <span className="text-[9px] tracking-wide flex-shrink-0 pt-px" style={{ color: "#6B9FEE", minWidth: "52px" }}>
                          {entry.date}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] leading-snug" style={{ color: "#F0F5FF" }}>{entry.operation}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: "#1B3055" }}>{entry.km}</p>
                        </div>
                        {entry.amount && entry.amount !== "—" && (
                          <span className="text-[9px] font-bold flex-shrink-0 tabular-nums" style={{ color: "#8AABD4" }}>
                            {entry.amount}
                          </span>
                        )}
                      </div>
                    ))}
                    {maintenanceEntries.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllMaintenance((v) => !v)}
                        className="w-full px-4 py-3 text-center transition-colors duration-200"
                        style={{ borderTop: "1px solid #1B3055" }}
                      >
                        <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#6B9FEE" }}>
                          {showAllMaintenance ? "Réduire" : `+${maintenanceEntries.length - 5} interventions supplémentaires`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 9. Branding IA */}
              <div className="flex items-center gap-3 mb-5">
                <div style={{ width: "20px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.5 }} />
                <span className="text-[8px] tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                  Sélection premium — Intelligence Automobile
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-4" style={{ borderTop: "1px solid #1B3055" }}>
                {isAvailable ? (
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${vehicle.make} ${vehicle.model} ${vehicle.year}`)}`}
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 transition-opacity duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                    onClick={onClose}
                  >
                    Demander un essai
                  </Link>
                ) : (
                  <Link
                    href="/contact?service=mandat"
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                    onClick={onClose}
                  >
                    Trouver un véhicule similaire
                  </Link>
                )}

                {vehicle.dossierUrl && (
                  <a
                    href={vehicle.dossierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 flex items-center justify-center gap-2 transition-opacity duration-200 hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(107,159,238,0.08)",
                      color: "#6B9FEE",
                      border: "1px solid rgba(107,159,238,0.25)",
                    }}
                    onClick={onClose}
                  >
                    <span style={{ fontSize: "0.85rem" }}>↓</span>
                    Télécharger le dossier
                  </a>
                )}

                {!vehicle.isDemo && (
                  <Link
                    href={`/vehicules/${vehicle.id}${vehicle.layoutVariant ? `/${vehicle.layoutVariant}` : ""}`}
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 transition-colors duration-200"
                    style={{ border: "1px solid #1B3055", color: "#8AABD4" }}
                    onClick={onClose}
                  >
                    Voir le dossier complet →
                  </Link>
                )}

                <Link
                  href="/"
                  className="w-full text-center text-xs tracking-widest uppercase py-3 transition-colors duration-200"
                  style={{ color: "#1B3055" }}
                  onClick={onClose}
                >
                  ← Accueil
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
