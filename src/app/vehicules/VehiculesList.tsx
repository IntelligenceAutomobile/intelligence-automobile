"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useCallback, useState } from "react";
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

// IDs dont le modal utilise VehiculeModalV2
const V2_IDS = new Set([
  "cmpqmqrnk0000f4vvwbr2z3dq",
  "cmppfcv2u00002cvvmr6dkxaw",
  "audi-tt-mk2-sline-2010",
  "audi-tt-mk3-sline-2014",
]);

// ── Véhicules de démonstration enrichis ──────────────────────────────────────
const DEMO_VEHICLES: ModalVehicle[] = [
  {
    id: "demo-4",
    make: "Renault",
    model: "Mégane III RS 250",
    year: 2009,
    mileage: "164 334 km",
    fuel: "Essence",
    transmission: "Manuelle 6 rapports",
    color: "Gris Cassiopée Metal",
    origin: "France",
    power: 250,
    price: "À définir",
    status: "disponible",
    finition: "Sport Luxe",
    couple: "360 Nm",
    acceleration: "6.0 s",
    tires: "Michelin PS4S 235/35 R19",
    images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85"],
    description: "L'une des meilleures sportives compactes jamais construites — et l'une des dernières vraies RS à propulsion turbo avant l'ère des boîtes à double embrayage. Finition Sport Luxe avec freins Brembo 4 pistons de série. Kit de distribution refait en avril 2026 par spécialiste Carbelt. 21 factures originales couvrant 15 ans d'entretien rigoureux.",
    features: [
      "Freins Brembo 4 pistons AV",
      "Disques 340 mm rainurés AV",
      "Jantes 19\" diamant noir",
      "Sièges cuir RS noir/jaune",
      "Ceintures jaunes RS",
      "Volant cuir RS surpiqûres",
      "Pédalier aluminium sport",
      "Instrumentation jaune iconic",
    ],
    maintenance: [
      { date: "Avr. 2026", km: "164 334 km", operation: "Kit distribution COMPLET + pompe eau + révision complète + galet tendeur", amount: "1 223 €" },
      { date: "Avr. 2026", km: "163 974 km", operation: "Remplacement liquide de frein + purge", amount: "85 €" },
      { date: "Juil. 2025", km: "163 148 km", operation: "Réparation sinistre avant — nombreuses pièces + peinture + compresseur clim + capteur pression", amount: "17 480 €" },
      { date: "Mai 2024", km: "154 450 km", operation: "Pneumatiques 235/35R19 x2 + montage", amount: "580 €" },
      { date: "Déc. 2023", km: "153 897 km", operation: "Bougies d'allumage (lot de 4)", amount: "185 €" },
      { date: "Oct. 2023", km: "149 259 km", operation: "Remplacement pare-brise + kit collage", amount: "1 079 €" },
      { date: "Oct. 2023", km: "149 259 km", operation: "Révision complète + disques/plaquettes AR + batterie + filtres x4 + huile", amount: "1 844 €" },
      { date: "Juin 2022", km: "147 343 km", operation: "Kit distribution COMPLET + pompe eau + révision complète" },
      { date: "Mai 2021", km: "132 374 km", operation: "Révision bougies + vidange" },
      { date: "Janv. 2021", km: "125 938 km", operation: "Pneu x1 + géométrie + liquide frein" },
      { date: "Juin 2019", km: "93 973 km", operation: "Révision + plaquettes AV + freins + purge" },
      { date: "Févr. 2018", km: "68 515 km", operation: "Révision éco Renault RN0710" },
      { date: "Juin 2017", km: "63 727 km", operation: "Révision + pneus x2 + contrôle technique" },
      { date: "Mars 2016", km: "53 380 km", operation: "Révision 50 000 km + distribution + pompe eau + CT" },
      { date: "Déc. 2013", km: "40 516 km", operation: "Révision 40 000 km + CT + filtres + liquide frein + liquide refroidissement" },
      { date: "Mai 2012", km: "29 924 km", operation: "Vidange + filtre huile + niveaux + contrôle frein" },
      { date: "Mai 2011", km: "19 243 km", operation: "Révision 20 000 km + filtres air/habitacle + huile 5W40" },
    ],
    dossierUrl: "/dossiers/megane-rs-250.pdf",
    isDemo: true,
  },
  {
    id: "demo-1",
    make: "BMW",
    model: "M3 Competition",
    year: 2020,
    mileage: "42 000 km",
    fuel: "Essence",
    transmission: "Automatique",
    color: "Gris Frozen",
    origin: "Allemagne",
    power: 510,
    price: "64 900 €",
    status: "disponible",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85"],
    description: "BMW M3 Competition en parfait état, issue d'une flotte professionnelle avec carnet d'entretien complet en réseau BMW. Historique vérifiable sans accident. Livrée prête à immatriculer en France avec certificat de conformité.",
    features: [
      "Toit carbone M",
      "Sièges baquets M",
      "Jantes forgées 19\"",
      "Affichage tête haute",
      "Pack Carbon M",
      "Caméra 360°",
      "Régulateur adaptatif",
      "Son Harman Kardon",
    ],
    isDemo: true,
  },
  {
    id: "demo-2",
    make: "Audi",
    model: "RS4 Avant",
    year: 2021,
    mileage: "31 500 km",
    fuel: "Essence",
    transmission: "Automatique",
    color: "Blanc Glacier",
    origin: "Allemagne",
    power: 450,
    price: "59 500 €",
    status: "disponible",
    images: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=85"],
    description: "Audi RS4 Avant 2021 avec suivi Audi Service exclusif. Véhicule de leasing d'entreprise — un seul propriétaire, entretien rigoureux, aucun sinistre déclaré. Kilométrage bas pour l'année.",
    features: [
      "Pack Sport Plus",
      "Toit ouvrant panoramique",
      "Sièges RS chauffants",
      "Matrix LED",
      "B&O Sound System",
      "Roues RS 20\" anthracite",
      "Virtual Cockpit Plus",
      "Suspension RS sport",
    ],
    isDemo: true,
  },
  {
    id: "demo-3",
    make: "Mercedes-AMG",
    model: "C 63 S Coupé",
    year: 2019,
    mileage: "55 000 km",
    fuel: "Essence",
    transmission: "Automatique",
    color: "Noir Obsidienne",
    origin: "Belgique",
    power: 510,
    price: "52 900 €",
    status: "disponible",
    images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85"],
    description: "Mercedes-AMG C 63 S Coupé importée de Belgique. Configuration rare, entretien Mercedes-Benz exclusif avec toutes les factures. Moteur V8 biturbo dans son état d'origine, aucune modification.",
    features: [
      "Pack AMG Nuit",
      "Échappement sport AMG",
      "Sièges AMG cuir Nappa",
      "Toit ouvrant",
      "Burmester Surround",
      "Jantes AMG 19\" bicolores",
      "Caméra recul",
      "Aide au stationnement",
    ],
    isDemo: true,
  },
];

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
  status: string;
  origin: string;
  power?: number | null;
  description?: string;
  isPublished: boolean;
};

type Filters = {
  make?: string;
  fuel?: string;
  maxPrice?: number;
  status?: string;
};


// Convertit un véhicule DB → format modal
function toModal(v: Vehicle): ModalVehicle {
  const images = (() => { try { return JSON.parse(v.images) as string[]; } catch { return []; } })();
  const features = (() => { try { return JSON.parse(v.features) as string[]; } catch { return []; } })();
  const enrichment = VEHICLE_ENRICHMENTS[v.id] ?? {};
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: `${v.mileage.toLocaleString("fr-FR")} km`,
    fuel: v.fuel,
    price: v.price > 0 ? `${v.price.toLocaleString("fr-FR")} €` : "Prix sur demande",
    images,
    transmission: v.transmission,
    color: v.color,
    origin: v.origin,
    power: v.power ?? undefined,
    description: v.description,
    features,
    status: v.status,
    layoutVariant: V2_IDS.has(v.id) ? "v2" : undefined,
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
  isDemo,
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
  isDemo?: boolean;
  onClick: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const total = images.length;
  const img = images[imgIdx] ?? null;

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
    { label: "Modèle", value: model },
    { label: "Année", value: String(year) },
    { label: "Kilométrage", value: mileage },
    { label: "Carburant", value: fuel },
    transmission ? { label: "Boîte", value: transmission } : null,
    power ? { label: "Puissance", value: `${power} ch` } : null,
    color ? { label: "Couleur", value: color } : null,
    origin ? { label: "Origine", value: origin } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left cursor-pointer"
      style={{ backgroundColor: "#070F1E" }}
    >
      {/* ── IMAGE ── */}
      <div className="relative overflow-hidden" style={{ height: "420px" }}>
        {img ? (
          <img
            src={img}
            alt={`${make} ${model}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ opacity: isSold ? 0.35 : 0.72 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#0D1A2D" }}>
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#1B3055" }}>Photo à venir</span>
          </div>
        )}

        {/* Gradient léger au repos, disparaît au hover */}
        <div
          className="absolute inset-0 transition-opacity duration-400 group-hover:opacity-0"
          style={{ background: "linear-gradient(to top, rgba(7,15,30,0.45) 0%, rgba(7,15,30,0.15) 40%, transparent 70%)" }}
        />

        {/* Badge démo */}
        {isDemo && (
          <div className="absolute top-5 left-5 z-10">
            <span className="text-[9px] tracking-[0.25em] uppercase px-3 py-1.5" style={{ backgroundColor: "rgba(7,15,30,0.8)", color: "#1B3055", border: "1px solid #1B3055" }}>
              Exemple
            </span>
          </div>
        )}

        {/* Badge masqué (admin only) */}
        {isHidden && (
          <div className="absolute top-5 right-5 z-30">
            <span className="text-[9px] tracking-[0.25em] uppercase px-3 py-1.5" style={{ backgroundColor: "#FF6B35", color: "#070F1E" }}>Masqué</span>
          </div>
        )}

        {/* Overlay vendu */}
        {isSold && (
          <>
            <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(135deg, rgba(7,15,30,0.7) 0%, rgba(7,15,30,0.4) 100%)" }} />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
              <span className="font-black uppercase" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#F0F5FF", letterSpacing: "0.45em", textShadow: "0 2px 40px rgba(0,0,0,0.8)" }}>
                Vendu
              </span>
              <div style={{ width: "40px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.6 }} />
              <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                Trouvé par Intelligence Automobile
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
            <div className="absolute bottom-3 right-4 z-20" style={{ backgroundColor: "rgba(7,15,30,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: "20px", padding: "2px 9px", color: "#8AABD4", fontSize: "9px", letterSpacing: "0.15em" }}>
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
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#F0F5FF" }}>Voir le détail</span>
          </div>
        </div>
      </div>

      {/* ── BARRE MARQUE · STATUT · PRIX (toujours visible) ── */}
      <div className="flex items-center justify-between px-5 py-3 gap-3" style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] tracking-[0.3em] uppercase font-bold flex-shrink-0" style={{ color: "#6B9FEE" }}>{make}</span>
          {!isDemo && (
            <span
              className="text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 font-semibold flex-shrink-0"
              style={{
                color: isSold ? "#8AABD4" : "#6B9FEE",
                border: `1px solid ${isSold ? "#1B3055" : "rgba(107,159,238,0.3)"}`,
                backgroundColor: isSold ? "transparent" : "rgba(107,159,238,0.08)",
              }}
            >
              {isSold ? "Vendu" : "Disponible"}
            </span>
          )}
        </div>
        <span className="font-black text-base flex-shrink-0" style={{ color: "#F0F5FF" }}>{price}</span>
      </div>

      {/* ── CHEVRON ── */}
      <button
        type="button"
        onClick={toggleInfo}
        className="w-full flex items-center justify-center gap-3 py-3 transition-all duration-200 hover:opacity-80"
        style={{ backgroundColor: "#0D1E35", borderTop: "1px solid #1B3055", borderBottom: "1px solid #1B3055" }}
      >
        <span className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#6B9FEE" }}>
          Caractéristiques
        </span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className="transition-transform duration-300 flex-shrink-0"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", color: "#6B9FEE" }}
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
              className="flex flex-col px-3 py-2.5"
              style={{ backgroundColor: "#0A1628" }}
            >
              <span className="text-[7px] tracking-[0.2em] uppercase mb-1" style={{ color: "#6B9FEE" }}>{s.label}</span>
              <span className="font-bold text-[11px] leading-tight" style={{ color: "#F0F5FF" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function VehiculesList({
  vehicules,
  makes,
  filters,
  isAdmin = false,
}: {
  vehicules: Vehicle[];
  makes: string[];
  filters: Filters;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<ModalVehicle | null>(null);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      if (filters.make && key !== "make") params.set("make", filters.make);
      if (filters.fuel && key !== "fuel") params.set("fuel", filters.fuel);
      if (filters.maxPrice && key !== "maxPrice") params.set("maxPrice", String(filters.maxPrice));
      if (filters.status && key !== "status") params.set("status", filters.status);
      if (value) params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pathname, router]
  );

  const fuels = ["Diesel", "Essence", "Hybride", "Électrique"];
  const currentStatus = filters.status ?? "tous";
  const hasActiveFilters = filters.make || filters.fuel || filters.maxPrice;

  return (
    <section style={{ backgroundColor: "#070F1E" }}>

      {/* ── FILTRES ── */}
      <div
        className="border-b sticky top-[64px] z-20 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(7,15,30,0.95)", borderColor: "#1B3055" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-4 py-5 overflow-x-auto">

            <div className="flex gap-2 flex-shrink-0">
              {[
                { key: "disponible", label: "Disponibles" },
                { key: "vendu", label: "Vendus" },
                { key: "tous", label: "Tous" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => updateFilter("status", s.key === "tous" ? "" : s.key)}
                  className="text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 transition-all duration-200 flex-shrink-0 hover:-translate-y-px hover:opacity-90"
                  style={{
                    background: currentStatus === s.key ? "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)" : "rgba(107,159,238,0.04)",
                    color: currentStatus === s.key ? "#070F1E" : "#8AABD4",
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
              className="text-[10px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-3 py-2"
              style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.make ? "#F0F5FF" : "#8AABD4", border: "1px solid rgba(107,159,238,0.2)" }}
            >
              <option value="" style={{ backgroundColor: "#070F1E" }}>Toutes marques</option>
              {makes.map((m) => (
                <option key={m} value={m} style={{ backgroundColor: "#070F1E" }}>{m}</option>
              ))}
            </select>

            <select
              value={filters.fuel ?? ""}
              onChange={(e) => updateFilter("fuel", e.target.value)}
              className="text-[10px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-3 py-2"
              style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.fuel ? "#F0F5FF" : "#8AABD4", border: "1px solid rgba(107,159,238,0.2)" }}
            >
              <option value="" style={{ backgroundColor: "#070F1E" }}>Carburant</option>
              {fuels.map((f) => (
                <option key={f} value={f} style={{ backgroundColor: "#070F1E" }}>{f}</option>
              ))}
            </select>

            <select
              value={filters.maxPrice ?? ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="text-[10px] tracking-[0.25em] uppercase outline-none flex-shrink-0 cursor-pointer transition-all duration-200 hover:opacity-80 px-3 py-2"
              style={{ backgroundColor: "rgba(107,159,238,0.04)", color: filters.maxPrice ? "#F0F5FF" : "#8AABD4", border: "1px solid rgba(107,159,238,0.2)" }}
            >
              <option value="" style={{ backgroundColor: "#070F1E" }}>Budget max</option>
              {[20000, 30000, 40000, 60000, 80000].map((p) => (
                <option key={p} value={p} style={{ backgroundColor: "#070F1E" }}>
                  {p.toLocaleString("fr-FR")} €
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <>
                <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: "#1B3055" }} />
                <Link href="/vehicules" className="text-[9px] tracking-[0.25em] uppercase flex-shrink-0" style={{ color: "#6B9FEE" }}>
                  Effacer ×
                </Link>
              </>
            )}

            <span className="ml-auto text-[9px] tracking-[0.3em] uppercase flex-shrink-0" style={{ color: "#1B3055" }}>
              {vehicules.length} véhicule{vehicules.length !== 1 ? "s" : ""}
            </span>
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
              price={v.price > 0 ? `${v.price.toLocaleString("fr-FR")} €` : "Prix sur demande"}
              isSold={v.status === "vendu"}
              isHidden={isAdmin && !v.isPublished}
              onClick={() => setSelected(toModal(v))}
            />
          );
        })}
        {DEMO_VEHICLES.map((v) => (
          <div key={v.id} style={{ opacity: 0.7 }}>
            <VehicleCard
              images={v.images}
              make={v.make}
              year={v.year}
              model={v.model}
              mileage={v.mileage}
              fuel={v.fuel}
              transmission={v.transmission}
              power={v.power}
              color={v.color}
              origin={v.origin}
              price={v.price}
              isDemo
              onClick={() => setSelected(v)}
            />
          </div>
        ))}
      </div>

      {/* ── CTA MANDAT ── */}
      <div className="border-t" style={{ borderColor: "#1B3055" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "#6B9FEE" }}>
              Vous ne trouvez pas votre véhicule ?
            </p>
            <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
              Confiez-nous un mandat d&apos;import sur-mesure depuis l&apos;Allemagne ou la Belgique.
            </p>
          </div>
          <Link
            href="/contact"
            className="flex-shrink-0 px-8 py-4 text-xs font-semibold tracking-widest uppercase rounded-full border-2 transition-all duration-300"
            style={{ borderColor: "#6B9FEE", color: "#6B9FEE" }}
          >
            Nous contacter
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
