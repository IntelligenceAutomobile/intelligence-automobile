import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvoyageForm from "@/app/convoyage/ConvoyageForm";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Transport & Livraison — Intelligence Automobile",
};

export default async function ConvoyagePage2() {
  const { t } = await getTranslations();
  const s = t.transport;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO 100vh ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          <img
            src="/Photo du Site/Photo IA/Covoyage 3 Logo Mate Optimiser Telephone Eloigné2  16 9eme.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ opacity: 0.92 }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(7,15,30,0.85) 0%, rgba(7,15,30,0.2) 60%, transparent 100%)",
            }}
          />

          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: "40%",
              background: "linear-gradient(to top, #070F1E, transparent)",
            }}
          />

          <div
            className="absolute z-10"
            style={{ bottom: "8vh", left: "6vw", right: "6vw" }}
          >
            <div style={{ maxWidth: "680px" }}>
              <h1
                style={{
                  fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.88,
                  letterSpacing: "-0.03em",
                  marginBottom: "1.8rem",
                }}
              >
                {s.heroTitle[0]}
                <br />
                {s.heroTitle[1]}
                <br />
                <span style={{ color: "#6B9FEE" }}>{s.heroTitle[2]}</span>
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
                href="#formulaire"
                style={{
                  display: "inline-block",
                  backgroundColor: "#F0F5FF",
                  color: "#070F1E",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.04em",
                  padding: "0.9rem 2rem",
                  borderRadius: 0,
                  textDecoration: "none",
                }}
              >
                {s.heroCta}
              </a>
            </div>
          </div>
        </section>

        {/* ── ÉTAPES ── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-16 text-center"
              style={{ color: "#C8D8EE" }}
            >
              {s.stepsLabel}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {s.steps.map((step, i) => (
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
                  <p className="text-sm leading-relaxed" style={{ color: "#C8D8EE", fontWeight: 400 }}>
                    {step.desc}
                  </p>
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
            <div style={{ marginBottom: "4rem" }}>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(2.4rem, 5vw, 5rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                }}
              >
                {s.formTitle[0]}
                <br />
                <span style={{ color: "#6B9FEE" }}>{s.formTitle[1]}</span>
              </h2>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-5"
              style={{ gap: "clamp(2.5rem, 5vw, 5rem)", alignItems: "start" }}
            >
              <div className="lg:col-span-2">

                <div style={{ borderTop: "1px solid #1B3055", marginBottom: "2rem" }}>
                  {s.guarantees.map((g) => (
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
                    padding: "1.5rem",
                  }}
                >
                  <p
                    className="uppercase tracking-[0.3em]"
                    style={{ fontSize: "0.65rem", color: "#6B9FEE", marginBottom: "0.5rem" }}
                  >
                    {s.zonesLabel}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#C8D8EE", fontWeight: 400 }}>
                    {s.zones}
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
                    {s.delayLabel}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#C8D8EE", fontWeight: 400 }}>
                    {s.delay}
                  </p>
                </div>
              </div>

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
