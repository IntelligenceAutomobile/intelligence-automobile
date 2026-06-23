import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RechercheForm from "@/app/recherche/RechercheForm";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Recherche Personnalisée — Intelligence Automobile",
  description:
    "Décrivez le véhicule que vous recherchez. Nous activons notre réseau européen et vous soumettons une sélection validée sous 5 à 15 jours.",
};

export default async function RecherchePage2() {
  const { t } = await getTranslations();
  const s = t.search;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO mobile : bande photo + titre dessous ── */}
        <section className="md:hidden" style={{ position: "relative", backgroundColor: "#070F1E" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", overflow: "hidden" }}>
            <img
              src="/Photo du Site/Photo IA/Recherche personnalisé.png"
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, #070F1E 0%, transparent 100%)" }} />
          </div>
          <div style={{ padding: "0.25rem 6vw 2.5rem" }}>
            <h1 style={{ fontSize: "clamp(2.4rem, 11vw, 3.4rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: "1.25rem", color: "#F0F5FF" }}>
              {s.heroTitle[0]}
              <br />
              {s.heroTitle[1]} <span style={{ color: "#6B9FEE" }}>{s.heroTitle[2]}</span>
            </h1>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
              <p style={{ color: "rgba(168,196,240,0.68)", fontSize: "0.85rem", lineHeight: 1.8, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.01em" }}>
                {s.heroSubtitle}
              </p>
            </div>
            <a
              href="#formulaire"
              style={{ display: "inline-block", backgroundColor: "#F0F5FF", color: "#070F1E", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", padding: "16px 36px", borderRadius: 0, textDecoration: "none" }}
            >
              {s.heroCta}
            </a>
          </div>
        </section>

        {/* ── HERO 100vh (desktop, inchangé) ── */}
        <section
          className="relative overflow-hidden hidden md:block"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          <img
            src="/Photo du Site/Photo IA/Recherche personnalisé.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ opacity: 0.85 }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(7,15,30,0.85) 0%, rgba(7,15,30,0.2) 60%, transparent 100%)",
            }}
          />

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "40%",
              background: "linear-gradient(to top, #070F1E, transparent)",
            }}
          />

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
                {s.heroTitle[0]}
                <br />
                {s.heroTitle[1]}{" "}
                <span style={{ color: "#6B9FEE" }}>{s.heroTitle[2]}</span>
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
                  {s.heroSubtitle}
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
                {s.heroCta}
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
              {s.stepsLabel}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {s.steps.map((step) => (
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
                {s.formTitle[0]}
                <br />
                <span style={{ color: "#6B9FEE" }}>{s.formTitle[1]}</span>
              </h2>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-5"
              style={{ gap: "clamp(3rem, 6vw, 6rem)", alignItems: "start" }}
            >
              {/* Colonne gauche — garanties */}
              <div className="lg:col-span-2" style={{ fontFamily: "var(--font-inter)" }}>
                <div style={{ borderTop: "1px solid #1B3055", marginBottom: "2.5rem" }}>
                  {s.guarantees.map((g) => (
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
                    {s.marketsLabel}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#C8D8EE",
                      fontWeight: 400,
                      marginBottom: "16px",
                    }}
                  >
                    {s.markets}
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
                    {s.brandsLabel}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#C8D8EE",
                      fontWeight: 400,
                      lineHeight: 1.7,
                    }}
                  >
                    {s.brands}
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
