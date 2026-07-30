import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/format";
import { SITE_NAME } from "@/lib/og";
import JsonLd from "@/components/JsonLd";
import { vehicleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import VehiculeDetailView, {
  buildPresentation,
  type MaintenanceEntry,
  type MaintenanceHighlight,
  type VehiculeDetailModel,
} from "./VehiculeDetailView";

// ── Données legacy (fiches d'avant le formulaire structuré) ───────────────────
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

const MAINTENANCE_HIGHLIGHTS: Record<string, MaintenanceHighlight[]> = {
  "audi-tt-mk2-sline-2010": [
    { icon: "📓", label: "Carnet d'origine", text: "Tampons de concessionnaires agréés Audi de mai 2010 à 2023", color: "#6B9FEE" },
    { icon: "🧾", label: "Factures originales", text: "Interventions récentes documentées (Midas, Autodoc, ByMyCar)", color: "#C6CCD6" },
    { icon: "✓", label: "Contrôle technique", text: "2 CT favorables, dernier valide jusqu'au 28/01/2028", color: "#5BD89A" },
  ],
};

// Seules ces fiches utilisent le fallback legacy (données codées en dur + scan disque + heuristique).
const LEGACY_IDS = new Set<string>([
  ...Object.keys(MAINTENANCE_DATA),
  ...Object.keys(MAINTENANCE_HIGHLIGHTS),
]);

// La page et ses métadonnées ont besoin du même véhicule : `cache` fait tenir les
// deux appels en une seule requête par rendu.
const getVehicle = cache((id: string) => prisma.vehicle.findUnique({ where: { id } }));

// ── Métadonnées de partage ───────────────────────────────────────────────────
// Titre, description et photo repris par WhatsApp, LinkedIn, Google… La photo
// passe par /og-image, qui la recadre et l'allège (voir og-image/route.ts).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const v = await getVehicle(id);

  // Fiche masquée : un admin connecté la consulte, sans qu'elle s'expose au partage.
  if (!v?.isPublished) return {};

  const title = `${v.make} ${v.model} ${v.year} — ${SITE_NAME}`;
  const description = [
    `${formatNumber(v.mileage)} km`,
    v.fuel,
    v.transmission,
    `${formatNumber(v.price)} €`,
  ]
    .filter(Boolean)
    .join(" · ");
  const path = `/vehicules/${id}`;
  const image = `${path}/og-image`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "fr_FR",
      title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: `${v.make} ${v.model} ${v.year}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function VehiculeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { t, locale }, session] = await Promise.all([params, getTranslations(), getAdminSession()]);
  const v = await getVehicle(id);
  if (!v) notFound();
  // Annonce masquée : visible uniquement par un admin connecté (jamais publiquement par URL directe)
  if (!v.isPublished && !session) notFound();

  const images = JSON.parse(v.images) as string[];
  const isEn = locale === "en";
  const features = JSON.parse(isEn && v.featuresEn ? v.featuresEn : v.features) as string[];
  const description = (isEn && v.descriptionEn) ? v.descriptionEn : v.description;

  // Le fallback legacy ne concerne QUE les fiches d'avant le formulaire structuré.
  // Pour tout autre véhicule, un champ vide reste vide.
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
  const HIGHLIGHT_COLORS = ["#6B9FEE", "#C6CCD6", "#5BD89A"];
  const dbHighlights = JSON.parse(v.maintenanceHighlights || "[]") as (Omit<MaintenanceHighlight, "color"> & { color?: string })[];
  const highlights: MaintenanceHighlight[] =
    dbHighlights.length > 0
      ? dbHighlights.map((h, i) => ({ ...h, color: h.color || HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] }))
      : (isLegacy ? (MAINTENANCE_HIGHLIGHTS[id] ?? []) : []);

  // État + présentation : champ structuré conditionFacts si renseigné ;
  // sinon extraction heuristique (legacy uniquement).
  const dbConditionFacts = JSON.parse(v.conditionFacts || "[]") as string[];
  const useStructuredCondition = dbConditionFacts.length > 0;
  const useLegacyConditionHeuristic = !useStructuredCondition && isLegacy;

  let descParagraphs: string[];
  let etatFacts: string[];
  if (useLegacyConditionHeuristic) {
    const allParagraphs = (description?.split("\n\n") ?? []).filter(Boolean);
    descParagraphs = allParagraphs.filter((p) => {
      const low = p.toLowerCase();
      if (
        low.includes("intelligence automobile prend en charge") ||
        low.includes("essai disponible") ||
        low.includes("test drive available")
      )
        return false;
      if (low.includes("accident") || low.includes("contrôle technique")) return false;
      return true;
    });
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
    ({ descParagraphs, etatFacts } = buildPresentation(description, dbConditionFacts));
  }

  const model: VehiculeDetailModel = {
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    power: v.power,
    color: v.color,
    transmission: v.transmission,
    fuel: v.fuel,
    origin: v.origin,
    status: v.status,
    descParagraphs,
    etatFacts,
    features,
    maintenance,
    documents,
    highlights,
    images,
  };

  return (
    <>
      {/* Réservé aux fiches publiées : une annonce masquée que consulte un admin
          reste hors des données structurées, comme elle est hors du partage. */}
      {v.isPublished && (
        <>
          <JsonLd data={vehicleJsonLd(v, images)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Accueil", path: "/" },
              { name: "Nos véhicules", path: "/vehicules" },
              { name: `${v.make} ${v.model} ${v.year}`, path: `/vehicules/${id}` },
            ])}
          />
        </>
      )}
      <Header />
      <VehiculeDetailView model={model} t={t} isOnline={v.isPublished} />
      <Footer />
    </>
  );
}
