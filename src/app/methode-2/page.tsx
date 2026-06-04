import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Notre Méthode V2 — Intelligence Automobile",
};

const steps = [
  {
    num: "01",
    title: "Analyse du marché",
    description:
      "Nous suivons quotidiennement les marchés européens — AutoScout24 Allemagne, Mobile.de, 2ememain.be — pour identifier les opportunités présentant un différentiel de prix favorable.",
  },
  {
    num: "02",
    title: "Sélection rigoureuse",
    description:
      "Historique d'entretien, cohérence du kilométrage, absence d'accident, configuration attractive. Chaque annonce est analysée selon des critères précis.",
  },
  {
    num: "03",
    title: "Vérification sur place",
    description:
      "Contrôle technique, lecture OBD, vérification des documents. Aucune acquisition sans validation complète par un expert certifié.",
  },
  {
    num: "04",
    title: "Acquisition sécurisée",
    description:
      "Contrat conforme, vérification gage/vol (HPI check), paiement sécurisé. La transaction est réalisée dans un cadre légal.",
  },
  {
    num: "05",
    title: "Import & conformité",
    description:
      "Certificat de conformité européen, quitus fiscal, carte grise française. Nous gérons l'intégralité des démarches.",
  },
  {
    num: "06",
    title: "Préparation & remise",
    description:
      "Nettoyage, remises en état esthétiques, photos professionnelles. Vous recevez un véhicule prêt à l'emploi.",
  },
];

const stats = [
  { value: "6", label: "Étapes structurées, de la recherche à la remise" },
  { value: "12–15h", label: "Temps moyen consacré par véhicule importé" },
  { value: "< 30j", label: "Durée de détention objectif par véhicule" },
  { value: "100%", label: "Des démarches administratives prises en charge" },
];

const pillars = [
  {
    title: "Discipline financière",
    desc: "Chaque acquisition est conditionnée à une marge minimale identifiée avant engagement. Pas d'achat coup de cœur.",
  },
  {
    title: "Stock limité",
    desc: "Nous maintenons volontairement un faible nombre de véhicules pour préserver notre capacité financière.",
  },
  {
    title: "Rotation rapide",
    desc: "L'objectif est de vendre chaque véhicule en moins de 30 jours. Sélection pertinente et prix juste.",
  },
  {
    title: "Transparence client",
    desc: "Tous les coûts sont communiqués : prix d'achat, transport, conformité, préparation. Rien n'est caché.",
  },
];

export default function Methode2Page() {
  return (
    <>
      <Header />

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          height: "100vh",
          minHeight: "600px",
          backgroundColor: "#070F1E",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          paddingBottom: "8vh",
          paddingLeft: "clamp(1.5rem, 6vw, 7rem)",
          paddingRight: "clamp(1.5rem, 6vw, 7rem)",
        }}
      >
        {/* Background photo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('/Photo du Site/New Photo HD/moritz-karst-opK7XLRXdLE-unsplash.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            opacity: 0.35,
          }}
        />
        {/* Dark gradient overlay — renforce lisibilité texte bas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, #070F1E 30%, rgba(7,15,30,0.5) 70%, rgba(7,15,30,0.2) 100%)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", maxWidth: "820px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#6B9FEE",
              marginBottom: "1.2rem",
            }}
          >
            Comment nous travaillons
          </p>

          <h1
            style={{
              fontSize: "clamp(3.8rem, 10vw, 10rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: "#F0F5FF",
              margin: 0,
              marginBottom: "2rem",
              whiteSpace: "pre-line",
            }}
          >
            {"Notre\n"}
            <span style={{ color: "#6B9FEE" }}>méthode.</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(0.95rem, 1.4vw, 1.15rem)",
              color: "#8AABD4",
              lineHeight: 1.7,
              maxWidth: "560px",
              marginBottom: "2.5rem",
            }}
          >
            L&apos;import automobile peut être très rentable — ou très risqué.
            Notre méthode transforme cette complexité en un processus structuré
            et reproductible.
          </p>

          <a
            href="#processus"
            style={{
              display: "inline-block",
              padding: "0.85rem 2rem",
              border: "1px solid #F0F5FF",
              color: "#F0F5FF",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 0,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Voir le processus →
          </a>
        </div>
      </section>

      {/* ─── CHIFFRES CLÉS ────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "#040B16",
          padding: "7vh clamp(1.5rem, 6vw, 7rem)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {stats.map((stat, i) => (
            <div key={i}>
              {i > 0 && (
                <div
                  style={{
                    height: "1px",
                    background:
                      "linear-gradient(to right, #1B3055 0%, rgba(27,48,85,0.2) 100%)",
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(2rem, 5vw, 5rem)",
                  padding: "2.8rem 0",
                }}
              >
                <div
                  style={{
                    borderLeft: "2px solid #6B9FEE",
                    paddingLeft: "1.6rem",
                    minWidth: "clamp(8rem, 14vw, 14rem)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                      color: "#F0F5FF",
                      lineHeight: 1,
                      display: "block",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#C4D8EE",
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: "460px",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LES 6 ÉTAPES ─────────────────────────────────────────────────────── */}
      <section
        id="processus"
        style={{
          backgroundColor: "#040B16",
          padding: "10vh clamp(1.5rem, 6vw, 7rem)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ marginBottom: "6vh" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#6B9FEE",
                marginBottom: "1rem",
              }}
            >
              Le processus
            </p>
            <h2
              style={{
                fontSize: "clamp(2rem, 4.5vw, 4rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
                color: "#F0F5FF",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {"De la recherche\nà la remise des clés."}
            </h2>
          </div>

          {/* Steps */}
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid #1B3055",
                padding: "4vh 0",
                display: "flex",
                gap: "clamp(2rem, 6vw, 6rem)",
                alignItems: "flex-start",
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(3rem, 7vw, 5.5rem)",
                  color: "rgba(27,48,85,0.6)",
                  lineHeight: 1,
                  minWidth: "7rem",
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>

              {/* Step content */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    color: "#F0F5FF",
                    margin: 0,
                    marginBottom: "0.9rem",
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#C4D8EE",
                    lineHeight: 1.8,
                    margin: 0,
                    maxWidth: "680px",
                    borderTop: "1px solid rgba(107,159,238,0.35)",
                    paddingTop: "0.7rem",
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LES PILIERS ──────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "#070F1E",
          padding: "10vh clamp(1.5rem, 6vw, 7rem)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ marginBottom: "5vh" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#6B9FEE",
                marginBottom: "1rem",
              }}
            >
              Nos principes
            </p>
            <h2
              style={{
                fontSize: "clamp(2rem, 4.5vw, 4rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
                color: "#F0F5FF",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {"Les piliers\nde notre approche."}
            </h2>
          </div>

          {/* Grid — gap via border trick */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              backgroundColor: "#1B3055",
            }}
          >
            {pillars.map((pillar, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#070F1E",
                  padding: "2.5rem",
                }}
              >
                {/* Accent bar */}
                <div
                  style={{
                    width: "32px",
                    height: "2px",
                    backgroundColor: "#6B9FEE",
                    marginBottom: "1.5rem",
                  }}
                />
                <p
                  style={{
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#F0F5FF",
                    margin: 0,
                    marginBottom: "1rem",
                  }}
                >
                  {pillar.title}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#8AABD4",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "#040B16",
          padding: "12vh clamp(1.5rem, 6vw, 7rem)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 4.5rem)",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            color: "#F0F5FF",
            margin: 0,
            marginBottom: "3rem",
            whiteSpace: "pre-line",
          }}
        >
          {"Votre projet,\nnotre méthode."}
        </h2>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/contact"
            style={{
              display: "inline-block",
              padding: "0.9rem 2.2rem",
              border: "1px solid #F0F5FF",
              color: "#F0F5FF",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 0,
            }}
          >
            Nous contacter
          </Link>
          <Link
            href="/nos-vehicules"
            style={{
              display: "inline-block",
              padding: "0.9rem 2.2rem",
              backgroundColor: "#F0F5FF",
              color: "#070F1E",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 0,
            }}
          >
            Voir le stock
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
