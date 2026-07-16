import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";
import MethodeSteps from "./MethodeSteps";
import { pageMetadata } from "@/lib/og";

export const metadata = pageMetadata({
  title: "Notre Méthode — Intelligence Automobile",
  description: "Recherche, vérification, sécurisation. Votre tranquillité d'esprit.",
  path: "/methode",
  image: "/og/methode.jpg",
});

const sectionCardStyle = {
  background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
  border: "1px solid rgba(107,159,238,0.12)",
  borderRadius: "10px",
  padding: "2rem",
};

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 sm:gap-5 mb-10">
      <span
        className="font-black tabular-nums flex-shrink-0 leading-none flex items-center justify-center"
        style={{
          fontSize: "1.1rem",
          color: "#6B9FEE",
          letterSpacing: "-0.02em",
          width: "2.75rem",
          height: "2.75rem",
          backgroundColor: "rgba(107,159,238,0.1)",
          border: "1px solid rgba(107,159,238,0.3)",
          borderRadius: "8px",
        }}
      >
        {num}
      </span>
      <p
        className="text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.5em] uppercase font-bold min-w-0"
        style={{ color: "#F0F5FF" }}
      >
        {label}
      </p>
      <div className="flex-1 h-px self-center" style={{ backgroundColor: "rgba(107,159,238,0.25)" }} />
    </div>
  );
}

export default async function Methode2Page() {
  const { t } = await getTranslations();
  const s = t.method;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            height: "100dvh",
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
                "url('/Photo%20du%20Site/Photo%20Notre%20m%C3%A9thode.png')",
              backgroundSize: "cover",
              backgroundPosition: "center 45%",
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

          <div style={{ position: "relative", maxWidth: "900px" }}>
            <h1
              style={{
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
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
                backgroundColor: "#F0F5FF",
                color: "#070F1E",
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "14px 28px",
                borderRadius: 0,
                textDecoration: "none",
              }}
            >
              {s.heroCta}
            </a>
          </div>
        </section>

        {/* ─── CONTENU PRINCIPAL ────────────────────────────────────────────────── */}
        <div
          id="processus"
          className="max-w-6xl mx-auto px-6 lg:px-12"
          style={{ paddingTop: "5rem", paddingBottom: "5rem" }}
        >

          {/* ── 01 · LES 6 ÉTAPES ── */}
          <div className="mb-20">
            <SectionHeader num="01" label={s.processTitle.replace("\n", " ")} />
            <MethodeSteps steps={s.steps} importSteps={s.importSteps} />
          </div>

          {/* ── 02 · CE QUE NOUS SÉCURISONS ── */}
          <div className="mb-20">
            <SectionHeader num="02" label={s.secureTitle.replace("\n", " ")} />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {s.secureItems.map((item, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
                    border: "1px solid rgba(107,159,238,0.12)",
                    borderLeft: `3px solid ${item.color}`,
                    borderRadius: "10px",
                    padding: "1.4rem 1.5rem",
                  }}
                >
                  <h3
                    style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.4rem" }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 03 · POSITIONNEMENT ── */}
          <div className="mb-20">
            <SectionHeader num="03" label={s.cabinetLabel} />
            <div style={{ ...sectionCardStyle, padding: "clamp(1.75rem, 4vw, 3rem)" }}>
              <h2
                className="font-black leading-tight"
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  color: "#F0F5FF",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  marginBottom: "1rem",
                  whiteSpace: "pre-line",
                  textAlign: "center",
                }}
              >
                {s.cabinetTitle}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#A8C6F4",
                  lineHeight: 1.75,
                  maxWidth: "620px",
                  margin: "0 auto 2rem",
                  textAlign: "center",
                }}
              >
                {s.cabinetText}
              </p>
              <div
                className="grid grid-cols-2 lg:grid-cols-4"
                style={{ gap: "1px", backgroundColor: "rgba(107,159,238,0.15)", borderRadius: "8px", overflow: "hidden" }}
              >
                {s.cabinetPoints.map((point, i) => (
                  <div key={i} style={{ backgroundColor: "#0B1929", padding: "1.25rem 1rem" }}>
                    <div
                      style={{
                        width: "22px",
                        height: "2px",
                        borderRadius: "1px",
                        background: `linear-gradient(to right, ${["#6B9FEE", "#5BD89A", "#C6CCD6"][i % 3]}, transparent)`,
                        marginBottom: "0.7rem",
                      }}
                    />
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#F0F5FF", lineHeight: 1.4 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CTA FINAL ── */}
          <div style={{ ...sectionCardStyle, padding: "clamp(2rem, 5vw, 3.5rem)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "clamp(2rem, 4vw, 3rem)", alignItems: "center" }}>
              <div>
                <p
                  className="uppercase"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "#6B9FEE", marginBottom: "1.1rem" }}
                >
                  Intelligence Automobile
                </p>
                <h2
                  className="font-black leading-tight"
                  style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                    color: "#F0F5FF",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    marginBottom: "1.1rem",
                    whiteSpace: "pre-line",
                  }}
                >
                  {s.ctaTitle}
                </h2>
                <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "440px" }}>
                  {s.ctaSubtitle}
                </p>
              </div>
              <div className="flex md:justify-end">
                <div className="flex flex-col gap-3 w-full sm:w-auto" style={{ minWidth: "240px" }}>
                  <Link
                    href="/recherche-personnalisee"
                    className="text-center px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase transition-transform duration-300 hover:-translate-y-px"
                    style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
                  >
                    {s.ctaContact}
                  </Link>
                  <Link
                    href="/vehicules"
                    className="text-center px-8 py-4 text-xs font-semibold tracking-widest uppercase border transition-colors duration-300 hover:border-[#6B9FEE] hover:text-[#6B9FEE]"
                    style={{ borderColor: "rgba(107,159,238,0.4)", color: "#C8D8EE" }}
                  >
                    {s.ctaStock}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Branding footer */}
          <div className="flex items-center gap-4 mt-16">
            <div style={{ width: "40px", height: "2px", backgroundColor: "#C6CCD6", borderRadius: "1px" }} />
            <span
              className="text-[11px] tracking-[0.45em] uppercase font-semibold"
              style={{ color: "#E8F0FC" }}
            >
              Intelligence Automobile · L&apos;import premium, autrement.
            </span>
            <div className="flex-1" style={{ height: "1px", backgroundColor: "rgba(107,159,238,0.15)" }} />
          </div>

        </div>

      </main>
      <Footer />
    </>
  );
}
