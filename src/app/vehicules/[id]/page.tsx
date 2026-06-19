import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import HeroCarousel from "@/components/HeroCarousel";
import GalleryLightbox from "./GalleryLightbox";
import EquipementsAccordion from "./EquipementsAccordion";
import DescriptionBlock from "./DescriptionBlock";
import EntretienDocumentsSection from "./EntretienDocumentsSection";
import { getTranslations } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/format";

// ── Maintenance data (server-side) ───────────────────────────────────────────
type MaintenanceEntry = { date: string; km: string; operation: string; amount?: string; linkedDoc?: string };
const MAINTENANCE_DATA: Record<string, MaintenanceEntry[]> = {
  "audi-tt-mk3-sline-2014": [
    { date: "Fév. 2026", km: "~147 000 km", operation: "Bougies neuves, service Haldex quattro, remplacement pneus Michelin" },
    { date: "Mars 2025", km: "—", operation: "Batterie VARTA A6 AGM neuve + montage en atelier", amount: "301,89 €", linkedDoc: "batterie-invoice-1.jpg" },
  ],
  "audi-tt-mk2-sline-2010": [
    { date: "Janv. 2026", km: "151 042 km", operation: "Contrôle technique FAVORABLE, valide jusqu'au 28/01/2028 (Autosur Tremblay · PV N° 26049227)" },
    { date: "Juil. 2025", km: "~151 000 km", operation: "Disques AV+AR neufs, plaquettes AV+AR neuves, filtres air et habitacle (Autodoc)", amount: "276,96 €" },
    { date: "Nov. 2024", km: "145 762 km", operation: "Entretien intermédiaire huile 5W40 + diagnostic électronique complet (Midas Paris 17)", amount: "109,00 €" },
    { date: "Août 2024", km: "140 168 km", operation: "Contrôle technique FAVORABLE (Securitest Mandelieu · PV N° 24073569)" },
    { date: "Déc. 2023", km: "138 653 km", operation: "Vidange moteur, filtres" },
    { date: "Déc. 2023", km: "134 073 km", operation: "Kit distribution, courroie multi-V, bougies, plaquettes AV (ByMyCar Vaucluse)", amount: "355,72 €" },
    { date: "Avr. 2021", km: "134 073 km", operation: "Vidange moteur, filtres, contrôles (La Chaume Carpentras)" },
    { date: "Août 2019", km: "130 874 km", operation: "Inspection, vidange, filtres air et habitacle, Haldex (Link Gengenbach GmbH DE)" },
    { date: "Sept. 2018", km: "125 334 km", operation: "Inspection, vidange, filtres, Multitronic, Zahnriemen (ACTU GmbH Hannover DE)" },
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
};

type MaintenanceHighlight = { icon: string; label: string; text: string; color: string };
const MAINTENANCE_HIGHLIGHTS: Record<string, MaintenanceHighlight[]> = {
  "audi-tt-mk2-sline-2010": [
    { icon: "📓", label: "Carnet d'origine", text: "Tampons de concessionnaires agréés Audi de mai 2010 à 2023", color: "#6B9FEE" },
    { icon: "🧾", label: "Factures originales", text: "Interventions récentes documentées (Midas, Autodoc, ByMyCar)", color: "#E8C36B" },
    { icon: "✓", label: "Contrôle technique", text: "2 CT favorables — dernier valide jusqu'au 28/01/2028", color: "#5BD89A" },
  ],
};

// Fiches d'avant le formulaire structuré : seules celles-ci utilisent le fallback legacy
// (données codées en dur + scan disque + heuristique de description).
const LEGACY_IDS = new Set<string>([
  ...Object.keys(MAINTENANCE_DATA),
  ...Object.keys(MAINTENANCE_HIGHLIGHTS),
]);

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function VehiculeDetailV2Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { t, locale }, session] = await Promise.all([params, getTranslations(), getAdminSession()]);
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) notFound();
  // Annonce masquée : visible uniquement par un admin connecté (jamais publiquement par URL directe)
  if (!v.isPublished && !session) notFound();

  const images = JSON.parse(v.images) as string[];
  const isEn = locale === "en";
  const features = JSON.parse(isEn && v.featuresEn ? v.featuresEn : v.features) as string[];
  const description = (isEn && v.descriptionEn) ? v.descriptionEn : v.description;

  // Le fallback legacy (données codées en dur + scan disque) ne concerne QUE les fiches
  // d'avant le formulaire structuré. Pour tout autre véhicule, un champ vide reste vide
  // (ne pas ressusciter d'anciennes données si l'admin vide volontairement une section).
  const isLegacy = LEGACY_IDS.has(id);

  // Documents : champ structuré ({url,label}) si renseigné, sinon scan du dossier /public (legacy)
  const dbDocuments = JSON.parse(v.documents || "[]") as { url: string; label?: string }[];
  const facturesPath = join(process.cwd(), "public", id, "factures");
  const fsDocuments = isLegacy && existsSync(facturesPath)
    ? readdirSync(facturesPath)
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
        .map((f) => `/${id}/factures/${f}`)
    : [];
  const documents: (string | { url: string; label?: string })[] =
    dbDocuments.length > 0 ? dbDocuments : fsDocuments;

  // Entretien : champ structuré si renseigné, sinon données legacy codées en dur
  const dbMaintenance = JSON.parse(v.maintenanceHistory || "[]") as MaintenanceEntry[];
  const maintenance = dbMaintenance.length > 0 ? dbMaintenance : (isLegacy ? (MAINTENANCE_DATA[id] ?? []) : []);

  // Badges de traçabilité : champ structuré (couleurs attribuées en cycle) sinon legacy
  const HIGHLIGHT_COLORS = ["#6B9FEE", "#E8C36B", "#5BD89A"];
  const dbHighlights = JSON.parse(v.maintenanceHighlights || "[]") as (Omit<MaintenanceHighlight, "color"> & { color?: string })[];
  const highlights: MaintenanceHighlight[] =
    dbHighlights.length > 0
      ? dbHighlights.map((h, i) => ({ ...h, color: h.color || HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] }))
      : (isLegacy ? (MAINTENANCE_HIGHLIGHTS[id] ?? []) : []);

  const { name, subtitle } = parseTitle(v.make, v.model, v.power);
  const categories = categorize(features);
  const pointsForts = features.slice(0, 6);
  const isSold = v.status === "vendu";
  const isAvailable = v.status === "disponible";

  const tm = t.vehicleModal;
  const tv = t.vehicles;
  const td = t.vehicleDetail;

  // État : champ structuré conditionFacts si renseigné ; sinon extraction heuristique (legacy uniquement)
  const dbConditionFacts = JSON.parse(v.conditionFacts || "[]") as string[];
  const useStructuredCondition = dbConditionFacts.length > 0;
  const useLegacyConditionHeuristic = !useStructuredCondition && isLegacy;

  const allParagraphs = (description?.split("\n\n") ?? []).filter(Boolean);
  const descParagraphs = allParagraphs.filter((p) => {
    const low = p.toLowerCase();
    // Toujours retirer les paragraphes marketing / CTA
    if (
      low.includes("intelligence automobile prend en charge") ||
      low.includes("essai disponible") ||
      low.includes("test drive available")
    )
      return false;
    // Heuristique legacy : retirer le paragraphe « état » seulement pour les fiches legacy non structurées
    if (useLegacyConditionHeuristic && (low.includes("accident") || low.includes("contrôle technique")))
      return false;
    return true;
  });

  let etatFacts: string[];
  if (useStructuredCondition) {
    etatFacts = dbConditionFacts;
  } else if (useLegacyConditionHeuristic) {
    const etatParagraph = allParagraphs.find(
      (p) =>
        p.toLowerCase().includes("accident") ||
        p.toLowerCase().includes("contrôle technique") ||
        p.toLowerCase().includes("mot valid") ||
        p.toLowerCase().includes("no accident")
    );
    etatFacts =
      etatParagraph
        ?.split(/\.\s+/)
        .map((s) => s.replace(/\.$/, "").trim())
        .filter(Boolean) ?? [];
  } else {
    etatFacts = [];
  }

  const fuelLabel = tv.fuelOptions.find((o) => o.value === v.fuel)?.label ?? v.fuel;

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

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <HeroCarousel images={images} alt={name} imgOpacity={isSold ? 0.45 : 1}>
          <div className="absolute top-28 left-6 lg:left-12 z-10">
            <Link
              href="/vehicules"
              className="inline-flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
              style={{ color: "#C8D8EE" }}
            >
              {td.backLink}
            </Link>
          </div>
          <div className="absolute top-28 right-6 lg:right-12 z-10">
            <span
              className="text-[9px] tracking-[0.3em] uppercase px-3 py-1.5"
              style={{
                backgroundColor: isAvailable ? "rgba(91,216,154,0.12)" : "transparent",
                color: isAvailable ? "#5BD89A" : "#C8D8EE",
                border: isAvailable ? "1px solid rgba(91,216,154,0.35)" : "1px solid #1B3055",
                borderRadius: "4px",
              }}
            >
              {isAvailable ? tm.available : isSold ? tm.sold : td.reserved}
            </span>
          </div>
        </HeroCarousel>

        {/* ── LAYOUT PRINCIPAL ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-20 pt-12 pb-28">

            {/* ── COLONNE GAUCHE (3/5) ── */}
            <div className="lg:col-span-3">

              {/* Marque · Origine */}
              <p className="text-xs tracking-[0.45em] uppercase mb-5" style={{ color: "#6B9FEE" }}>
                {v.make} · {v.origin}
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
                      className="text-sm tracking-[0.5em] uppercase font-bold flex-shrink-0"
                      style={{ color: "#F0F5FF" }}
                    >
                      {td.presentationSection}
                    </p>
                    <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(107,159,238,0.25)" }} />
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
                      className="text-sm tracking-[0.5em] uppercase font-bold flex-shrink-0"
                      style={{ color: "#F0F5FF" }}
                    >
                      {tm.highlights}
                    </p>
                    <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(107,159,238,0.25)" }} />
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
                          <span className="flex-shrink-0 text-xs font-bold mt-0.5" style={{ color: "#6B9FEE" }}>✓</span>
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
                      className="text-sm tracking-[0.5em] uppercase font-bold flex-shrink-0"
                      style={{ color: "#F0F5FF" }}
                    >
                      {tm.equipmentTitle}
                    </p>
                    <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(107,159,238,0.25)" }} />
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
                      className="text-sm tracking-[0.5em] uppercase font-bold flex-shrink-0"
                      style={{ color: "#F0F5FF" }}
                    >
                      Entretien &amp; Documents
                    </p>
                    <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(107,159,238,0.25)" }} />
                  </div>

                  <div style={sectionCardStyle}>
                    <EntretienDocumentsSection
                      maintenance={maintenance}
                      documents={documents}
                      interventionsLabel={tm.interventions}
                      showMoreLabel={td.showMoreInterventions}
                      showLessLabel={td.showLessInterventions}
                      highlights={highlights}
                    />
                  </div>
                </div>
              )}

              {/* Branding */}
              <div className="flex items-center gap-4 mt-8">
                <div style={{ width: "40px", height: "2px", backgroundColor: "#E8C36B", borderRadius: "1px" }} />
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
                      backgroundColor: "rgba(232,195,107,0.06)",
                    }}
                  >
                    <span
                      className="flex items-center justify-center flex-shrink-0 font-bold"
                      style={{
                        color: "#E8C36B",
                        fontSize: "10px",
                        width: "1.25rem",
                        height: "1.25rem",
                        backgroundColor: "rgba(232,195,107,0.15)",
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
                      {formatNumber(v.price)} €
                    </div>
                  </div>

                  {/* Specs 2×2 */}
                  <div
                    className="grid grid-cols-2 gap-px mx-6 mb-5"
                    style={{ backgroundColor: "rgba(107,159,238,0.15)" }}
                  >
                    {[
                      { label: tv.specMileage, value: `${formatNumber(v.mileage)} km` },
                      { label: td.circLabel, value: String(v.year) },
                      v.power ? { label: tv.specPower, value: `${v.power} ch` } : null,
                      { label: tv.specFuel, value: fuelLabel },
                      { label: tv.specGearbox, value: v.transmission },
                      { label: tv.specOrigin, value: v.origin },
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
                        <span className="font-bold flex-shrink-0" style={{ color: "#6B9FEE", fontSize: "11px" }}>✓</span>
                        <span className="text-xs tracking-wide" style={{ color: "#C8D8EE" }}>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2 mt-3">
                  {isAvailable ? (
                    <>
                      <Link
                        href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=reservation`}
                        className="block w-full text-center text-xs font-bold tracking-[0.2em] uppercase py-5 transition-all duration-300 hover:-translate-y-px hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                      >
                        {tm.reserveCta}
                      </Link>
                      <Link
                        href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=dossier`}
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
                        href="/contact"
                        className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-4 border"
                        style={{ borderColor: "rgba(107,159,238,0.25)", color: "#C8D8EE" }}
                      >
                        {td.mandatCta}
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
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=reservation`}
                    className="px-10 py-5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:-translate-y-px hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                  >
                    {tm.reserveCta}
                  </Link>
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=dossier`}
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
        {isAvailable && (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 py-3"
            style={{
              backgroundColor: "rgba(7,15,30,0.95)",
              borderTop: "1px solid rgba(107,159,238,0.2)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <Link
              href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=reservation`}
              className="block w-full text-center text-xs font-bold tracking-[0.2em] uppercase py-4"
              style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
            >
              {tm.reserveCta} · {formatNumber(v.price)} €
            </Link>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
