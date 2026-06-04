import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/app/contact/ContactForm";

export const metadata = {
  title: "Contact V2 — Intelligence Automobile",
};

export default async function ContactV2Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const vehicule = params.vehicule;
  const service = params.service;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <section
          style={{
            position: "relative",
            height: "80vh",
            minHeight: "520px",
            overflow: "hidden",
          }}
        >
          {/* Photo de fond */}
          <img
            src="/Photo du Site/New Photo HD/tim-meyer-WvA85uSNL6k-unsplash.jpg"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 0.80,
            }}
          />

          {/* Overlay latéral */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, rgba(7,15,30,0.9) 0%, rgba(7,15,30,0.3) 55%, transparent 100%)",
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
              background: "linear-gradient(to top, #070F1E, transparent)",
            }}
          />

          {/* Texte bas-gauche */}
          <div
            style={{
              position: "absolute",
              bottom: "8vh",
              left: "clamp(1.5rem, 4vw, 5rem)",
              maxWidth: "660px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#6B9FEE",
                marginBottom: "1.2rem",
              }}
            >
              Parlons de votre projet
            </p>

            <h1
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                marginBottom: "1.8rem",
                whiteSpace: "pre-line",
              }}
            >
              {"Écrivez-\n"}
              <span style={{ color: "#6B9FEE" }}>nous.</span>
            </h1>

            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "#C4D8EE",
                fontWeight: 300,
                maxWidth: "480px",
              }}
            >
              Décrivez-nous votre projet en quelques mots. Nous vous répondons
              sous 24h et vous orientons vers la solution la plus adaptée.
            </p>
          </div>
        </section>

        {/* ── CONTENU PRINCIPAL ── */}
        <section
          style={{
            backgroundColor: "#070F1E",
            borderTop: "1px solid #1B3055",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">

              {/* ── COLONNE GAUCHE : Formulaire ── */}
              <div
                style={{
                  borderRight: "1px solid #1B3055",
                  padding: "6vh 4vw 6vh 0",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: "#6B9FEE",
                    marginBottom: "2.5rem",
                  }}
                >
                  Envoyer un message
                </p>
                <ContactForm defaultVehicule={vehicule} defaultService={service} />
              </div>

              {/* ── COLONNE DROITE : Infos ── */}
              <div style={{ padding: "6vh 0 6vh 3vw" }}>

                {/* Coordonnées */}
                <div style={{ marginBottom: "2rem" }}>
                  {[
                    { label: "Email", value: "contact@intelligence-automobile.fr" },
                    { label: "Téléphone", value: "+33 (0)6 00 00 00 00" },
                    { label: "Zone d'activité", value: "France · Import DE & BE" },
                    { label: "Réponse", value: "Sous 24h ouvrées" },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "1.25rem 0",
                        borderTop: "1px solid #1B3055",
                        ...(i === 3 ? { borderBottom: "1px solid #1B3055" } : {}),
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          letterSpacing: "0.35em",
                          textTransform: "uppercase",
                          color: "#6B9FEE",
                          marginBottom: "0.3rem",
                        }}
                      >
                        {item.label}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "#F0F5FF" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Encadré Première prise de contact */}
                <div
                  style={{
                    backgroundColor: "#040B16",
                    borderLeft: "2px solid #6B9FEE",
                    padding: "24px",
                    marginTop: "2rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#F0F5FF",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Première prise de contact
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.65,
                      color: "#8AABD4",
                    }}
                  >
                    Pas besoin de préparer un dossier complet. Un message suffit :
                    dites-nous ce que vous cherchez — acheter, importer ou vendre —
                    et nous prendrons le temps de vous orienter.
                  </p>
                </div>

                {/* Services rapides */}
                <div style={{ marginTop: "2.5rem" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.35em",
                      textTransform: "uppercase",
                      color: "#6B9FEE",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Nos services
                  </p>
                  <div>
                    {[
                      { label: "Recherche personnalisée", href: "/recherche-2" },
                      { label: "Revente sur mesure", href: "/aide-vente-2" },
                      { label: "Transport & Livraison", href: "/convoyage-2" },
                    ].map((s, i) => (
                      <a
                        key={s.label}
                        href={s.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "1rem 0",
                          borderTop: "1px solid #1B3055",
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#8AABD4",
                          }}
                        >
                          {s.label}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#6B9FEE" }}>
                          →
                        </span>
                      </a>
                    ))}
                    <div style={{ borderTop: "1px solid #1B3055" }} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
