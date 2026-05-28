import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export default async function VehiculeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) notFound();

  const images = JSON.parse(v.images) as string[];
  const features = JSON.parse(v.features) as string[];

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
        <div
          className="relative w-full"
          style={{ height: "70vh", minHeight: "420px", paddingTop: "80px" }}
        >
          {images[0] ? (
            <img
              src={images[0]}
              alt={`${v.make} ${v.model}`}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ opacity: 0.8 }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "#0D1A2D" }}
            >
              <span
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "#1B3055" }}
              >
                Photos à venir
              </span>
            </div>
          )}

          {/* Overlays */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(7,15,30,0.35) 0%, transparent 40%, #070F1E 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #070F1E 0%, transparent 25%)",
            }}
          />

          {/* Retour */}
          <div className="absolute top-28 left-6 lg:left-12 z-10">
            <Link
              href="/vehicules"
              className="inline-flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase transition-colors"
              style={{ color: "#8AABD4" }}
            >
              ← Nos véhicules
            </Link>
          </div>

          {/* Badge statut */}
          <div className="absolute top-28 right-6 lg:right-12 z-10">
            <span
              className="text-[9px] tracking-[0.3em] uppercase px-3 py-2"
              style={{
                backgroundColor: v.status === "disponible" ? "#6B9FEE" : "#1B3055",
                color: v.status === "disponible" ? "#070F1E" : "#8AABD4",
              }}
            >
              {v.status === "disponible" ? "Disponible" : v.status === "vendu" ? "Vendu" : "Réservé"}
            </span>
          </div>
        </div>

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
                      style={{ color: "#8AABD4" }}
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
                  style={{ color: "#8AABD4", fontWeight: 300 }}
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
                  style={{ color: "#8AABD4" }}
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
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 rounded-full transition-all duration-300"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Demander des informations
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 border transition-all duration-300"
                    style={{ borderColor: "#1B3055", color: "#8AABD4" }}
                  >
                    Nous contacter
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm mb-4" style={{ color: "#8AABD4" }}>
                    Ce véhicule n&apos;est plus disponible. Découvrez notre stock actuel ou confiez-nous un mandat d&apos;import.
                  </p>
                  <Link
                    href="/vehicules"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 rounded-full"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Voir le stock
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 border"
                    style={{ borderColor: "#1B3055", color: "#8AABD4" }}
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
                style={{ color: "#8AABD4" }}
              >
                Photos
              </p>
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-px"
                style={{ backgroundColor: "#1B3055" }}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="overflow-hidden"
                    style={{ aspectRatio: "16/10", backgroundColor: "#070F1E" }}
                  >
                    <img
                      src={img}
                      alt={`${v.make} ${v.model} — photo ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉQUIPEMENTS ── */}
          {features.length > 0 && (
            <div
              className="border-t pb-20"
              style={{ borderColor: "#1B3055", paddingTop: "3rem" }}
            >
              <p
                className="text-[9px] tracking-[0.35em] uppercase mb-8"
                style={{ color: "#8AABD4" }}
              >
                Équipements
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
                {features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "#8AABD4" }}
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
              <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                Vous ne trouvez pas votre bonheur ? Confiez-nous un mandat d&apos;import sur-mesure.
              </p>
            </div>
            <Link
              href="/vehicules"
              className="flex-shrink-0 px-8 py-4 text-xs font-semibold tracking-widest uppercase rounded-full border-2 transition-all duration-300"
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
