import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Notre Méthode V2 — Intelligence Automobile",
};

export default async function Methode2Page() {
  const { t } = await getTranslations();
  const s = t.method;

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('/Photo du Site/New Photo HD/tim-meyer-WvA85uSNL6k-unsplash.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 68%",
            opacity: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, #070F1E 18%, rgba(7,15,30,0.40) 60%, rgba(7,15,30,0.15) 100%)",
          }}
        />

        <div style={{ position: "relative", maxWidth: "820px" }}>
          <h1
            style={{
              fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: "#F0F5FF",
              margin: 0,
              marginBottom: "2rem",
            }}
          >
            {s.heroTitle[0]}
            <br />
            <span style={{ color: "#6B9FEE" }}>{s.heroTitle[1]}</span>
          </h1>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
            <p
              style={{
                color: "rgba(168,196,240,0.68)",
                fontSize: "clamp(0.78rem, 1.1vw, 0.88rem)",
                lineHeight: 1.8,
                fontWeight: 300,
                maxWidth: "440px",
                fontStyle: "italic",
                letterSpacing: "0.01em",
              }}
            >
              {s.heroSubtitle}
            </p>
          </div>

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
            {s.heroCta}
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
          {s.stats.map((stat, i) => (
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
              {s.processLabel}
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
              {s.processTitle}
            </h2>
          </div>

          {s.steps.map((step, i) => (
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
              {s.pillarsLabel}
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
              {s.pillarsTitle}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              backgroundColor: "#1B3055",
            }}
          >
            {s.pillars.map((pillar, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#070F1E",
                  padding: "2.5rem",
                }}
              >
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
                    color: "#C8D8EE",
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
          {s.ctaTitle}
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
            href="/contact-2"
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
            {s.ctaContact}
          </Link>
          <Link
            href="/vehicules-2"
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
            {s.ctaStock}
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
