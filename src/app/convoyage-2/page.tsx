import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvoyageForm from "@/app/convoyage/ConvoyageForm";

export const metadata = {
  title: "Transport & Livraison V2 — Intelligence Automobile",
};

const steps = [
  {
    num: "01",
    title: "Votre demande",
    desc: "Indiquez le point de départ, la destination, le véhicule et la date souhaitée. Nous revenons sous 24h avec un devis clair.",
  },
  {
    num: "02",
    title: "Accord & préparation",
    desc: "Vous validez le devis. Nous coordonnons la prise en charge et documentons l'état du véhicule avant départ.",
  },
  {
    num: "03",
    title: "Prise en charge",
    desc: "Un conducteur professionnel et assuré récupère le véhicule. État des lieux contradictoire, signature, départ.",
  },
  {
    num: "04",
    title: "Livraison",
    desc: "Le véhicule vous est remis à destination dans l'état convenu. Photos de livraison transmises. Tarif inchangé.",
  },
];

const garanties = [
  "Conducteurs professionnels assurés RC",
  "Photos d'état avant départ et à la livraison",
  "Couverture RC pendant tout le transport",
  "Tarif fixe annoncé avant accord, sans supplément",
  "France entière + Belgique, Allemagne, Pays-Bas",
  "Interlocuteur direct tout au long de la mission",
];

export default function ConvoyagePage2() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO 100vh ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          {/* Photo de fond */}
          <img
            src="/Photo du Site/New Photo HD/luke-schobert-niST2P59VWs-unsplash.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Overlay directionnel */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(7,15,30,0.85) 0%, rgba(7,15,30,0.2) 60%, transparent 100%)",
            }}
          />

          {/* Fondu bas */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: "40%",
              background: "linear-gradient(to top, #070F1E, transparent)",
            }}
          />

          {/* Texte bas-gauche */}
          <div
            className="absolute left-0 right-0 bottom-0 z-10"
            style={{ padding: "clamp(2rem, 5vw, 4rem)" }}
          >
            <div style={{ maxWidth: "680px" }}>
              <p
                className="uppercase tracking-[0.35em] mb-6"
                style={{ fontSize: "0.7rem", color: "#6B9FEE" }}
              >
                Convoyage · Livraison de véhicule
              </p>

              <h1
                style={{
                  fontSize: "clamp(3.8rem, 10vw, 10rem)",
                  fontWeight: 900,
                  lineHeight: 0.88,
                  letterSpacing: "-0.03em",
                  marginBottom: "1.8rem",
                }}
              >
                Votre véhicule
                <br />
                livré, sans
                <br />
                <span style={{ color: "#6B9FEE" }}>vous déplacer.</span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                  color: "#8AABD4",
                  fontWeight: 300,
                  lineHeight: 1.65,
                  maxWidth: "480px",
                  marginBottom: "2.4rem",
                }}
              >
                Conducteur professionnel, couverture assurance complète, photos avant et après.
                Nous acheminons votre véhicule en toute sécurité.
              </p>

              <a
                href="#formulaire"
                style={{
                  display: "inline-block",
                  backgroundColor: "#6B9FEE",
                  color: "#070F1E",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.04em",
                  padding: "0.9rem 2rem",
                  borderRadius: 0,
                  textDecoration: "none",
                }}
              >
                Demander un devis →
              </a>
            </div>
          </div>
        </section>

        {/* ── ÉTAPES ── */}
        <section style={{ backgroundColor: "#040B16" }}>
          <div
            className="max-w-7xl mx-auto px-6 lg:px-12"
            style={{ paddingTop: "6rem", paddingBottom: "6rem" }}
          >
            <p
              className="uppercase tracking-[0.35em] mb-16"
              style={{ fontSize: "0.7rem", color: "#8AABD4" }}
            >
              Comment ça marche
            </p>

            <div>
              {steps.map((step, i) => (
                <div key={step.num}>
                  {/* Séparateur gradient entre les étapes */}
                  {i > 0 && (
                    <div
                      style={{
                        height: "1px",
                        background:
                          "linear-gradient(to right, transparent, #1B3055, transparent)",
                        margin: "0",
                      }}
                    />
                  )}

                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr",
                      gap: "clamp(2rem, 5vw, 5rem)",
                      alignItems: "start",
                      padding: "clamp(2rem, 4vw, 3.5rem) 0",
                    }}
                  >
                    {/* Numéro */}
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                        color: "#F0F5FF",
                        borderLeft: "2px solid #6B9FEE",
                        paddingLeft: "1.6rem",
                      }}
                    >
                      {step.num}
                    </div>

                    {/* Titre + description */}
                    <div style={{ paddingTop: "0.3rem" }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
                          letterSpacing: "0.02em",
                          marginBottom: "0.9rem",
                          color: "#F0F5FF",
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#C4D8EE",
                          fontWeight: 300,
                          lineHeight: 1.7,
                          borderTop: "1px solid rgba(107,159,238,0.35)",
                          paddingTop: "0.8rem",
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE ── */}
        <section id="formulaire" style={{ backgroundColor: "#070F1E" }}>
          <div
            className="max-w-7xl mx-auto px-6 lg:px-12"
            style={{ paddingTop: "6rem", paddingBottom: "6rem" }}
          >
            {/* Titre section */}
            <div style={{ marginBottom: "4rem" }}>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(2.4rem, 5vw, 5rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                }}
              >
                Dites-nous
                <br />
                <span style={{ color: "#6B9FEE" }}>où livrer.</span>
              </h2>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-5"
              style={{ gap: "clamp(2.5rem, 5vw, 5rem)", alignItems: "start" }}
            >
              {/* Col gauche 2/5 — garanties */}
              <div className="lg:col-span-2">

                {/* Liste garanties */}
                <div style={{ borderTop: "1px solid #1B3055", marginBottom: "2rem" }}>
                  {garanties.map((g) => (
                    <div
                      key={g}
                      className="flex items-center gap-4"
                      style={{
                        borderBottom: "1px solid #1B3055",
                        padding: "0.9rem 0",
                      }}
                    >
                      <span style={{ color: "#6B9FEE", fontSize: "10px", flexShrink: 0 }}>
                        ✓
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#C4D8EE",
                          fontWeight: 300,
                        }}
                      >
                        {g}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Encadré zones / délais */}
                <div
                  style={{
                    backgroundColor: "rgba(107,159,238,0.06)",
                    border: "1px solid rgba(107,159,238,0.18)",
                    padding: "1.5rem",
                  }}
                >
                  <p
                    className="uppercase tracking-[0.3em]"
                    style={{ fontSize: "0.65rem", color: "#6B9FEE", marginBottom: "0.5rem" }}
                  >
                    Zones couvertes
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#8AABD4", fontWeight: 300 }}>
                    France entière · Belgique · Allemagne · Pays-Bas
                  </p>

                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "rgba(107,159,238,0.18)",
                      margin: "1rem 0",
                    }}
                  />

                  <p
                    className="uppercase tracking-[0.3em]"
                    style={{ fontSize: "0.65rem", color: "#6B9FEE", marginBottom: "0.5rem" }}
                  >
                    Délai de livraison
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#8AABD4", fontWeight: 300 }}>
                    J+1 à J+3 selon la distance · Sur rendez-vous
                  </p>
                </div>
              </div>

              {/* Col droite 3/5 — formulaire */}
              <div className="lg:col-span-3">
                <ConvoyageForm />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
