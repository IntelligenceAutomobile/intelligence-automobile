import type { CSSProperties } from "react";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import GalleryLightbox from "./GalleryLightbox";
import EquipementsAccordion from "./EquipementsAccordion";
import DescriptionBlock from "./DescriptionBlock";
import EntretienDocumentsSection from "./EntretienDocumentsSection";
import ReservationCta from "./ReservationCta";
import { formatNumber } from "@/lib/format";
import type { Translations } from "@/i18n/fr";

// ── Types du modèle de vue (données déjà résolues côté serveur ou formulaire) ──
export type MaintenanceEntry = { date: string; km: string; operation: string; amount?: string; linkedDoc?: string };
export type MaintenanceHighlight = { icon: string; label: string; text: string; color: string };
export type VehiculeDetailDoc = string | { url: string; label?: string };

export type VehiculeDetailModel = {
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  power: number | null;
  color: string;
  transmission: string;
  fuel: string;
  origin: string;
  status: string;
  descParagraphs: string[];
  etatFacts: string[];
  features: string[];
  maintenance: MaintenanceEntry[];
  documents: VehiculeDetailDoc[];
  highlights: MaintenanceHighlight[];
  images: string[];
};

// ── Préparation (chemin structuré, non-legacy) ────────────────────────────────
// Filtre les paragraphes marketing/CTA et expose conditionFacts tels quels.
// Partagé entre la vraie page et l'aperçu pour garantir un rendu identique.
export function buildPresentation(
  description: string,
  conditionFacts: string[]
): { descParagraphs: string[]; etatFacts: string[] } {
  const descParagraphs = (description?.split("\n\n") ?? [])
    .filter(Boolean)
    .filter((p) => {
      const low = p.toLowerCase();
      return !(
        low.includes("intelligence automobile prend en charge") ||
        low.includes("essai disponible") ||
        low.includes("test drive available")
      );
    });
  return { descParagraphs, etatFacts: conditionFacts };
}

// ── Helpers de présentation (purs) ─────────────────────────────────────────────
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
  { label: "Motorisation", keys: ["hybride", "électrique", "chargeur", "boîte", "norme", "consommation", "phev", "e-tron", "quattro", "s tronic", "dsg", "electric", "hybrid", "charger", "gearbox", "standard", "consumption"] },
  { label: "Design & S line", keys: ["pack s line", "jante", "bouclier", "bas de caisse", "feux", "led", "spoiler", "diffuseur", "échappement", "carbone", "phare", "wheel", "bumper", "skirt", "exhaust", "headlight", "carbon", "alloy"] },
  { label: "Confort & Techno", keys: ["siège", "volant", "climat", "démarrage", "rétroviseur", "navigation", "bluetooth", "régulateur", "caméra", "keyless", "virtual", "mmi", "b&o", "bang", "éclairage", "vitres", "connectivité", "apple", "carplay", "android", "seat", "steering", "climate", "mirror", "cruise", "camera", "ambient", "window", "connectivity", "start"] },
  { label: "Sécurité", keys: ["airbag", "esp", "asr", "stationnement", "isofix", "frein", "parking", "brake", "tyre", "abs", "traction"] },
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

// ── Vue présentationnelle ──────────────────────────────────────────────────────
// Pas de "use client" : ce composant se rend côté serveur (vraie page) comme côté
// client (aperçu live dans l'admin). Il ne dépend que de ses props, jamais de la base.
export default function VehiculeDetailView({
  model,
  t,
  isPreview = false,
  isOnline = false,
  vehicleId,
}: {
  model: VehiculeDetailModel;
  t: Translations;
  isPreview?: boolean;
  /** Fiche publiée : porte le repère « Test » à côté du statut. Une annonce
   *  masquée que consulte un admin reste sans repère. */
  isOnline?: boolean;
  /** Fiche du stock à l'origine d'une demande de réservation. Absent en aperçu. */
  vehicleId?: string;
}) {
  const images = model.images;
  const { name, subtitle } = parseTitle(model.make, model.model, model.power);
  const categories = categorize(model.features);
  const pointsForts = model.features.slice(0, 6);
  const descParagraphs = model.descParagraphs;
  const etatFacts = model.etatFacts;
  const maintenance = model.maintenance;
  const documents = model.documents;
  const highlights = model.highlights;

  const isSold = model.status === "vendu";
  const isAvailable = model.status === "disponible";

  const tm = t.vehicleModal;
  const tv = t.vehicles;
  const td = t.vehicleDetail;

  const fuelLabel = tv.fuelOptions.find((o) => o.value === model.fuel)?.label ?? model.fuel;

  // Section counter
  let sectionIdx = 0;
  const nextNum = () => {
    sectionIdx++;
    return sectionIdx.toString().padStart(2, "0");
  };

  const sectionCardStyle: CSSProperties = {
    background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
    border: "1px solid rgba(107,159,238,0.12)",
    borderRadius: "10px",
    padding: "2rem",
  };

  const contactSlug = `${model.make} ${model.model} ${model.year}`;

  // Pastilles de la barre haute du hero : même verre fumé que les flèches du
  // carrousel, pour que les contrôles posés sur la photo forment une famille.
  // Le fond sombre translucide garde le texte lisible sur une photo claire.
  const heroPill: CSSProperties = {
    backgroundColor: "rgba(7,15,30,0.65)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(27,48,85,0.7)",
    borderRadius: "999px",
  };
  const statusTone = isAvailable
    ? { fg: "#5BD89A", border: "rgba(91,216,154,0.45)" }
    : isSold
      ? { fg: "#C8D8EE", border: "rgba(27,48,85,0.7)" }
      : { fg: "#F0B860", border: "rgba(240,184,96,0.45)" };
  const pillClass =
    "inline-flex items-center px-3.5 py-2 lg:px-4 lg:py-2.5 text-[9px] lg:text-[10px] tracking-[0.28em] uppercase whitespace-nowrap";

  return (
    <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

      {/* ── HERO ── */}
      <HeroCarousel
        images={images}
        alt={name}
        imgOpacity={isSold ? 0.85 : 1}
        topBar={
          <>
            <Link
              href="/vehicules"
              className={`group gap-2.5 text-[#C8D8EE] hover:text-white transition-colors duration-200 ${pillClass}`}
              style={heroPill}
            >
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
                style={{ fontSize: "1.15em", lineHeight: 1 }}
              >
                ←
              </span>
              {td.backLink}
            </Link>

            {/* Statut et repère « Test » forment un seul bloc : la barre haute
                répartit ses deux enfants aux extrémités, le retour et ce groupe.
                Il se replie sur deux lignes quand la fenêtre devient étroite. */}
            <span className="flex flex-wrap items-start justify-end gap-x-1.5 gap-y-2 lg:gap-x-2">
              <span className={`gap-2 ${pillClass}`} style={{ ...heroPill, border: `1px solid ${statusTone.border}`, color: statusTone.fg }}>
                <span
                  aria-hidden
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: statusTone.fg,
                    boxShadow: `0 0 8px ${statusTone.fg}`,
                  }}
                />
                {isAvailable ? tm.available : isSold ? tm.sold : td.reserved}
              </span>
              {isOnline && (
                // Un peu plus resserrée que les autres pastilles : sur un écran de
                // téléphone, la barre haute tient sur une seule ligne à ce prix-là.
                <span
                  className="inline-flex items-center px-2 py-2 lg:px-4 lg:py-2.5 text-[9px] lg:text-[10px] tracking-[0.2em] lg:tracking-[0.28em] uppercase whitespace-nowrap"
                  style={{ ...heroPill, border: "1px solid rgba(255,107,53,0.45)", color: "#FF6B35" }}
                >
                  Test
                </span>
              )}
            </span>
          </>
        }
      />

      {/* ── LAYOUT PRINCIPAL ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-20 pt-12 pb-28">

          {/* ── COLONNE GAUCHE (3/5) ── */}
          <div className="lg:col-span-3">

            {/* Marque · Origine */}
            <p className="text-xs tracking-[0.45em] uppercase mb-5" style={{ color: "#6B9FEE" }}>
              {model.make} · {model.origin}
            </p>

            {/* H1 */}
            <h1
              className="font-black uppercase leading-[0.88] mb-2"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)", letterSpacing: "-0.03em" }}
            >
              {name}
            </h1>
            {subtitle && (
              <p className="mb-10 font-light" style={{ color: "#7BA5DC", fontSize: "clamp(0.85rem, 1.5vw, 1rem)", letterSpacing: "0.04em" }}>
                {subtitle}
              </p>
            )}

            {/* ── SECTION 01 : PRÉSENTATION ── */}
            {descParagraphs.length > 0 && (
              <div className="mb-14">
                <div className="flex items-baseline gap-5 mb-10">
                  <span
                    className="font-black tabular-nums flex-shrink-0 leading-none flex items-center justify-center"
                    style={{
                      fontSize: "1.1rem",
                      color: "#6B9FEE",
                      letterSpacing: "-0.02em",
                      width: "2.75rem",
                      height: "2.75rem",
                      backgroundColor: "rgba(107,159,238,0.1)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    {nextNum()}
                  </span>
                  <p
                    className="text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.5em] uppercase font-bold min-w-0"
                    style={{ color: "#F0F5FF" }}
                  >
                    {td.presentationSection}
                  </p>
                  <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(198,204,214,0.35)" }} />
                </div>

                <div style={sectionCardStyle}>
                  <DescriptionBlock paragraphs={descParagraphs} />

                  {etatFacts.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-3">
                      {etatFacts.map((fact, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium"
                          style={{
                            backgroundColor: "rgba(107,159,238,0.08)",
                            border: "1px solid rgba(107,159,238,0.25)",
                            color: "#E8F0FC",
                            borderRadius: "6px",
                          }}
                        >
                          <span
                            className="flex items-center justify-center flex-shrink-0 font-bold"
                            style={{
                              color: "#5BD89A",
                              fontSize: "11px",
                              width: "1.25rem",
                              height: "1.25rem",
                              backgroundColor: "rgba(91,216,154,0.15)",
                              borderRadius: "50%",
                            }}
                          >
                            ✓
                          </span>
                          {fact}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SECTION 02 : POINTS FORTS ── */}
            {pointsForts.length > 0 && (
              <div className="mb-14">
                <div className="flex items-baseline gap-5 mb-10">
                  <span
                    className="font-black tabular-nums flex-shrink-0 leading-none flex items-center justify-center"
                    style={{
                      fontSize: "1.1rem",
                      color: "#6B9FEE",
                      letterSpacing: "-0.02em",
                      width: "2.75rem",
                      height: "2.75rem",
                      backgroundColor: "rgba(107,159,238,0.1)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    {nextNum()}
                  </span>
                  <p
                    className="text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.5em] uppercase font-bold min-w-0"
                    style={{ color: "#F0F5FF" }}
                  >
                    {tm.highlights}
                  </p>
                  <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(198,204,214,0.35)" }} />
                </div>

                <div style={sectionCardStyle}>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {pointsForts.map((f) => (
                      <div
                        key={f}
                        className="flex items-start gap-4 px-5 py-5 transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          backgroundColor: "rgba(107,159,238,0.05)",
                          border: "1px solid rgba(107,159,238,0.12)",
                          borderLeft: "3px solid #6B9FEE",
                          borderRadius: "6px",
                        }}
                      >
                        <span className="flex-shrink-0 text-xs font-bold mt-0.5" style={{ color: "#5BD89A" }}>✓</span>
                        <span className="text-[15px] leading-snug font-medium" style={{ color: "#E8F0FC" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 03 : ÉQUIPEMENTS ── */}
            {categories.length > 0 && (
              <div className="mb-14">
                <div className="flex items-baseline gap-5 mb-10">
                  <span
                    className="font-black tabular-nums flex-shrink-0 leading-none flex items-center justify-center"
                    style={{
                      fontSize: "1.1rem",
                      color: "#6B9FEE",
                      letterSpacing: "-0.02em",
                      width: "2.75rem",
                      height: "2.75rem",
                      backgroundColor: "rgba(107,159,238,0.1)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    {nextNum()}
                  </span>
                  <p
                    className="text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.5em] uppercase font-bold min-w-0"
                    style={{ color: "#F0F5FF" }}
                  >
                    {tm.equipmentTitle}
                  </p>
                  <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(198,204,214,0.35)" }} />
                </div>

                <div style={sectionCardStyle}>
                  <EquipementsAccordion categories={categories} />
                </div>
              </div>
            )}

            {/* ── SECTION 04 : ENTRETIEN & DOCUMENTS ── */}
            {(maintenance.length > 0 || documents.length > 0) && (
              <div className="mb-14">
                {/* Header numéroté */}
                <div className="flex items-baseline gap-5 mb-10">
                  <span
                    className="font-black tabular-nums flex-shrink-0 leading-none flex items-center justify-center"
                    style={{
                      fontSize: "1.1rem",
                      color: "#6B9FEE",
                      letterSpacing: "-0.02em",
                      width: "2.75rem",
                      height: "2.75rem",
                      backgroundColor: "rgba(107,159,238,0.1)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    {nextNum()}
                  </span>
                  <p
                    className="text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.5em] uppercase font-bold min-w-0"
                    style={{ color: "#F0F5FF" }}
                  >
                    Entretien &amp; Documents
                  </p>
                  <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(198,204,214,0.35)" }} />
                </div>

                <div style={sectionCardStyle}>
                  <EntretienDocumentsSection
                    maintenance={maintenance}
                    documents={documents}
                    interventionsLabel={tm.interventions}
                    showMoreLabel={td.showMoreInterventions}
                    showLessLabel={td.showLessInterventions}
                    highlights={highlights}
                    previewUnlocked={isPreview}
                  />
                </div>
              </div>
            )}

            {/* Branding */}
            <div className="flex items-center gap-4 mt-8">
              <div style={{ width: "40px", height: "2px", backgroundColor: "#C6CCD6", borderRadius: "1px" }} />
              <span className="text-[11px] tracking-[0.45em] uppercase font-semibold" style={{ color: "#E8F0FC" }}>
                {tm.branding}
              </span>
              <div className="flex-1" style={{ height: "1px", backgroundColor: "rgba(107,159,238,0.15)" }} />
            </div>
          </div>

          {/* ── COLONNE DROITE (2/5) — STICKY ── */}
          <div className="lg:col-span-2">
            <div style={{ position: "sticky", top: "calc(7rem + 50px)" }}>

              <div
                style={{
                  background: "linear-gradient(160deg, #0E2040 0%, #091626 100%)",
                  border: "1px solid rgba(107,159,238,0.2)",
                  borderTop: "2px solid #6B9FEE",
                  borderRadius: "10px",
                  boxShadow: "0 20px 60px rgba(107,159,238,0.08)",
                  overflow: "hidden",
                }}
              >
                {/* Bandeau garantie */}
                <div
                  className="flex items-center gap-2.5 px-6 py-3.5"
                  style={{
                    borderBottom: "1px solid rgba(107,159,238,0.12)",
                    backgroundColor: "rgba(198,204,214,0.06)",
                  }}
                >
                  <span
                    className="flex items-center justify-center flex-shrink-0 font-bold"
                    style={{
                      color: "#5BD89A",
                      fontSize: "10px",
                      width: "1.25rem",
                      height: "1.25rem",
                      backgroundColor: "rgba(198,204,214,0.15)",
                      borderRadius: "50%",
                    }}
                  >
                    ✓
                  </span>
                  <span className="text-[13px] font-medium tracking-wide" style={{ color: "#EBD9A8" }}>
                    {tm.warranty}
                  </span>
                </div>

                {/* Prix */}
                <div className="px-6 pt-6 pb-2">
                  <p className="text-[9px] font-medium tracking-[0.4em] uppercase mb-2" style={{ color: "#9DBEF0" }}>
                    {td.priceLabel}
                  </p>
                  <div
                    className="font-black leading-none mb-1"
                    style={{ fontSize: "clamp(2.6rem, 4.5vw, 3.4rem)", letterSpacing: "-0.04em", color: "#F0F5FF" }}
                  >
                    {formatNumber(model.price)} €
                  </div>
                </div>

                {/* Specs 2×2 */}
                <div
                  className="grid grid-cols-2 gap-px mx-6 mb-5"
                  style={{ backgroundColor: "rgba(107,159,238,0.15)" }}
                >
                  {[
                    { label: tv.specMileage, value: `${formatNumber(model.mileage)} km` },
                    { label: td.circLabel, value: String(model.year) },
                    model.power ? { label: tv.specPower, value: `${model.power} ch` } : null,
                    { label: tv.specFuel, value: fuelLabel },
                    { label: tv.specGearbox, value: model.transmission },
                    { label: tv.specOrigin, value: model.origin },
                  ]
                    .filter(Boolean)
                    .map((s) => (
                      <div
                        key={s!.label}
                        className="flex flex-col px-4 py-4"
                        style={{ backgroundColor: "#0B1929" }}
                      >
                        <span
                          className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-1.5"
                          style={{ color: "#A8C6F4" }}
                        >
                          {s!.label}
                        </span>
                        <span
                          className="font-black leading-tight"
                          style={{ fontSize: "1.15rem", color: "#F0F5FF", letterSpacing: "-0.01em" }}
                        >
                          {s!.value}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Services */}
                <div
                  className="flex flex-col gap-2.5 px-6 pb-6 pt-4"
                  style={{ borderTop: "1px solid rgba(107,159,238,0.1)" }}
                >
                  {[tm.financing, tm.adminIncluded].map((g) => (
                    <div key={g} className="flex items-center gap-2.5">
                      <span className="font-bold flex-shrink-0" style={{ color: "#5BD89A", fontSize: "11px" }}>✓</span>
                      <span className="text-xs tracking-wide" style={{ color: "#C8D8EE" }}>{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-3">
                {isAvailable ? (
                  <>
                    <ReservationCta
                      vehicle={contactSlug}
                      price={model.price}
                      vehicleId={vehicleId}
                      labels={td.reservation}
                      className="block w-full text-center text-xs font-bold tracking-[0.2em] uppercase py-5 transition-all duration-300 hover:-translate-y-px hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                    >
                      {tm.reserveCta}
                    </ReservationCta>
                    <Link
                      href={`/contact?vehicule=${encodeURIComponent(contactSlug)}&sujet=dossier`}
                      className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-4 border transition-all duration-300 hover:border-[#6B9FEE] hover:text-[#6B9FEE]"
                      style={{ borderColor: "rgba(107,159,238,0.25)", color: "#C8D8EE" }}
                    >
                      {td.dossierCta}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-xs mb-2" style={{ color: "#7BA5DC" }}>
                      {td.soldMsg}
                    </p>
                    <Link
                      href="/vehicules"
                      className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5"
                      style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                    >
                      {td.viewStock}
                    </Link>
                    <Link
                      href="/recherche-personnalisee"
                      className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-4 border"
                      style={{ borderColor: "rgba(107,159,238,0.25)", color: "#C8D8EE" }}
                    >
                      {td.searchCta}
                    </Link>
                  </>
                )}

                {images.length > 1 && (
                  <a
                    href="#galerie"
                    className="block w-full text-center text-[11px] font-semibold tracking-[0.3em] uppercase py-3 transition-opacity hover:opacity-70"
                    style={{ color: "#8FB4F0" }}
                  >
                    {td.viewPhotos.replace("%n", String(images.length))}
                  </a>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* ── GALERIE ── */}
        {images.length > 1 && (
          <div id="galerie" className="border-t pb-24" style={{ borderColor: "#1B3055", paddingTop: "3.5rem" }}>
            <div className="flex items-center gap-4 mb-10">
              <p className="text-[9px] tracking-[0.55em] uppercase flex-shrink-0" style={{ color: "#E8F0FC" }}>
                {td.gallery}
              </p>
              <span className="text-[9px] tracking-[0.2em]" style={{ color: "rgba(107,159,238,0.5)" }}>
                {images.length} photos
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#1B3055" }} />
            </div>
            <GalleryLightbox images={images} alt={name} />
          </div>
        )}

        {/* ── CTA FINAL ── */}
        <div className="pb-28 lg:pb-24" style={{ paddingTop: "3.5rem" }}>
          <div
            className="max-w-3xl mx-auto text-center"
            style={{ ...sectionCardStyle, padding: "3.5rem 2.5rem" }}
          >
            <p className="text-[11px] font-bold tracking-[0.5em] uppercase mb-5" style={{ color: "#6B9FEE" }}>
              {td.testDriveLabel}
            </p>
            <h2
              className="font-black uppercase leading-tight mb-6"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", letterSpacing: "-0.025em" }}
            >
              {td.ctaTitle}
            </h2>
            <p className="text-[15px] mb-12" style={{ color: "#A8C6F4", fontWeight: 400 }}>
              {td.ctaSubtitle}
            </p>
            {isAvailable && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ReservationCta
                  vehicle={contactSlug}
                  price={model.price}
                  vehicleId={vehicleId}
                  labels={td.reservation}
                  className="px-10 py-5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:-translate-y-px hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                >
                  {tm.reserveCta}
                </ReservationCta>
                <Link
                  href={`/contact?vehicule=${encodeURIComponent(contactSlug)}&sujet=dossier`}
                  className="px-10 py-5 text-xs font-semibold tracking-widest uppercase border transition-all duration-300"
                  style={{ borderColor: "rgba(107,159,238,0.4)", color: "#6B9FEE" }}
                >
                  {td.dossierCta}
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── MOBILE STICKY CTA ── */}
      {isAvailable && !isPreview && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 py-3"
          style={{
            backgroundColor: "rgba(7,15,30,0.95)",
            borderTop: "1px solid rgba(107,159,238,0.2)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <ReservationCta
            vehicle={contactSlug}
            price={model.price}
            vehicleId={vehicleId}
            labels={td.reservation}
            className="block w-full text-center text-xs font-bold tracking-[0.2em] uppercase py-4"
            style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
          >
            {tm.reserveCta} · {formatNumber(model.price)} €
          </ReservationCta>
        </div>
      )}

    </main>
  );
}
