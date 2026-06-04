import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RechercheForm from "./RechercheForm";

export const metadata = {
  title: "Recherche Personnalisée — Intelligence Automobile",
  description:
    "Décrivez le véhicule que vous recherchez. Nous activons notre réseau européen et vous soumettons une sélection validée sous 5 à 15 jours.",
};

const steps = [
  {
    num: "01",
    title: "Vous définissez",
    desc: "Marque, modèle, motorisation, budget, kilométrage, options. Le plus précis vous êtes, le mieux nous ciblons.",
  },
  {
    num: "02",
    title: "Nous cherchons",
    desc: "+2 000 annonces analysées chaque mois sur les marchés allemand et belge. Nous filtrons, vérifions, comparons.",
  },
  {
    num: "03",
    title: "Vous validez",
    desc: "Sous 5 à 15 jours, vous recevez une sélection commentée avec photos, historique et rapport de prix. Aucun engagement avant votre accord.",
  },
  {
    num: "04",
    title: "Nous livrons",
    desc: "Achat, contrôle technique, homologation, immatriculation française. Remise des clés en France.",
  },
];

const garanties = [
  { icon: "◈", text: "Résultats sous 5 à 15 jours ouvrés" },
  { icon: "◈", text: "Zéro frais avant votre validation" },
  { icon: "◈", text: "Rapport d'inspection complet fourni" },
  { icon: "◈", text: "Démarches administratives incluses" },
  { icon: "◈", text: "Marchés Allemagne & Belgique couverts" },
  { icon: "◈", text: "Commission fixe, transparente, annoncée" },
];

export default function RecherchePage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <section
          className="relative overflow-hidden"
          style={{ backgroundColor: "#070F1E", paddingTop: "200px", paddingBottom: "100px" }}
        >
          {/* Image fond */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[58%]">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85"
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.80 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, #070F1E 25%, rgba(7,15,30,0.6) 55%, transparent 80%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, #070F1E 0%, transparent 40%)" }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-xl">
              <p className="text-xs tracking-[0.35em] uppercase mb-8" style={{ color: "#6B9FEE" }}>
                Recherche personnalisée · Mandat d&apos;import
              </p>
              <h1
                className="font-black leading-[0.9] mb-8"
                style={{ fontSize: "clamp(3rem, 5.5vw, 5.5rem)", letterSpacing: "-0.03em" }}
              >
                Décrivez-le.
                <br />
                Nous allons
                <br />
                <span style={{ color: "#6B9FEE" }}>le trouver.</span>
              </h1>
              <p
                className="text-base md:text-lg leading-relaxed max-w-md"
                style={{ color: "#8AABD4", fontWeight: 300 }}
              >
                Vous avez un modèle en tête, un budget, des exigences. Nous activons notre réseau
                européen et vous soumettons une sélection validée — sans engagement de votre part.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4 ÉTAPES ── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
            <p className="text-xs tracking-[0.35em] uppercase mb-16 text-center" style={{ color: "#8AABD4" }}>
              Comment ça marche
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  className="px-8 py-6"
                  style={{ borderLeft: i === 0 ? "none" : "1px solid #1B3055" }}
                >
                  <span
                    className="block font-black leading-none mb-6"
                    style={{
                      fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                      color: "#6B9FEE",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {step.num}
                  </span>
                  <h3
                    className="font-black uppercase mb-4"
                    style={{ fontSize: "0.95rem", letterSpacing: "0.05em" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE + GARANTIES ── */}
        <section style={{ backgroundColor: "#070F1E" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">

            <div className="mb-16">
              <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
                Votre demande
              </p>
              <h2
                className="font-black uppercase leading-[0.9]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.025em" }}
              >
                Décrivez votre
                <br />
                véhicule idéal.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

              {/* Colonne gauche — garanties */}
              <div className="lg:col-span-2 space-y-10">
                <p className="text-base leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  Nous opérons exclusivement sur les marchés{" "}
                  <strong style={{ color: "#F0F5FF" }}>allemand et belge</strong>, réputés pour la
                  qualité de leur offre et leurs prix compétitifs. Chaque véhicule est vérifié avant
                  de vous être soumis.
                </p>

                <div
                  className="space-y-0"
                  style={{ borderTop: "1px solid #1B3055" }}
                >
                  {garanties.map((g) => (
                    <div
                      key={g.text}
                      className="flex items-center gap-4 py-4"
                      style={{ borderBottom: "1px solid #1B3055" }}
                    >
                      <span style={{ color: "#6B9FEE", fontSize: "10px", flexShrink: 0 }}>✓</span>
                      <span className="text-sm" style={{ color: "#C8D8EE", fontWeight: 300 }}>
                        {g.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="p-5"
                  style={{
                    backgroundColor: "rgba(107,159,238,0.06)",
                    border: "1px solid rgba(107,159,238,0.18)",
                  }}
                >
                  <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#6B9FEE" }}>
                    Marchés couverts
                  </p>
                  <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    Allemagne · Belgique · Pays-Bas
                  </p>
                  <div
                    className="my-4"
                    style={{ height: "1px", backgroundColor: "rgba(107,159,238,0.18)" }}
                  />
                  <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#6B9FEE" }}>
                    Marques traitées
                  </p>
                  <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    Audi · BMW · Mercedes · Porsche · Volkswagen · Lexus · Volvo · et plus
                  </p>
                </div>
              </div>

              {/* Colonne droite — formulaire */}
              <div className="lg:col-span-3">
                <RechercheForm />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
