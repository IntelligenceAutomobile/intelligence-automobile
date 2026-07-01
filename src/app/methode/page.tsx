import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Notre Méthode — Intelligence Automobile",
};

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

          <div style={{ position: "relative", maxWidth: "900px" }}>
            <h1
              style={{
                fontSize: "clamp(2.4rem, 4.5vw, 4.5rem)",
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
                transition: "background 0.2s, color 0.2s",
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
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {s.steps.map((step, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
                    border: "1px solid rgba(107,159,238,0.12)",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr]">
                    {/* Panneau gauche : grand chiffre dégradé */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: "1.1rem 0.5rem",
                        background:
                          "linear-gradient(160deg, rgba(107,159,238,0.16) 0%, rgba(107,159,238,0.03) 100%)",
                        borderRight: "1px solid rgba(107,159,238,0.18)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          fontSize: "clamp(3.4rem, 8vw, 6rem)",
                          fontWeight: 900,
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                          backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                        }}
                      >
                        {step.num}
                      </span>
                    </div>

                    {/* Contenu */}
                    <div style={{ padding: "1.35rem clamp(1.25rem, 3vw, 2rem)" }}>
                      <h3
                        className="font-black leading-tight"
                        style={{
                          fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                          letterSpacing: "-0.02em",
                          color: "#F0F5FF",
                          marginBottom: "0.8rem",
                        }}
                      >
                        {step.title}
                      </h3>
                      <div className="mb-4" style={{ maxWidth: "580px" }}>
                        {step.description.split("\n").map((line, j, arr) => (
                          <p
                            key={j}
                            className="leading-relaxed"
                            style={{
                              fontSize: "14px",
                              color: "#A8C6F4",
                              marginBottom: j < arr.length - 1 ? "0.7rem" : 0,
                            }}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                      {step.num === "04" && (
                        <ul className="mb-4 space-y-2.5" style={{ maxWidth: "580px" }}>
                          {s.importSteps.map((item, k) => (
                            <li
                              key={k}
                              className="flex items-start gap-3"
                              style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.5 }}
                            >
                              <span
                                className="flex-shrink-0 font-bold"
                                style={{ color: "#6B9FEE", marginTop: "1px" }}
                              >
                                —
                              </span>
                              <span>
                                {item.split(/\[\[|\]\]/).map((part, j) =>
                                  j % 2 === 1 ? (
                                    <span key={j} style={{ color: "#FF14E1", fontWeight: 700 }}>
                                      {part}
                                    </span>
                                  ) : (
                                    <span key={j}>{part}</span>
                                  )
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p
                        className="font-medium italic"
                        style={{ fontSize: "13px", color: "#C6CCD6" }}
                      >
                        → {step.tagline}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 02 · CE QUE NOUS SÉCURISONS ── */}
          <div className="mb-20">
            <SectionHeader num="02" label={s.secureTitle.replace("\n", " ")} />
            <div style={sectionCardStyle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {s.secureItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 px-5 py-5 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "rgba(107,159,238,0.05)",
                      border: "1px solid rgba(107,159,238,0.12)",
                      borderLeft: "3px solid #6B9FEE",
                      borderRadius: "6px",
                    }}
                  >
                    <span
                      className="flex items-center justify-center flex-shrink-0 font-bold mt-0.5"
                      style={{
                        color: "#5BD89A",
                        fontSize: "10px",
                        width: "1.25rem",
                        height: "1.25rem",
                        backgroundColor: "rgba(91,216,154,0.15)",
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <div>
                      <p
                        className="font-bold uppercase mb-1.5"
                        style={{
                          fontSize: "0.75rem",
                          letterSpacing: "0.06em",
                          color: "#F0F5FF",
                        }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{ color: "#A8C6F4" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 03 · NOS VALEURS ── */}
          <div className="mb-20">
            <SectionHeader num="03" label={s.pillarsTitle.replace("\n", " ")} />
            <div
              className="grid grid-cols-2 lg:grid-cols-4 gap-px"
              style={{
                backgroundColor: "rgba(107,159,238,0.15)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {s.pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="flex flex-col px-6 py-8"
                  style={{ backgroundColor: "#0B1929" }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "2px",
                      backgroundColor: "#C6CCD6",
                      borderRadius: "1px",
                      marginBottom: "1.2rem",
                    }}
                  />
                  <p
                    className="font-black uppercase mb-3"
                    style={{
                      fontSize: "0.78rem",
                      letterSpacing: "0.08em",
                      color: "#F0F5FF",
                    }}
                  >
                    {pillar.title}
                  </p>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "#A8C6F4" }}
                  >
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 04 · POSITIONNEMENT ── */}
          <div className="mb-20">
            <SectionHeader num="04" label={s.cabinetLabel} />
            <div style={sectionCardStyle}>
              <h2
                className="font-black uppercase leading-tight mb-5"
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                  letterSpacing: "-0.025em",
                  whiteSpace: "pre-line",
                }}
              >
                {s.cabinetTitle}
              </h2>
              <p
                className="text-[15px] leading-relaxed mb-8"
                style={{ color: "#A8C6F4", maxWidth: "620px" }}
              >
                {s.cabinetText}
              </p>
              <div className="flex flex-nowrap gap-2 overflow-x-auto">
                {s.cabinetPoints.map((point, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 px-3 py-3 text-[12px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: "rgba(107,159,238,0.08)",
                      border: "1px solid rgba(107,159,238,0.25)",
                      color: "#E8F0FC",
                      borderRadius: "6px",
                    }}
                  >
                    <span
                      className="flex items-center justify-center flex-shrink-0 font-bold"
                      style={{
                        color: "#5BD89A",
                        fontSize: "11px",
                        width: "1.25rem",
                        height: "1.25rem",
                        backgroundColor: "rgba(91,216,154,0.15)",
                        borderRadius: "50%",
                      }}
                    >
                      ✓
                    </span>
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── CTA FINAL ── */}
          <div
            className="text-center"
            style={{ ...sectionCardStyle, padding: "4rem 2.5rem" }}
          >
            <p
              className="text-[11px] font-bold tracking-[0.5em] uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              Intelligence Automobile
            </p>
            <h2
              className="font-black uppercase leading-tight mb-5"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
                letterSpacing: "-0.025em",
                whiteSpace: "pre-line",
              }}
            >
              {s.ctaTitle}
            </h2>
            <p
              className="text-[14px] mb-12 mx-auto"
              style={{ color: "#A8C6F4", maxWidth: "480px", lineHeight: 1.8 }}
            >
              {s.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/recherche-personnalisee"
                className="px-10 py-5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:-translate-y-px hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)",
                  color: "#070F1E",
                }}
              >
                {s.ctaContact}
              </Link>
              <Link
                href="/vehicules"
                className="px-10 py-5 text-xs font-semibold tracking-widest uppercase border transition-all duration-300 hover:border-[#6B9FEE] hover:text-[#6B9FEE]"
                style={{ borderColor: "rgba(107,159,238,0.4)", color: "#C8D8EE" }}
              >
                {s.ctaStock}
              </Link>
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
