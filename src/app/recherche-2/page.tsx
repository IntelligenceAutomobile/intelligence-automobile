import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RechercheForm from "@/app/recherche/RechercheForm";

export const metadata = {
  title: "Recherche Personnalisée V2 — Intelligence Automobile",
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
  "Résultats sous 5 à 15 jours ouvrés",
  "Zéro frais avant votre validation",
  "Rapport d'inspection complet fourni",
  "Démarches administratives incluses",
  "Marchés Allemagne & Belgique couverts",
  "Commission fixe, transparente, annoncée",
];

export default function RecherchePage2() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO 100vh ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          {/* Image plein écran */}
          <img
            src="/Photo du Site/Photo IA/Recherche personnalisé.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ opacity: 0.85 }}
          />

          {/* Overlay directionnel gauche */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(7,15,30,0.85) 0%, rgba(7,15,30,0.2) 60%, transparent 100%)",
            }}
          />

          {/* Overlay bas */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "40%",
              background: "linear-gradient(to top, #070F1E, transparent)",
            }}
          />

          {/* Contenu bas-gauche */}
          <div
            className="absolute z-10"
            style={{ bottom: "8vh", left: "6vw", right: "6vw" }}
          >
            <div style={{ maxWidth: "760px" }}>
              <h1
                style={{
                  fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  marginBottom: "2rem",
                  color: "#F0F5FF",
                }}
              >
                Décrivez-le.
                <br />
                Nous allons{" "}
                <span style={{ color: "#6B9FEE" }}>le trouver.</span>
              </h1>

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
                  Dites-nous ce que vous recherchez. Nous vous soumettons une sélection validée — sans engagement.
                </p>
              </div>

              <a
                href="#formulaire"
                style={{
                  display: "inline-block",
                  backgroundColor: "#F0F5FF",
                  color: "#070F1E",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "16px 36px",
                  borderRadius: 0,
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Déposer une demande →
              </a>
            </div>
          </div>
        </section>

        {/* ── SECTION ÉTAPES ── */}
        <section style={{ backgroundColor: "#040B16" }}>
          <div
            className="max-w-7xl mx-auto"
            style={{ padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem)" }}
          >
            {/* Titre section */}
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#6B9FEE",
                marginBottom: "clamp(2.5rem, 5vw, 4.5rem)",
                fontWeight: 500,
              }}
            >
              Comment ça marche
            </p>

            {/* Liste éditoriale */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {steps.map((step) => (
                <div
                  key={step.num}
                  style={{
                    borderTop: "1px solid",
                    borderImage:
                      "linear-gradient(to right, rgba(107,159,238,0.6), rgba(107,159,238,0.08)) 1",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "clamp(2rem, 5vw, 5rem)",
                    padding: "clamp(1.8rem, 3.5vw, 2.8rem) 0",
                  }}
                >
                  {/* Numéro */}
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                      lineHeight: 1,
                      borderLeft: "2px solid #6B9FEE",
                      paddingLeft: "1.6rem",
                      color: "#F0F5FF",
                      letterSpacing: "-0.04em",
                      flexShrink: 0,
                      minWidth: "clamp(6rem, 10vw, 10rem)",
                    }}
                  >
                    {step.num}
                  </div>

                  {/* Titre + description */}
                  <div style={{ flex: 1, paddingTop: "0.5rem" }}>
                    <p
                      style={{
                        fontSize: "13px",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "#F0F5FF",
                        marginBottom: "0.8rem",
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#C4D8EE",
                        lineHeight: 1.8,
                        fontWeight: 400,
                        borderTop: "1px solid rgba(107,159,238,0.35)",
                        paddingTop: "0.8rem",
                        maxWidth: "520px",
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION FORMULAIRE ── */}
        <section
          id="formulaire"
          style={{ backgroundColor: "#070F1E", padding: "10vh 0" }}
        >
          <div
            className="max-w-7xl mx-auto"
            style={{ padding: "0 clamp(1.5rem, 6vw, 5rem)" }}
          >
            {/* Titre éditorial */}
            <div style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
              <h2
                style={{
                  fontSize: "clamp(2.8rem, 6vw, 6.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: "#F0F5FF",
                }}
              >
                Décrivez votre
                <br />
                <span style={{ color: "#6B9FEE" }}>véhicule idéal.</span>
              </h2>
            </div>

            {/* Grid 2 colonnes */}
            <div
              className="grid grid-cols-1 lg:grid-cols-5"
              style={{ gap: "clamp(3rem, 6vw, 6rem)", alignItems: "start" }}
            >
              {/* Colonne gauche — garanties (2fr) */}
              <div className="lg:col-span-2" style={{ fontFamily: "var(--font-inter)" }}>
                {/* Liste garanties */}
                <div style={{ borderTop: "1px solid #1B3055", marginBottom: "2.5rem" }}>
                  {garanties.map((g) => (
                    <div
                      key={g}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "1rem 0",
                        borderBottom: "1px solid #1B3055",
                      }}
                    >
                      <span
                        style={{
                          color: "#6B9FEE",
                          fontSize: "11px",
                          flexShrink: 0,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#C4D8EE",
                          fontWeight: 400,
                        }}
                      >
                        {g}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Encadré marchés / marques */}
                <div
                  style={{
                    backgroundColor: "rgba(107,159,238,0.06)",
                    border: "1px solid rgba(107,159,238,0.18)",
                    padding: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#6B9FEE",
                      marginBottom: "10px",
                      fontWeight: 600,
                    }}
                  >
                    Marchés couverts
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#C8D8EE",
                      fontWeight: 400,
                      marginBottom: "16px",
                    }}
                  >
                    Allemagne · Belgique · Pays-Bas
                  </p>

                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "rgba(107,159,238,0.18)",
                      marginBottom: "16px",
                    }}
                  />

                  <p
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#6B9FEE",
                      marginBottom: "10px",
                      fontWeight: 600,
                    }}
                  >
                    Marques traitées
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#C8D8EE",
                      fontWeight: 400,
                      lineHeight: 1.7,
                    }}
                  >
                    Audi · BMW · Mercedes · Porsche · Volkswagen · Lexus · Volvo · et plus
                  </p>
                </div>
              </div>

              {/* Colonne droite — formulaire (3fr) */}
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
