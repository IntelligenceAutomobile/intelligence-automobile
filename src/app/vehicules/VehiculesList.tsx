"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useCallback, useState } from "react";
import { useLocale } from "@/i18n/context";
import VehiculeModal, { type ModalVehicle } from "./VehiculeModal";
import VehiculeModalV2 from "./VehiculeModalV2";

// ── Enrichissements pour véhicules réels (maintenance, dossierUrl) ───────────
// Keyed par vehicle.id — appliqués dans toModal()
const VEHICLE_ENRICHMENTS: Record<string, Partial<ModalVehicle>> = {
  "audi-tt-mk3-sline-2014": {
    factures: [
      "/audi-tt-mk3-sline-2014/factures/batterie-invoice-1.jpg",
      "/audi-tt-mk3-sline-2014/factures/batterie-invoice-2.jpg",
      "/audi-tt-mk3-sline-2014/factures/ct-belge.jpg",
      "/audi-tt-mk3-sline-2014/factures/carnet-entretien.jpg",
      "/audi-tt-mk3-sline-2014/factures/car-pass.jpg",
      "/audi-tt-mk3-sline-2014/factures/carte-grise-belge.jpg",
      "/audi-tt-mk3-sline-2014/factures/demande-immat.jpg",
      "/audi-tt-mk3-sline-2014/factures/coc-audi.jpg",
    ],
    maintenance: [
      { date: "Fév. 2026", km: "~147 000 km", operation: "Bougies neuves, service Haldex quattro, remplacement pneus Michelin" },
      { date: "Mars 2025", km: "—", operation: "Batterie VARTA A6 AGM neuve + montage en atelier", amount: "301,89 €" },
    ],
  },
  "audi-tt-mk2-sline-2010": {
    dossierUrl: "/Audi%20TT%203/Dossier_Audi_TT_Intelligence_Automobile.pdf",
    maintenance: [
      { date: "Janv. 2026", km: "151 042 km", operation: "Contrôle technique FAVORABLE — valide 28/01/2028 (Autosur Tremblay · PV N° 26049227)" },
      { date: "Juil. 2025", km: "≈ 151 000 km", operation: "Disques AV+AR neufs, plaquettes AV+AR neuves, filtres air et habitacle", amount: "276,96 €" },
      { date: "Nov. 2024", km: "145 762 km", operation: "Entretien intermédiaire huile 5W40 + diagnostic électronique complet (Midas Paris 17)", amount: "109,00 €" },
      { date: "Août 2024", km: "140 168 km", operation: "Contrôle technique FAVORABLE (Securitest Mandelieu · PV N° 24073569)" },
      { date: "Déc. 2023", km: "134 073 km", operation: "Kit distribution, courroie multi-V, bougies, plaquettes AV (ByMyCar Vaucluse)", amount: "355,72 €" },
      { date: "Déc. 2023", km: "138 653 km", operation: "Vidange moteur, filtres" },
      { date: "Avr. 2021", km: "134 073 km", operation: "Vidange moteur, filtres, contrôles (La Chaume Carpentras)" },
      { date: "Août 2019", km: "130 874 km", operation: "Inspection, vidange, filtres air et habitacle, Haldex (Link Gengenbach GmbH DE)" },
      { date: "Sept. 2018", km: "125 334 km", operation: "Inspection, vidange, filtres, Zahnriemen (ACTU GmbH Hannover DE)" },
      { date: "Août 2017", km: "115 176 km", operation: "Inspection, vidange moteur 5W30LL, filtres (Audi Wolfsburg DE)" },
      { date: "Août 2016", km: "105 885 km", operation: "Vidange moteur, huile 5W30LL (Audi Wolfsburg DE)" },
      { date: "Avr. 2015", km: "90 010 km", operation: "Inspection + vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Juil. 2014", km: "78 735 km", operation: "Inspection + vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Août 2013", km: "61 225 km", operation: "Vidange moteur, filtres, contrôles (Glinicke Bad Oeynhausen DE)" },
      { date: "Mai 2013", km: "55 432 km", operation: "Vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Oct. 2012", km: "41 930 km", operation: "Vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Mai 2012", km: "30 234 km", operation: "Vidange moteur, filtres (Glinicke Bad Oeynhausen DE)" },
      { date: "Oct. 2011", km: "21 215 km", operation: "Inspection Audi, vidange moteur, remplacement filtres (Glinicke Bad Oeynhausen DE)" },
    ],
  },
};

// ── Types ────────────────────────────────────────────────────────────────────
type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  transmission: string;
  color: string;
  images: string;
  features: string;
  featuresEn: string;
  status: string;
  origin: string;
  power?: number | null;
  description?: string;
  descriptionEn?: string;
  isPublished: boolean;
};

type Filters = {
  make?: string;
  model?: string;
  fuel?: string;
  transmission?: string;
  maxPrice?: number;
  maxMileage?: number;
  minYear?: number;
  status?: string;
};


// Convertit un véhicule DB → format modal (priceOnRequest vient de t, passé en param)
function toModal(v: Vehicle, priceOnRequest: string): ModalVehicle {
  const images = (() => { try { return JSON.parse(v.images) as string[]; } catch { return []; } })();
  const features = (() => { try { return JSON.parse(v.features) as string[]; } catch { return []; } })();
  const featuresEn = (() => { try { return JSON.parse(v.featuresEn) as string[]; } catch { return []; } })();
  const enrichment = VEHICLE_ENRICHMENTS[v.id] ?? {};
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: `${v.mileage.toLocaleString("fr-FR")} km`,
    fuel: v.fuel,
    price: v.price > 0 ? `${v.price.toLocaleString("fr-FR")} €` : priceOnRequest,
    images,
    transmission: v.transmission,
    color: v.color,
    origin: v.origin,
    power: v.power ?? undefined,
    description: v.description,
    descriptionEn: v.descriptionEn,
    features,
    featuresEn,
    status: v.status,
    layoutVariant: "v2",
    ...enrichment,
  };
}

// ── Composant carte ──────────────────────────────────────────────────────────
function VehicleCard({
  images,
  make,
  year,
  model,
  mileage,
  fuel,
  transmission,
  power,
  color,
  origin,
  price,
  isSold,
  isHidden,
  onClick,
}: {
  images: string[];
  make: string;
  year: number;
  model: string;
  mileage: string;
  fuel: string;
  transmission?: string | null;
  power?: number | null;
  color?: string | null;
  origin?: string | null;
  price: string;
  isSold?: boolean;
  isHidden?: boolean;
  onClick: () => void;
}) {
  const { t } = useLocale();
  const tv = t.vehicles;
  const [imgIdx, setImgIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const total = images.length;
  const img = images[imgIdx] ?? null;

  const fuelLabel = tv.fuelOptions.find((o) => o.value === fuel)?.label ?? fuel;
  const transLabel = transmission ? (tv.transmissionOptions.find((o) => o.value === transmission)?.label ?? transmission) : null;

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + total) % total);
  };
  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % total);
  };
  const toggleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const specs = [
    { label: tv.specModel, value: model },
    { label: tv.specYear, value: String(year) },
    { label: tv.specMileage, value: mileage },
    { label: tv.specFuel, value: fuelLabel },
    transLabel ? { label: tv.specGearbox, value: transLabel } : null,
    power ? { label: tv.specPower, value: `${power} ch` } : null,
    color ? { label: tv.specColor, value: color } : null,
    origin ? { label: tv.specOrigin, value: origin } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <div
      className="group block w-full text-left"
      style={{ backgroundColor: "#070F1E" }}
    >
      {/* ── IMAGE ── */}
      <div className="relative overflow-hidden cursor-pointer" style={{ height: "420px" }} onClick={onClick}>
        {img ? (
          <img
            src={img}
            alt={`${make} ${model}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ opacity: isSold ? 0.35 : 0.72 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#0D1A2D" }}>
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#1B3055" }}>{tv.photoComingSoon}</span>
          </div>
        )}

        {/* Gradient léger au repos, disparaît au hover */}
        <div
          className="absolute inset-0 transition-opacity duration-400 group-hover:opacity-0"
          style={{ background: "linear-gradient(to top, rgba(7,15,30,0.45) 0%, rgba(7,15,30,0.15) 40%, transparent 70%)" }}
        />

        {/* Badge masqué (admin only) */}
        {isHidden && (
          <div className="absolute top-5 right-5 z-30">
            <span className="text-[9px] tracking-[0.25em] uppercase px-3 py-1.5" style={{ backgroundColor: "#FF6B35", color: "#070F1E" }}>{tv.hidden}</span>
          </div>
        )}

        {/* Overlay vendu */}
        {isSold && (
          <>
            <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(135deg, rgba(7,15,30,0.7) 0%, rgba(7,15,30,0.4) 100%)" }} />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
              <span className="font-black uppercase" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#F0F5FF", letterSpacing: "0.45em", textShadow: "0 2px 40px rgba(0,0,0,0.8)" }}>
                {tv.soldBadge}
              </span>
              <div style={{ width: "40px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.6 }} />
              <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                {tv.soldBy}
              </span>
            </div>
          </>
        )}

        {/* Carousel */}
        {total > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "rgba(7,15,30,0.82)", border: "1px solid rgba(107,159,238,0.3)", color: "#F0F5FF", fontSize: "1.15rem", lineHeight: 1 }}
              aria-label="Photo précédente"
            >‹</button>
            <button
              onClick={nextImg}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "rgba(7,15,30,0.82)", border: "1px solid rgba(107,159,238,0.3)", color: "#F0F5FF", fontSize: "1.15rem", lineHeight: 1 }}
              aria-label="Photo suivante"
            >›</button>
            <div className="absolute bottom-3 right-4 z-20" style={{ backgroundColor: "rgba(7,15,30,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: "20px", padding: "2px 9px", color: "#C8D8EE", fontSize: "9px", letterSpacing: "0.15em" }}>
              {imgIdx + 1}/{total}
            </div>
          </>
        )}

        {/* Pill "Voir le détail" — toujours visible */}
        <div
          className="absolute inset-x-0 flex justify-center z-20 pointer-events-none"
          style={{ bottom: "1.5rem" }}
        >
          <div style={{ backgroundColor: "rgba(240,245,255,0.1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "100px", padding: "10px 22px", border: "1px solid rgba(240,245,255,0.12)" }}>
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#F0F5FF" }}>{tv.viewDetail}</span>
          </div>
        </div>
      </div>

      {/* ── BARRE UNIFIÉE : MARQUE · STATUT · CARACTÉRISTIQUES · PRIX ── */}
      <button
        type="button"
        onClick={toggleInfo}
        className="w-full flex items-center justify-between px-5 py-3 gap-3 transition-opacity duration-200 hover:opacity-80"
        style={{ borderTop: "1px solid #1B3055", borderBottom: "1px solid #1B3055", backgroundColor: "#070F1E" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] tracking-[0.3em] uppercase font-bold flex-shrink-0" style={{ color: "#6B9FEE" }}>{make}</span>
          <span
            className="text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 font-semibold flex-shrink-0"
            style={{
              color: isSold ? "#C8D8EE" : "#6B9FEE",
              border: `1px solid ${isSold ? "#1B3055" : "rgba(107,159,238,0.3)"}`,
              backgroundColor: isSold ? "transparent" : "rgba(107,159,238,0.08)",
            }}
          >
            {isSold ? tv.soldBadge : tv.availableBadge}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#6B9FEE" }}>
            {tv.specs}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className="transition-transform duration-300 flex-shrink-0"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", color: "#6B9FEE" }}
          >
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-black text-base flex-shrink-0" style={{ color: "#F0F5FF" }}>{price}</span>
      </button>

      {/* ── GRILLE DÉROULANTE ── */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: expanded ? "400px" : "0",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="grid grid-cols-4 gap-px" style={{ backgroundColor: "#1B3055" }}>
          {specs.map((s) => (
            <div
              key={s.label}
              className="flex flex-col px-4 py-4"
              style={{ backgroundColor: "#0A1628" }}
            >
              <span className="text-[8px] tracking-[0.2em] uppercase mb-2" style={{ color: "#6B9FEE" }}>{s.label}</span>
              <span className="font-bold text-[13px] leading-tight" style={{ color: "#F0F5FF" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modèles par marque (pour le filtre secondaire "Modèle") ──────────────────
const AUDI_MODELS = [
  "A1", "A3", "A4", "A5", "A6", "A7", "A8",
  "S3", "S4", "S5", "S6", "S7", "S8",
  "RS3", "RS4", "RS5", "RS6", "RS7",
  "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron",
  "SQ2", "SQ5", "SQ7", "SQ8",
  "RS Q3", "RS Q8",
  "TT", "TTS", "TT RS",
  "R8",
  "e-tron GT", "RS e-tron GT",
  "80", "90", "100", "200", "Coupé", "Cabriolet", "Allroad", "V8",
];

const MODELS_BY_MAKE: Record<string, string[]> = {
  Audi: AUDI_MODELS,
};

// ── Marques sport/luxe pré-chargées ─────────────────────────────────────────
const SPORT_MAKES = [
  "Alfa Romeo",
  "Alpine",
  "Aston Martin",
  "Audi",
  "BMW",
  "Ferrari",
  "Honda",
  "Jaguar",
  "Lamborghini",
  "Lotus",
  "Maserati",
  "McLaren",
  "Mercedes-AMG",
  "Nissan",
  "Porsche",
  "Renault",
  "Toyota",
];

// ── Composant principal ──────────────────────────────────────────────────────
export default function VehiculesList({
  vehicules,
  makes,
  modelsByMake = {},
  filters,
  isAdmin = false,
}: {
  vehicules: Vehicle[];
  makes: string[];
  modelsByMake?: Record<string, string[]>;
  filters: Filters;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const tv = t.vehicles;
  const [selected, setSelected] = useState<ModalVehicle | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      if (filters.make && key !== "make") params.set("make", filters.make);
      if (filters.model && key !== "model" && key !== "make") params.set("model", filters.model);
      if (filters.fuel && key !== "fuel") params.set("fuel", filters.fuel);
      if (filters.transmission && key !== "transmission") params.set("transmission", filters.transmission);
      if (filters.maxPrice && key !== "maxPrice") params.set("maxPrice", String(filters.maxPrice));
      if (filters.maxMileage && key !== "maxMileage") params.set("maxMileage", String(filters.maxMileage));
      if (filters.minYear && key !== "minYear") params.set("minYear", String(filters.minYear));
      if (filters.status && key !== "status") params.set("status", filters.status);
      if (value) params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pathname, router]
  );

  const fuelOpts = tv.fuelOptions;
  const transOpts = tv.transmissionOptions;
  const currentStatus = filters.status ?? "tous";
  const hasActiveFilters =
    filters.make || filters.model || filters.fuel || filters.transmission ||
    filters.maxPrice || filters.maxMileage || filters.minYear;
  const hasMoreFiltersActive = filters.fuel || filters.transmission || filters.maxMileage || filters.minYear;

  const dbMakesSet = new Set(makes);
  const extraMakes = SPORT_MAKES.filter((m) => !dbMakesSet.has(m)).sort((a, b) => a.localeCompare(b));

  const availableModels = filters.make
    ? Array.from(new Set([...(MODELS_BY_MAKE[filters.make] ?? []), ...(modelsByMake[filters.make] ?? [])])).sort((a, b) => a.localeCompare(b))
    : [];

  return (
    <section style={{ backgroundColor: "#070F1E" }}>

      {/* ── FILTRES ── */}
      <div
        className="border-b sticky top-[64px] z-20 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(7,15,30,0.95)", borderColor: "#1B3055" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-4 pt-5 pb-3 overflow-x-auto">

            <div className="flex gap-2 flex-shrink-0">
              {[
                { key: "disponible", label: tv.available },
                { key: "vendu", label: tv.sold },
                { key: "tous", label: tv.all },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => updateFilter("status", s.key === "tous" ? "" : s.key)}
                  className="text-[11px] tracking-[0.3em] uppercase px-7 py-3.5 transition-all duration-200 flex-shrink-0 hover:-translate-y-px hover:opacity-90"
                  style={{
                    background: currentStatus === s.key ? "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)" : "rgba(107,159,238,0.04)",
                    color: currentStatus === s.key ? "#070F1E" : "#C8D8EE",
                    border: `1px solid ${currentStatus === s.key ? "transparent" : "rgba(107,159,238,0.2)"}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: "#1B3055" }} />

            <select
              value={filters.make ?? ""}
              onChange={(e) => updateFilter("make", e.target.value)}
              className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
              style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.make ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
            >
              <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.allMakes}</option>
              {makes.length > 0 && (
                <optgroup label={tv.inStock} style={{ backgroundColor: "#070F1E" }}>
                  {makes.map((m) => (
                    <option key={m} value={m} style={{ backgroundColor: "#070F1E" }}>{m}</option>
                  ))}
                </optgroup>
              )}
              {extraMakes.length > 0 && (
                <optgroup label={tv.otherMakes} style={{ backgroundColor: "#070F1E" }}>
                  {extraMakes.map((m) => (
                    <option key={m} value={m} style={{ backgroundColor: "#070F1E" }}>{m}</option>
                  ))}
                </optgroup>
              )}
            </select>

            {filters.make && availableModels.length > 0 && (
              <select
                value={filters.model ?? ""}
                onChange={(e) => updateFilter("model", e.target.value)}
                className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
                style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.model ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
              >
                <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.allModels} {filters.make}</option>
                {availableModels.map((m) => (
                  <option key={m} value={m} style={{ backgroundColor: "#070F1E" }}>{m}</option>
                ))}
              </select>
            )}

            <select
              value={filters.maxPrice ?? ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
              style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.maxPrice ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
            >
              <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.maxBudget}</option>
              {[15000, 20000, 30000, 40000, 50000, 60000, 70000, 80000].map((p) => (
                <option key={p} value={p} style={{ backgroundColor: "#070F1E" }}>
                  {p.toLocaleString("fr-FR")} €
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <>
                <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: "#1B3055" }} />
                <Link href="/vehicules" className="text-[9px] tracking-[0.25em] uppercase flex-shrink-0" style={{ color: "#6B9FEE" }}>
                  {tv.clearFilters}
                </Link>
              </>
            )}
          </div>

          {/* ── LIGNE 2 : FILTRES SUPPLÉMENTAIRES ── */}
          <div className="flex items-center">
            <button
              onClick={() => setShowMoreFilters((v) => !v)}
              className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase transition-all duration-200 hover:opacity-70 py-1.5"
              style={{ color: hasMoreFiltersActive || showMoreFilters ? "#F0F5FF" : "#6B9FEE" }}
            >
              <svg
                width="11" height="11" viewBox="0 0 14 14" fill="none"
                className="transition-transform duration-300 flex-shrink-0"
                style={{ transform: showMoreFilters ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {showMoreFilters ? tv.lessFilters : tv.moreFilters}
              {hasMoreFiltersActive && (
                <span className="text-[8px] px-1.5 py-0.5 ml-1" style={{ backgroundColor: "rgba(107,159,238,0.15)", color: "#6B9FEE" }}>
                  {[filters.fuel, filters.transmission, filters.maxMileage, filters.minYear].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* ── FILTRES SECONDAIRES ── */}
          <div
            style={{
              overflow: "hidden",
              maxHeight: showMoreFilters ? "120px" : "0",
              transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="flex items-center gap-4 pb-5 overflow-x-auto">
              <select
                value={filters.fuel ?? ""}
                onChange={(e) => updateFilter("fuel", e.target.value)}
                className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
                style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.fuel ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
              >
                <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.fuelFilter}</option>
                {fuelOpts.map((o) => (
                  <option key={o.value} value={o.value} style={{ backgroundColor: "#070F1E" }}>{o.label}</option>
                ))}
              </select>

              <select
                value={filters.transmission ?? ""}
                onChange={(e) => updateFilter("transmission", e.target.value)}
                className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
                style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.transmission ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
              >
                <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.transmissionFilter}</option>
                {transOpts.map((o) => (
                  <option key={o.value} value={o.value} style={{ backgroundColor: "#070F1E" }}>{o.label}</option>
                ))}
              </select>

              <select
                value={filters.maxMileage ?? ""}
                onChange={(e) => updateFilter("maxMileage", e.target.value)}
                className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
                style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.maxMileage ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
              >
                <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.maxMileage}</option>
                {[50000, 100000, 150000, 200000, 250000].map((k) => (
                  <option key={k} value={k} style={{ backgroundColor: "#070F1E" }}>
                    {k.toLocaleString("fr-FR")} km
                  </option>
                ))}
              </select>

              <select
                value={filters.minYear ?? ""}
                onChange={(e) => updateFilter("minYear", e.target.value)}
                className="text-[11px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
                style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.minYear ? "#F0F5FF" : "#C8D8EE", border: "1px solid rgba(107,159,238,0.2)" }}
              >
                <option value="" style={{ backgroundColor: "#070F1E" }}>{tv.minYear}</option>
                {[2024, 2022, 2020, 2018, 2015, 2010, 2005, 2000].map((y) => (
                  <option key={y} value={y} style={{ backgroundColor: "#070F1E" }}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRILLE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: "#1B3055" }}>
        {vehicules.map((v) => {
          const images = (() => { try { return JSON.parse(v.images) as string[]; } catch { return []; } })();
          return (
            <VehicleCard
              key={v.id}
              images={images}
              make={v.make}
              year={v.year}
              model={v.model}
              mileage={`${v.mileage.toLocaleString("fr-FR")} km`}
              fuel={v.fuel}
              transmission={v.transmission}
              power={v.power}
              color={v.color}
              origin={v.origin}
              price={v.price > 0 ? `${v.price.toLocaleString("fr-FR")} €` : tv.priceOnRequest}
              isSold={v.status === "vendu"}
              isHidden={isAdmin && !v.isPublished}
              onClick={() => setSelected(toModal(v, tv.priceOnRequest))}
            />
          );
        })}
      </div>

      {/* ── CTA RECHERCHE PERSONNALISÉE ── */}
      <div className="border-t" style={{ borderColor: "#1B3055" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 flex flex-col items-center text-center gap-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "#6B9FEE" }}>
              {tv.notFoundLabel}
            </p>
            <p className="text-sm" style={{ color: "#C8D8EE", fontWeight: 400 }}>
              {tv.notFoundDesc}
            </p>
          </div>
          <Link
            href="/recherche"
            className="flex-shrink-0 px-8 py-4 text-xs font-semibold tracking-widest uppercase transition-all duration-300 hover:-translate-y-px"
            style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
          >
            {tv.customSearchCta}
          </Link>
        </div>
      </div>

      {/* ── MODAL ── */}
      {selected && (
        selected.layoutVariant === "v2"
          ? <VehiculeModalV2 vehicle={selected} onClose={() => setSelected(null)} />
          : <VehiculeModal vehicle={selected} onClose={() => setSelected(null)} />
      )}

    </section>
  );
}
