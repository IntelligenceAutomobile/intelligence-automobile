import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import VehiculesList from "@/app/vehicules/VehiculesList";
import Image from "next/image";
import HeroCta from "./HeroCta";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Nos véhicules V2 — Intelligence Automobile",
};

export default async function VehiculesV2Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [params, session, { t }] = await Promise.all([searchParams, getAdminSession(), getTranslations()]);
  const isAdmin = !!session;

  const makeFilter = params.make;
  const fuelFilter = params.fuel;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined;
  const statusFilter = params.status ?? "tous";

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.isPublished = true;
  if (statusFilter !== "tous") where.status = statusFilter;
  if (makeFilter) where.make = makeFilter;
  if (fuelFilter) where.fuel = fuelFilter;
  if (maxPrice) where.price = { lte: maxPrice };

  const [vehicules, makes] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    }),
  ]);

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO mobile : bande photo + titre dessous ── */}
        <section className="md:hidden" style={{ position: "relative", backgroundColor: "#070F1E" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", overflow: "hidden" }}>
            <Image
              src="/Photo du Site/Photo IA/Image Nos véhicules.png"
              alt="Nos véhicules"
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, #070F1E 0%, transparent 100%)" }} />
          </div>
          <div style={{ padding: "0.25rem 6vw 2.5rem" }}>
            <h1 style={{ fontWeight: 900, fontSize: "clamp(2.4rem, 11vw, 3.4rem)", letterSpacing: "-0.03em", lineHeight: 0.9, color: "#F0F5FF", marginBottom: "1rem" }}>
              Nos
              <br />
              <span style={{ color: "#6B9FEE" }}>véhicules.</span>
            </h1>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
              <p style={{ color: "rgba(168,196,240,0.68)", fontSize: "0.85rem", lineHeight: 1.8, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em" }}>
                {t.vehicles.heroSubtitle}
              </p>
            </div>
            <HeroCta />
          </div>
        </section>

        {/* ── HERO FULL-BLEED (desktop, inchangé) ── */}
        <section
          className="hidden md:block"
          style={{
            position: "relative",
            height: "100vh",
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
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
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
            filters={{ make: makeFilter, fuel: fuelFilter, maxPrice, status: statusFilter }}
            isAdmin={isAdmin}
          />
        </div>

      </main>
      <Footer />
    </>
  );
}
