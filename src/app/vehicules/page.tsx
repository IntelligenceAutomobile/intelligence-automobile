import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import VehiculesList from "./VehiculesList";

export const metadata = {
  title: "Nos véhicules — Intelligence Automobile",
  description:
    "Découvrez notre sélection de véhicules premium importés d'Allemagne et de Belgique.",
};

export default async function VehiculesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [params, session] = await Promise.all([searchParams, getAdminSession()]);
  const isAdmin = !!session;

  const makeFilter = params.make;
  const modelFilter = params.model;
  const fuelFilter = params.fuel;
  const transmissionFilter = params.transmission;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined;
  const maxMileage = params.maxMileage ? parseInt(params.maxMileage) : undefined;
  const minYear = params.minYear ? parseInt(params.minYear) : undefined;
  const statusFilter = params.status ?? "tous";

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.isPublished = true;
  if (statusFilter !== "tous") where.status = statusFilter;
  if (makeFilter) where.make = makeFilter;
  if (modelFilter) where.model = { contains: modelFilter };
  if (fuelFilter) where.fuel = fuelFilter;
  if (transmissionFilter) where.transmission = { contains: transmissionFilter };
  if (maxPrice) where.price = { lte: maxPrice };
  if (maxMileage) where.mileage = { lte: maxMileage };
  if (minYear) where.year = { gte: minYear };

  const [vehicules, makes, makeModels] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    }),
    prisma.vehicle.findMany({
      select: { make: true, model: true },
      distinct: ["make", "model"],
      orderBy: { model: "asc" },
    }),
  ]);

  const modelsByMake: Record<string, string[]> = {};
  for (const { make, model } of makeModels) {
    (modelsByMake[make] ??= []).push(model);
  }

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <section
          className="border-b"
          style={{
            borderColor: "#1B3055",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
            <h1
              className="font-black uppercase leading-[0.9] mb-8"
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                letterSpacing: "-0.025em",
              }}
            >
              Nos
              <br />
              <span style={{ color: "#6B9FEE" }}>véhicules.</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-lg"
              style={{ color: "#C8D8EE", fontWeight: 400 }}
            >
              Chaque véhicule est soigneusement sélectionné auprès de partenaires
              européens de confiance, rigoureusement contrôlé et documenté, pour
              vous garantir une transparence totale et une expérience d&apos;achat
              sereine.
            </p>
          </div>
        </section>

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

      </main>
      <Footer />
    </>
  );
}
