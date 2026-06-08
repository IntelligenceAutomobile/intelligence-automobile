import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Notre méthode — Intelligence Automobile",
  description:
    "Découvrez la méthode structurée d'Intelligence Automobile pour un import automobile sécurisé, transparent et maîtrisé.",
};

const steps = [
  {
    num: "01",
    title: "Analyse du marché",
    description:
      "Nous suivons quotidiennement les marchés européens — AutoScout24 Allemagne, Mobile.de, 2ememain.be — pour identifier les opportunités présentant un différentiel de prix favorable par rapport au marché français, une fois tous les coûts d'import intégrés.",
  },
  {
    num: "02",
    title: "Sélection rigoureuse",
    description:
      "Chaque annonce sélectionnée est analysée selon des critères précis : historique d'entretien (carnet à jour, réseau officiel), cohérence du kilométrage, absence d'accident déclaré, configuration attractive et liquidité sur le marché français.",
  },
  {
    num: "03",
    title: "Vérification sur place",
    description:
      "Avant tout achat, le véhicule est inspecté directement ou via un expert certifié. Contrôle technique, lecture des données OBD, vérification des documents et de l'identité du vendeur. Aucune acquisition sans validation complète.",
  },
  {
    num: "04",
    title: "Acquisition sécurisée",
    description:
      "La transaction est réalisée dans un cadre légal sécurisé. Contrat de vente conforme, vérification de l'absence de gage ou de vol (HPI check pour les véhicules allemands), et paiement sécurisé.",
  },
  {
    num: "05",
    title: "Import & conformité",
    description:
      "Nous gérons l'intégralité des démarches : certificat de conformité européen, quitus fiscal si nécessaire, demande de carte grise française. Le véhicule est pris en charge dès son arrivée en France.",
  },
  {
    num: "06",
    title: "Préparation & remise",
    description:
      "Avant toute mise en vente ou remise au client, le véhicule est préparé : nettoyage intérieur/extérieur, petites remises en état esthétiques si nécessaire, photos professionnelles. Vous recevez un véhicule prêt à l'emploi.",
  },
];

const pillars = [
  {
    title: "Discipline financière",
    desc: "Chaque acquisition est conditionnée à une marge minimale identifiée avant engagement. Pas d'achat coup de cœur, pas de prise de risque non mesurée.",
  },
  {
    title: "Stock limité",
    desc: "Nous maintenons volontairement un faible nombre de véhicules simultanément en stock, pour préserver notre capacité financière et garantir notre attention sur chaque dossier.",
  },
  {
    title: "Rotation rapide",
    desc: "L'objectif est de vendre chaque véhicule en moins de 30 jours. Une sélection pertinente et un prix juste permettent une liquidité rapide du stock.",
  },
  {
    title: "Transparence client",
    desc: "Tous les coûts sont communiqués : prix d'achat à l'étranger, transport, conformité, préparation. Rien n'est caché, tout est détaillé.",
  },
];

export default function MethodePage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", paddingTop: "80px", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Comment nous travaillons
            </p>
            <h1
              className="font-black uppercase leading-[0.9] mb-8"
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                letterSpacing: "-0.025em",
              }}
            >
              Notre
              <br />
              <span style={{ color: "#6B9FEE" }}>méthode.</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-lg"
              style={{ color: "#C8D8EE", fontWeight: 400 }}
            >
              L&apos;import automobile peut être très rentable — ou très risqué.
              Notre méthode transforme cette complexité en un processus structuré,
              maîtrisé et reproductible.
            </p>
          </div>
        </section>

        {/* ── CHIFFRES CLÉS ── */}
        <section className="border-b" style={{ borderColor: "#1B3055" }}>
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-px"
            style={{ backgroundColor: "#1B3055" }}
          >
            {[
              { value: "6", label: "Étapes structurées, de la recherche à la remise" },
              { value: "12–15h", label: "Temps moyen consacré par véhicule" },
              { value: "< 30j", label: "Durée de détention objectif par véhicule" },
              { value: "100%", label: "Des démarches administratives prises en charge" },
            ].map((stat) => (
              <div
                key={stat.value}
                className="p-8 lg:p-10"
                style={{ backgroundColor: "#070F1E" }}
              >
                <span
                  className="block font-black leading-none mb-3"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    letterSpacing: "-0.02em",
                    color: "#F0F5FF",
                  }}
                >
                  {stat.value}
                </span>
                <span className="text-xs leading-snug" style={{ color: "#C8D8EE" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── LES 6 ÉTAPES ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Le processus
            </p>
            <h2
              className="font-black uppercase leading-[0.9] mb-16"
              style={{
                fontSize: "clamp(2.5rem, 5.5vw, 5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "680px",
              }}
            >
              De la recherche
              <br />
              à la remise des clés.
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-8 lg:gap-20 py-10 items-start"
                style={{ borderTop: "1px solid #1B3055" }}
              >
                <span
                  className="font-black leading-none flex-shrink-0"
                  style={{
                    fontSize: "clamp(3rem, 7vw, 5.5rem)",
                    color: "#1B3055",
                    letterSpacing: "-0.04em",
                    width: "clamp(4rem, 8vw, 7rem)",
                  }}
                >
                  {step.num}
                </span>
                <div className="pt-1 lg:pt-3">
                  <h3
                    className="font-black uppercase mb-4"
                    style={{
                      fontSize: "clamp(1rem, 1.8vw, 1.3rem)",
                      letterSpacing: "0.03em",
                      color: "#F0F5FF",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#C8D8EE", maxWidth: "680px" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
            <div className="pb-16" style={{ borderTop: "1px solid #1B3055" }} />
          </div>
        </section>

        {/* ── POURQUOI ALL & BE ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">

              {/* Texte */}
              <div className="py-20 lg:pr-16">
                <p
                  className="text-xs tracking-[0.35em] uppercase mb-6"
                  style={{ color: "#6B9FEE" }}
                >
                  Pourquoi l&apos;Allemagne et la Belgique ?
                </p>
                <h2
                  className="font-black uppercase leading-none mb-10"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Des marchés profonds
                  <br />
                  et bien entretenus.
                </h2>
                <div className="space-y-5">
                  <p className="text-sm leading-relaxed" style={{ color: "#C8D8EE" }}>
                    L&apos;Allemagne est le premier marché automobile d&apos;Europe.
                    Les véhicules y sont souvent issus de flottes professionnelles
                    ou de leasing, avec des carnets d&apos;entretien complets réalisés
                    en réseau officiel. Le volume d&apos;annonces est sans équivalent,
                    ce qui crée régulièrement des opportunités à des prix inférieurs
                    au marché français.
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#C8D8EE" }}>
                    La Belgique offre également un marché bien fourni en véhicules
                    premium, avec une culture d&apos;entretien rigoureuse et des prix
                    souvent compétitifs. Les démarches d&apos;import depuis ces deux pays
                    sont parfaitement maîtrisées et s&apos;inscrivent dans la libre
                    circulation au sein de l&apos;Union européenne.
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="lg:pl-16 pb-20 lg:pb-0" style={{ borderLeft: "1px solid #1B3055" }}>
                {[
                  { value: "N°1", label: "L'Allemagne, premier marché automobile en Europe" },
                  { value: "+830k", label: "Véhicules d'occasion importés chaque année en France" },
                  { value: "15%", label: "Des immatriculations françaises sont des imports EU" },
                ].map((s, i) => (
                  <div
                    key={s.value}
                    className="flex items-start gap-6 py-8 pl-8"
                    style={{ borderTop: i === 0 ? "none" : "1px solid #1B3055" }}
                  >
                    <span
                      className="font-black leading-none flex-shrink-0"
                      style={{
                        fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                        color: "#F0F5FF",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.value}
                    </span>
                    <span
                      className="text-sm leading-relaxed pt-1"
                      style={{ color: "#C8D8EE" }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── LES PILIERS ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-0">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Nos principes
            </p>
            <h2
              className="font-black uppercase leading-[0.9] mb-0"
              style={{
                fontSize: "clamp(2.5rem, 5.5vw, 5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "680px",
              }}
            >
              Les piliers
              <br />
              de notre approche.
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px mt-16"
              style={{ backgroundColor: "#1B3055" }}
            >
              {pillars.map((p) => (
                <div
                  key={p.title}
                  className="p-8 lg:p-10"
                  style={{ backgroundColor: "#040B16" }}
                >
                  <div
                    className="w-8 h-0.5 mb-6"
                    style={{ backgroundColor: "#6B9FEE" }}
                  />
                  <h3
                    className="font-black uppercase mb-4"
                    style={{
                      fontSize: "0.85rem",
                      letterSpacing: "0.05em",
                      color: "#F0F5FF",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#C8D8EE" }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="pb-0" />
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section
          className="relative overflow-hidden border-t"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=70"
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.07 }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-36 text-center">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Prêt à démarrer ?
            </p>
            <h2
              className="font-black uppercase leading-[0.92] mx-auto mb-12"
              style={{
                fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "900px",
              }}
            >
              Votre projet,
              <br />
              <span style={{ color: "#6B9FEE" }}>notre méthode.</span>
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="px-10 py-4 text-sm font-semibold tracking-widest uppercase rounded-full border-2 transition-all duration-300"
                style={{ borderColor: "#F0F5FF", color: "#F0F5FF" }}
              >
                Nous contacter
              </Link>
              <Link
                href="/vehicules"
                className="px-10 py-4 text-sm font-semibold tracking-widest uppercase rounded-full transition-all duration-300"
                style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
              >
                Voir le stock
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
