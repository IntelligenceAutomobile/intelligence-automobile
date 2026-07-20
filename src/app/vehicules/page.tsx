import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import VehiculesList from "@/app/vehicules/VehiculesList";
import Image from "next/image";
import HeroCta from "./HeroCta";
import { pageMetadata } from "@/lib/og";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = pageMetadata({
  title: "Nos véhicules — Intelligence Automobile",
  description: "Sélectionnés en Europe, contrôlés, documentés, prêts à livrer.",
  path: "/vehicules",
  image: "/og/vehicules.jpg",
});

export default async function VehiculesV2Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [params, session, { t }] = await Promise.all([searchParams, getAdminSession(), getTranslations()]);
  const isAdmin = !!session;

  const toInt = (value?: string) => {
    const n = value ? parseInt(value, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };

  const makeFilter = params.make;
  const modelFilter = params.model;
  const fuelFilter = params.fuel;
  const transmissionFilter = params.transmission;
  const maxPrice = toInt(params.maxPrice);
  const maxMileage = toInt(params.maxMileage);
  const minYear = toInt(params.minYear);
  const statusFilter = params.status ?? "disponible";

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.isPublished = true;
  if (statusFilter !== "tous") where.status = statusFilter;
  if (makeFilter) where.make = makeFilter;
  // `contains` et pas `equals` : le filtre porte sur une famille (« 911 », « Classe C »)
  // alors que la base stocke la finition complète (« 911 Carrera 4S »).
  if (modelFilter) where.model = { contains: modelFilter };
  if (fuelFilter) where.fuel = fuelFilter;
  if (transmissionFilter) where.transmission = transmissionFilter;
  if (maxPrice) where.price = { lte: maxPrice };
  if (maxMileage) where.mileage = { lte: maxMileage };
  if (minYear) where.year = { gte: minYear };

  // Marques et modèles proposés dans les menus : mêmes règles de visibilité que la grille.
  const facetWhere = isAdmin ? {} : { isPublished: true };

  const [vehicules, makes, modelRows] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      where: facetWhere,
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    }),
    prisma.vehicle.findMany({
      where: facetWhere,
      select: { make: true, model: true },
      distinct: ["make", "model"],
      orderBy: { model: "asc" },
    }),
  ]);

  const modelsByMake = modelRows.reduce<Record<string, string[]>>((acc, row) => {
    (acc[row.make] ??= []).push(row.model);
    return acc;
  }, {});

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO FULL-BLEED (plein écran, mobile + desktop) ── */}
        <section
          style={{
            position: "relative",
            height: "100dvh",
            minHeight: "520px",
            overflow: "hidden",
          }}
        >
          {/* Image plein écran */}
          <Image
            src="/Photo du Site/Photo IA/Image Nos véhicules.png"
            alt="Nos véhicules"
            fill
            priority
            style={{
              objectFit: "cover",
              opacity: 1.0,
            }}
          />

          {/* Overlay gauche */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, rgba(7,15,30,0.82) 0%, rgba(7,15,30,0.25) 55%, transparent 100%)",
            }}
          />

          {/* Overlay bas */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to top, #070F1E 0%, transparent 100%)",
            }}
          />

          {/* Texte ancré bas-gauche */}
          <div
            style={{
              position: "absolute",
              bottom: "8vh",
              left: "6vw",
              right: "6vw",
            }}
          >
            {/* H1 */}
            <h1
              style={{
                fontWeight: 900,
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                letterSpacing: "-0.04em",
                lineHeight: 0.88,
                color: "#F0F5FF",
                marginBottom: "1rem",
                maxWidth: "700px",
              }}
            >
              Nos
              <br />
              <span style={{ color: "#6B9FEE" }}>véhicules.</span>
            </h1>

            {/* Sous-titre */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
              <p
                style={{
                  color: "rgba(168,196,240,0.68)",
                  fontSize: "clamp(0.78rem, 1.1vw, 0.88rem)",
                  lineHeight: 1.8,
                  fontWeight: 400,
                  maxWidth: "440px",
                  fontStyle: "italic",
                  letterSpacing: "0.01em",
                }}
              >
                {t.vehicles.heroSubtitle}
              </p>
            </div>

            {/* Bouton primaire — scroll vers la liste */}
            <HeroCta />
          </div>
        </section>

        {/* ── LISTE DES VÉHICULES ── */}
        <div id="vehicules-list">
          <VehiculesList
            vehicules={vehicules}
            makes={makes.map((m) => m.make)}
            modelsByMake={modelsByMake}
            filters={{
              make: makeFilter,
              model: modelFilter,
              fuel: fuelFilter,
              transmission: transmissionFilter,
              maxPrice,
              maxMileage,
              minYear,
              status: statusFilter,
            }}
            isAdmin={isAdmin}
          />
        </div>

      </main>
      <Footer />
    </>
  );
}
