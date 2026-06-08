import { notFound } from "next/navigation";
import Link from "next/link";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import HeroCarousel from "@/components/HeroCarousel";
import DocumentsSection from "./DocumentsSection";
import GalleryLightbox from "./GalleryLightbox";

export default async function VehiculeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [v, session] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id } }),
    getAdminSession(),
  ]);
  if (!v) notFound();
  if (!v.isPublished && !session) notFound();

  const images = JSON.parse(v.images) as string[];
  const features = JSON.parse(v.features) as string[];

  const facturesPath = join(process.cwd(), "public", id, "factures");
  const documents = existsSync(facturesPath)
    ? readdirSync(facturesPath)
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
        .map((f) => `/${id}/factures/${f}`)
    : [];

  const specs = [
    { label: "Année", value: String(v.year) },
    { label: "Kilométrage", value: `${v.mileage.toLocaleString("fr-FR")} km` },
    { label: "Carburant", value: v.fuel },
    { label: "Boîte", value: v.transmission },
    { label: "Couleur", value: v.color },
    { label: "Origine", value: v.origin },
    ...(v.power ? [{ label: "Puissance", value: `${v.power} ch` }] : []),
  ];

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── IMAGE HERO ── */}
        <HeroCarousel images={images} alt={`${v.make} ${v.model}`} imgOpacity={1}>
          {/* Retour */}
          <div className="absolute top-28 left-6 lg:left-12 z-10">
            <Link
              href="/vehicules"
              className="inline-flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase transition-colors"
              style={{ color: "#C8D8EE" }}
            >
              ← Nos véhicules
            </Link>
          </div>

          {/* Badge statut */}
          <div className="absolute top-28 right-6 lg:right-12 z-10 flex gap-2">
            {session && !v.isPublished && (
              <span
                className="text-[9px] tracking-[0.3em] uppercase px-3 py-2"
                style={{ backgroundColor: "#FF6B35", color: "#070F1E" }}
              >
                Masqué
              </span>
            )}
            <span
              className="text-[9px] tracking-[0.3em] uppercase px-3 py-2"
              style={{
                backgroundColor: v.status === "disponible" ? "#6B9FEE" : "#1B3055",
                color: v.status === "disponible" ? "#070F1E" : "#C8D8EE",
              }}
            >
              {v.status === "disponible" ? "Disponible" : v.status === "vendu" ? "Vendu" : "Réservé"}
            </span>
          </div>
        </HeroCarousel>

        {/* ── CONTENU ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-8 pb-20">

            {/* Colonne gauche : identité + specs */}
            <div>
              <p
                className="text-xs tracking-[0.35em] uppercase mb-5"
                style={{ color: "#6B9FEE" }}
              >
                {v.make} · {v.origin}
              </p>
              <h1
                className="font-black uppercase leading-[0.9] mb-12"
                style={{
                  fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                  letterSpacing: "-0.025em",
                }}
              >
                {v.model}
              </h1>

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-0 mb-12">
                {specs.map((item, i) => (
                  <div
                    key={item.label}
                    className="py-5 pr-6"
                    style={{
                      borderTop: "1px solid #1B3055",
                      borderBottom: i >= specs.length - 2 ? "1px solid #1B3055" : "none",
                    }}
                  >
                    <div
                      className="text-[9px] tracking-[0.3em] uppercase mb-2"
                      style={{ color: "#C8D8EE" }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "#F0F5FF" }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {v.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#C8D8EE", fontWeight: 400 }}
                >
                  {v.description}
                </p>
              )}
            </div>

            {/* Colonne droite : prix + CTA */}
            <div className="lg:pt-20">
              <div
                className="pb-8 mb-8"
                style={{ borderBottom: "1px solid #1B3055" }}
              >
                <p
                  className="text-[9px] tracking-[0.3em] uppercase mb-4"
                  style={{ color: "#C8D8EE" }}
                >
                  Prix
                </p>
                <div
                  className="font-black leading-none"
                  style={{
                    fontSize: "clamp(3.5rem, 6.5vw, 5.5rem)",
                    letterSpacing: "-0.03em",
                    color: "#F0F5FF",
                  }}
                >
                  {v.price.toLocaleString("fr-FR")} €
                </div>
              </div>

              {v.status === "disponible" ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}`}
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 transition-all duration-300"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Demander des informations
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 border transition-all duration-300"
                    style={{ borderColor: "#1B3055", color: "#C8D8EE" }}
                  >
                    Nous contacter
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm mb-4" style={{ color: "#C8D8EE" }}>
                    Ce véhicule n&apos;est plus disponible. Découvrez notre stock actuel ou confiez-nous un mandat d&apos;import.
                  </p>
                  <Link
                    href="/vehicules"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Voir le stock
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 border"
                    style={{ borderColor: "#1B3055", color: "#C8D8EE" }}
                  >
                    Mandat d&apos;import
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── GALERIE ── */}
          {images.length > 1 && (
            <div
              className="border-t pb-20"
              style={{ borderColor: "#1B3055", paddingTop: "3rem" }}
            >
              <p
                className="text-[9px] tracking-[0.35em] uppercase mb-8"
                style={{ color: "#C8D8EE" }}
              >
                Photos
              </p>
              <GalleryLightbox images={images} alt={`${v.make} ${v.model}`} />
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {documents.length > 0 && (
            <DocumentsSection documents={documents} />
          )}

          {/* ── ÉQUIPEMENTS ── */}
          {features.length > 0 && (
            <div
              className="border-t pb-20"
              style={{ borderColor: "#1B3055", paddingTop: "3rem" }}
            >
              <p
                className="text-[9px] tracking-[0.35em] uppercase mb-8"
                style={{ color: "#C8D8EE" }}
              >
                Équipements
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
                {features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "#C8D8EE" }}
                  >
                    <span style={{ color: "#6B9FEE" }}>—</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CTA FINAL ── */}
        <div className="border-t" style={{ borderColor: "#1B3055" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-2"
                style={{ color: "#6B9FEE" }}
              >
                Votre prochain véhicule
              </p>
              <p className="text-sm" style={{ color: "#C8D8EE", fontWeight: 400 }}>
                Vous ne trouvez pas votre bonheur ? Confiez-nous un mandat d&apos;import sur-mesure.
              </p>
            </div>
            <Link
              href="/vehicules"
              className="flex-shrink-0 px-8 py-4 text-xs font-semibold tracking-widest uppercase border-2 transition-all duration-300"
              style={{ borderColor: "#1B3055", color: "#F0F5FF" }}
            >
              ← Retour au stock
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
