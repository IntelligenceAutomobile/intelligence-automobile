import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import VehiculesList from "@/app/vehicules/VehiculesList";
import Image from "next/image";
import HeroCta from "./HeroCta";

export const metadata = {
  title: "Nos véhicules V2 — Intelligence Automobile",
};

export default async function VehiculesV2Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [params, session] = await Promise.all([searchParams, getAdminSession()]);
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

        {/* ── HERO FULL-BLEED ── */}
        <section
          style={{
            position: "relative",
            height: "80vh",
            overflow: "hidden",
          }}
        >
          {/* Image plein écran */}
          <Image
            src="/Photo du Site/New Photo HD/d-panyukov-76Y_UEcLFoE-unsplash.jpg"
            alt="Nos véhicules"
            fill
            priority
            style={{
              objectFit: "cover",
              opacity: 0.45,
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
              maxWidth: "700px",
            }}
          >
            {/* Label */}
            <p
              style={{
                color: "#8AABD4",
                fontSize: "0.8rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: "1.2rem",
              }}
            >
              Stock actuel · Coupés sport
            </p>

            {/* H1 */}
            <h1
              style={{
                fontWeight: 900,
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                letterSpacing: "-0.04em",
                lineHeight: 0.88,
                color: "#F0F5FF",
                marginBottom: "1.5rem",
                whiteSpace: "pre-line",
              }}
            >
              {"Nos\n"}
              <span style={{ color: "#6B9FEE" }}>véhicules.</span>
            </h1>

            {/* Sous-titre */}
            <p
              style={{
                color: "#8AABD4",
                fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
                lineHeight: 1.65,
                fontWeight: 300,
                maxWidth: "480px",
                marginBottom: "2.4rem",
              }}
            >
              Chaque véhicule est soigneusement sélectionné auprès de partenaires
              européens de confiance, rigoureusement contrôlé et documenté.
            </p>

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
