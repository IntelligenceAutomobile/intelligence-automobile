import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/HeroCarousel";

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

  if (power && parts.length > 0) {
    parts[0] = `${parts[0]} ${power} ch`;
  }

  return {
    name: `${make} ${namePart}`,
    subtitle: parts.join(" — "),
  };
}

const CATEGORIES: { label: string; keys: string[] }[] = [
  { label: "Motorisation", keys: ["hybride", "électrique", "chargeur", "boîte", "norme", "consommation", "phev", "e-tron", "quattro", "s tronic", "dsg"] },
  { label: "Design & S line", keys: ["pack s line", "jante", "bouclier", "bas de caisse", "feux", "led", "spoiler", "diffuseur", "échappement", "carbone", "phare"] },
  { label: "Confort & Technologie", keys: ["siège", "volant", "climat", "démarrage", "rétroviseur", "navigation", "bluetooth", "régulateur", "caméra", "keyless", "virtual", "mmi", "b&o", "bang", "éclairage", "vitres", "connectivité"] },
  { label: "Sécurité", keys: ["airbag", "esp", "asr", "stationnement", "isofix", "frein"] },
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

function whyCopy(fuel: string, make: string) {
  if (fuel === "Hybride")
    return `Compacte premium à motorisation hybride rechargeable, idéale pour un usage mixte ville/route. Faible consommation, finition sportive S line et polyvalence au quotidien : une sélection rare et cohérente sur le marché de l'import européen.`;
  if (fuel === "Électrique")
    return `Véhicule 100% électrique premium, issu du marché européen avec une configuration rare et un historique transparent. Autonomie élevée, équipements haut de gamme et zéro compromis sur le plaisir de conduite.`;
  return `${make} de référence sur son segment, sélectionnée pour la cohérence de sa configuration, la rigueur de son historique et son potentiel de valeur résiduelle. Une acquisition maîtrisée, accompagnée de A à Z.`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function VehiculeDetailV2Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) notFound();

  const images = JSON.parse(v.images) as string[];
  const features = JSON.parse(v.features) as string[];
  const { name, subtitle } = parseTitle(v.make, v.model, v.power);
  const categories = categorize(features);
  const pointsForts = features.slice(0, 6);
  const isSold = v.status === "vendu";
  const isAvailable = v.status === "disponible";

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <HeroCarousel images={images} alt={name} imgOpacity={isSold ? 0.45 : 0.82}>
          {/* Retour */}
          <div className="absolute top-28 left-6 lg:left-12 z-10">
            <Link href="/vehicules" className="inline-flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase transition-colors" style={{ color: "#8AABD4" }}>
              ← Nos véhicules
            </Link>
          </div>

          {/* Badge statut */}
          <div className="absolute top-28 right-6 lg:right-12 z-10">
            <span
              className="text-[9px] tracking-[0.3em] uppercase px-4 py-2"
              style={{
                backgroundColor: isAvailable ? "#6B9FEE" : "transparent",
                color: isAvailable ? "#070F1E" : "#8AABD4",
                border: isAvailable ? "none" : "1px solid #1B3055",
              }}
            >
              {isAvailable ? "Disponible" : isSold ? "Vendu" : "Réservé"}
            </span>
          </div>
        </HeroCarousel>

        {/* ── CONTENU PRINCIPAL ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 pt-10 pb-20">

            {/* ── COLONNE GAUCHE (3/5) ── */}
            <div className="lg:col-span-3">

              {/* Marque + origine */}
              <p className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
                {v.make} · {v.origin}
              </p>

              {/* Titre hiérarchisé */}
              <h1
                className="font-black uppercase leading-[0.88] mb-3"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", letterSpacing: "-0.025em" }}
              >
                {name}
              </h1>
              {subtitle && (
                <p className="mb-10 font-light tracking-wide" style={{ color: "#8AABD4", fontSize: "clamp(0.85rem, 1.5vw, 1.05rem)" }}>
                  {subtitle}
                </p>
              )}

              {/* Specs primaires — 4 badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-2" style={{ backgroundColor: "#1B3055" }}>
                {[
                  { label: "Année", value: String(v.year) },
                  { label: "Kilométrage", value: `${v.mileage.toLocaleString("fr-FR")} km` },
                  { label: "Carburant", value: v.fuel },
                  { label: "Boîte", value: v.transmission },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center justify-center py-6 px-4 text-center" style={{ backgroundColor: "#0D1A2D" }}>
                    <span className="text-[8px] tracking-[0.35em] uppercase mb-2" style={{ color: "#6B9FEE" }}>{s.label}</span>
                    <span className="font-black text-base" style={{ color: "#F0F5FF" }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Specs secondaires */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 mb-10 mt-4">
                {[
                  v.power ? `${v.power} ch` : null,
                  v.color,
                  `Origine ${v.origin}`,
                ].filter(Boolean).map((s) => (
                  <span key={s} className="text-[10px] tracking-[0.2em]" style={{ color: "#1B3055" }}>
                    {s}
                  </span>
                ))}
              </div>

              <div className="mb-10" style={{ borderTop: "1px solid #1B3055" }} />

              {/* Points forts */}
              {pointsForts.length > 0 && (
                <div className="mb-10">
                  <p className="text-[9px] tracking-[0.4em] uppercase mb-5" style={{ color: "#8AABD4" }}>
                    Points forts
                  </p>
                  <ul className="flex flex-col gap-3">
                    {pointsForts.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                        <span className="mt-0.5 flex-shrink-0" style={{ color: "#6B9FEE" }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-10" style={{ borderTop: "1px solid #1B3055" }} />

              {/* Description courte */}
              {v.description && (
                <div className="mb-10">
                  <p className="text-sm leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    {v.description.split("\n\n")[0]}
                  </p>
                </div>
              )}

              <div className="mb-10" style={{ borderTop: "1px solid #1B3055" }} />

              {/* Pourquoi ce véhicule ? */}
              <div className="mb-10">
                <p className="text-[9px] tracking-[0.4em] uppercase mb-4" style={{ color: "#8AABD4" }}>
                  Pourquoi ce véhicule ?
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  {whyCopy(v.fuel, v.make)}
                </p>
              </div>

              {/* Branding IA */}
              <div className="flex items-center gap-4 mt-12">
                <div style={{ width: "24px", height: "1px", backgroundColor: "#6B9FEE" }} />
                <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: "#6B9FEE" }}>
                  Sélection premium — Intelligence Automobile
                </span>
              </div>
            </div>

            {/* ── COLONNE DROITE (2/5) ── */}
            <div className="lg:col-span-2 lg:pt-16">

              {/* Encart prix */}
              <div
                className="p-8 mb-6"
                style={{ backgroundColor: "#0D1A2D", border: "1px solid #1B3055" }}
              >
                <p className="text-[8px] tracking-[0.4em] uppercase mb-3" style={{ color: "#6B9FEE" }}>
                  Prix
                </p>
                <div
                  className="font-black leading-none mb-5"
                  style={{ fontSize: "clamp(2.8rem, 5vw, 4rem)", letterSpacing: "-0.03em", color: "#F0F5FF" }}
                >
                  {v.price.toLocaleString("fr-FR")} €
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#6B9FEE", fontSize: "10px" }}>✓</span>
                    <span className="text-[10px] tracking-wide" style={{ color: "#8AABD4" }}>Garantie 12 mois incluse</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#6B9FEE", fontSize: "10px" }}>✓</span>
                    <span className="text-[10px] tracking-wide" style={{ color: "#8AABD4" }}>Financement possible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#6B9FEE", fontSize: "10px" }}>✓</span>
                    <span className="text-[10px] tracking-wide" style={{ color: "#8AABD4" }}>Démarches administratives prises en charge</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              {isAvailable ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=essai`}
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 transition-all duration-300"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Demander un essai
                  </Link>
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=dossier`}
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 border transition-all duration-300"
                    style={{ borderColor: "#1B3055", color: "#8AABD4" }}
                  >
                    Recevoir le dossier complet
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs mb-4" style={{ color: "#1B3055" }}>
                    Ce véhicule a déjà trouvé preneur. Découvrez notre stock ou confiez-nous un mandat d&apos;import.
                  </p>
                  <Link
                    href="/vehicules"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Voir le stock disponible
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full text-center text-xs font-semibold tracking-widest uppercase py-5 border"
                    style={{ borderColor: "#1B3055", color: "#8AABD4" }}
                  >
                    Mandat d&apos;import sur-mesure
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── GALERIE ── */}
          {images.length > 1 && (
            <div className="border-t pb-20" style={{ borderColor: "#1B3055", paddingTop: "3rem" }}>
              <p className="text-[9px] tracking-[0.4em] uppercase mb-8" style={{ color: "#8AABD4" }}>
                Galerie — {images.length} photos
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ backgroundColor: "#1B3055" }}>
                {images.map((img, i) => (
                  <div key={i} className="overflow-hidden" style={{ aspectRatio: "16/10", backgroundColor: "#070F1E" }}>
                    <img
                      src={img}
                      alt={`${name} — photo ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉQUIPEMENTS PAR CATÉGORIE ── */}
          {categories.length > 0 && (
            <div className="border-t pb-20" style={{ borderColor: "#1B3055", paddingTop: "3rem" }}>
              <p className="text-[9px] tracking-[0.4em] uppercase mb-10" style={{ color: "#8AABD4" }}>
                Équipements
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {categories.map((cat) => (
                  <div key={cat.label}>
                    <p className="text-[9px] tracking-[0.35em] uppercase mb-5 pb-3" style={{ color: "#6B9FEE", borderBottom: "1px solid #1B3055" }}>
                      {cat.label}
                    </p>
                    <ul className="flex flex-col gap-3">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#8AABD4", fontWeight: 300 }}>
                          <span className="flex-shrink-0 mt-0.5" style={{ color: "#1B3055" }}>—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA FINAL ── */}
          <div className="border-t pb-20" style={{ borderColor: "#1B3055", paddingTop: "4rem" }}>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-[9px] tracking-[0.4em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
                Essai disponible sur rendez-vous
              </p>
              <h2
                className="font-black uppercase leading-tight mb-6"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", letterSpacing: "-0.02em" }}
              >
                Contactez Intelligence Automobile pour une présentation complète.
              </h2>
              <p className="text-sm mb-10" style={{ color: "#8AABD4", fontWeight: 300 }}>
                Inspection, financement, immatriculation — nous gérons tout.
              </p>
              {isAvailable && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=essai`}
                    className="px-10 py-5 text-xs font-semibold tracking-widest uppercase transition-all duration-300"
                    style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                  >
                    Demander un essai
                  </Link>
                  <Link
                    href={`/contact?vehicule=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&sujet=dossier`}
                    className="px-10 py-5 text-xs font-semibold tracking-widest uppercase border transition-all duration-300"
                    style={{ borderColor: "#6B9FEE", color: "#6B9FEE" }}
                  >
                    Recevoir le dossier complet
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
