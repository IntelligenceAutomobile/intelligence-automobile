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

// ── Fiches legacy (créées avant le formulaire structuré) ─────────────────────
// Leur entretien et leurs badges vivent désormais en base, comme partout
// ailleurs, donc modifiables depuis l'administration. Il leur reste deux
// béquilles : les documents lus depuis le dossier /public et l'extraction de la
// section « État » à partir de la description. Renseigner ces deux champs dans
// le formulaire suffit à s'en passer, la base prend alors le dessus.
const LEGACY_IDS = new Set<string>([
  "audi-tt-mk3-sline-2014",
  "audi-tt-mk2-sline-2010",
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

  // Entretien
  const maintenance = JSON.parse(v.maintenanceHistory || "[]") as MaintenanceEntry[];

  // Badges de traçabilité : couleurs attribuées en cycle
  const HIGHLIGHT_COLORS = ["#6B9FEE", "#C6CCD6", "#5BD89A"];
  const dbHighlights = JSON.parse(v.maintenanceHighlights || "[]") as (Omit<MaintenanceHighlight, "color"> & { color?: string })[];
  const highlights: MaintenanceHighlight[] = dbHighlights.map((h, i) => ({
    ...h,
    color: h.color || HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length],
  }));

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
    saleRegime: v.saleRegime,
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
      <VehiculeDetailView model={model} t={t} vehicleId={id} />
      <Footer />
    </>
  );
}
