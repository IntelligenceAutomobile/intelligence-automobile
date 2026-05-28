import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
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
  const params = await searchParams;
  const makeFilter = params.make;
  const fuelFilter = params.fuel;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : undefined;
  const statusFilter = params.status ?? "tous";

  const where: Record<string, unknown> = {};
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

        {/* ── HERO ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", paddingTop: "80px" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Sélection en cours
            </p>
            <h1
              className="font-black uppercase leading-[0.9] mb-8"
              style={{
                fontSize: "clamp(3.2rem, 7.5vw, 7rem)",
                letterSpacing: "-0.025em",
              }}
            >
              Nos
              <br />
              <span style={{ color: "#6B9FEE" }}>véhicules.</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-lg"
              style={{ color: "#8AABD4", fontWeight: 300 }}
            >
              Chaque véhicule est sourcé sur les marchés allemand et belge selon
              des critères stricts d&apos;historique, de configuration et de
              potentiel de revente.
            </p>
          </div>
        </section>

        <VehiculesList
          vehicules={vehicules}
          makes={makes.map((m) => m.make)}
          filters={{ make: makeFilter, fuel: fuelFilter, maxPrice, status: statusFilter }}
        />

      </main>
      <Footer />
    </>
  );
}
