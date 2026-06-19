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
  descriptionEn?: string;
  features?: string[];
  featuresEn?: string[];
  status?: string;
  isDemo?: boolean;
  // Champs enrichis
  finition?: string;
  couple?: string;
  acceleration?: string;
  tires?: string;
  maintenance?: MaintenanceEntry[];
  dossierUrl?: string;
  layoutVariant?: string;
  factures?: string[];
};

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

  const specs = [
    { label: "Année", value: String(vehicle.year) },
    { label: "Km", value: vehicle.mileage },
    { label: "Carburant", value: vehicle.fuel },
    ...(vehicle.transmission ? [{ label: "Boîte", value: vehicle.transmission }] : []),
    ...(vehicle.power ? [{ label: "Puissance", value: `${vehicle.power} ch` }] : []),
    ...(vehicle.couple ? [{ label: "Couple", value: vehicle.couple }] : []),
    ...(vehicle.acceleration ? [{ label: "0-100", value: vehicle.acceleration }] : []),
    ...(vehicle.color ? [{ label: "Couleur", value: vehicle.color }] : []),
    ...(vehicle.finition ? [{ label: "Finition", value: vehicle.finition }] : []),
    ...(vehicle.tires ? [{ label: "Pneus", value: vehicle.tires }] : []),
    ...(vehicle.origin ? [{ label: "Origine", value: vehicle.origin }] : []),
  ];

  const maintenanceEntries = vehicle.maintenance ?? [];
  const visibleMaintenance = showAllMaintenance
    ? maintenanceEntries
    : maintenanceEntries.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50">

      {/* ── Backdrop ── */}
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

      {/* ── Sheet container ── */}
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

          {/* Pull indicator — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
            <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: "#1B3055" }} />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 flex items-center justify-center"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "rgba(10, 22, 40, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(27,48,85,0.7)",
              color: "#C8D8EE",
              fontSize: "1rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 overscroll-contain">

            {/* Hero image carousel */}
            <div className="relative flex-shrink-0" style={{ height: "260px" }}>
              {img ? (
                <img
                  src={img}
                  alt={`${vehicle.make} ${vehicle.model} ${imgIndex + 1}/${totalImages}`}
                  className="w-full h-full object-cover"
                  style={{ transition: "opacity 0.2s ease" }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: "#070F1E" }}
                >
                  <span className="text-xs tracking-widest uppercase" style={{ color: "#1B3055" }}>
                    Photos à venir
                  </span>
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, #0A1628 0%, rgba(10,22,40,0.3) 55%, transparent 100%)" }}
              />
              {/* Nav arrows — only when multiple images */}
              {totalImages > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                    style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      backgroundColor: "rgba(7,15,30,0.85)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      color: "#F0F5FF", cursor: "pointer", fontSize: "1.3rem",
                    }}
                    aria-label="Photo précédente"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                    style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      backgroundColor: "rgba(7,15,30,0.85)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      color: "#F0F5FF", cursor: "pointer", fontSize: "1.3rem",
                    }}
                    aria-label="Photo suivante"
                  >
                    ›
                  </button>
                  {/* Counter */}
                  <div
                    className="absolute bottom-3 right-4 z-20"
                    style={{
                      backgroundColor: "rgba(7,15,30,0.75)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      borderRadius: "20px",
                      padding: "3px 10px",
                      color: "#C8D8EE",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {imgIndex + 1} / {totalImages}
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="px-6 pb-8 sm:px-8">

              {/* Make + status */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-xs tracking-[0.3em] uppercase font-bold"
                  style={{ color: "#6B9FEE" }}
                >
                  {vehicle.make}
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

              {/* Model + price row */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <h2
                  className="font-black uppercase leading-[0.88]"
                  style={{
                    fontSize: "clamp(1.7rem, 5vw, 2.3rem)",
                    letterSpacing: "-0.025em",
                    color: "#F0F5FF",
                  }}
                >
                  {vehicle.model}
                </h2>
                <div className="text-right flex-shrink-0 pt-0.5">
                  <div
                    className="font-black leading-none"
                    style={{
                      fontSize: "clamp(1.2rem, 3.5vw, 1.7rem)",
                      color: "#F0F5FF",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {vehicle.price}
                  </div>
                  <div
                    className="text-[9px] tracking-widest uppercase mt-1"
                    style={{ color: "#C8D8EE" }}
                  >
                    {vehicle.year}
                  </div>
                </div>
              </div>

              {/* Spec pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center gap-1.5 px-3 py-2"
                    style={{
                      backgroundColor: "#070F1E",
                      borderRadius: "100px",
                      border: "1px solid #1B3055",
                    }}
                  >
                    <span
                      className="text-[9px] tracking-widest uppercase"
                      style={{ color: "#6B9FEE" }}
                    >
                      {spec.label}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: "#F0F5FF" }}
                    >
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {vehicle.description && (
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "#C8D8EE", fontWeight: 400 }}
                >
                  {vehicle.description}
                </p>
              )}

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-6">
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase mb-3"
                    style={{ color: "#6B9FEE" }}
                  >
                    Équipements
                  </p>
                  <div
                    className="grid grid-cols-2 gap-px"
                    style={{ backgroundColor: "#1B3055" }}
                  >
                    {vehicle.features.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs"
                        style={{ backgroundColor: "#070F1E", color: "#C8D8EE" }}
                      >
                        <span style={{ color: "#6B9FEE", flexShrink: 0 }}>—</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique d'entretien */}
              {maintenanceEntries.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-[9px] tracking-[0.3em] uppercase"
                      style={{ color: "#6B9FEE" }}
                    >
                      Entretien
                    </p>
                    <span
                      className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1"
                      style={{
                        backgroundColor: "rgba(107,159,238,0.1)",
                        color: "#6B9FEE",
                        borderRadius: "6px",
                      }}
                    >
                      {maintenanceEntries.length} factures documentées
                    </span>
                  </div>

                  <div style={{ border: "1px solid #1B3055", backgroundColor: "#070F1E" }}>
                    {visibleMaintenance.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-3"
                        style={{ borderTop: i > 0 ? "1px solid #1B3055" : "none" }}
                      >
                        <span
                          className="text-[9px] tracking-wide flex-shrink-0 pt-px"
                          style={{ color: "#6B9FEE", minWidth: "52px" }}
                        >
                          {entry.date}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] leading-snug" style={{ color: "#F0F5FF" }}>
                            {entry.operation}
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: "#1B3055" }}>
                            {entry.km}
                          </p>
                        </div>
                        {entry.amount && entry.amount !== "—" && (
                          <span
                            className="text-[9px] font-bold flex-shrink-0 tabular-nums"
                            style={{ color: "#C8D8EE" }}
                          >
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
                          {showAllMaintenance
                            ? "Réduire"
                            : `+${maintenanceEntries.length - 5} interventions supplémentaires`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div
                className="flex flex-col gap-3 pt-5"
                style={{ borderTop: "1px solid #1B3055" }}
              >
                {isAvailable ? (
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${vehicle.make} ${vehicle.model} ${vehicle.year}`)}`}
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 rounded-full transition-opacity duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                    onClick={onClose}
                  >
                    Demander des informations
                  </Link>
                ) : (
                  <Link
                    href="/contact?service=mandat"
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 rounded-full"
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
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 rounded-full flex items-center justify-center gap-2 transition-opacity duration-200 hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(107,159,238,0.08)",
                      color: "#6B9FEE",
                      border: "1px solid rgba(107,159,238,0.25)",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>↓</span>
                    Télécharger le dossier complet
                  </a>
                )}

                {!vehicle.isDemo && (
                  <Link
                    href={`/vehicules/${vehicle.id}`}
                    className="w-full text-center text-xs font-semibold tracking-widest uppercase py-4 rounded-full transition-colors duration-200"
                    style={{
                      border: "1px solid #1B3055",
                      color: "#C8D8EE",
                    }}
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
