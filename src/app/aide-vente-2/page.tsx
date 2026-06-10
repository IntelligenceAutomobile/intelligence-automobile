import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AideVenteForm from "@/app/aide-vente/AideVenteForm";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Aide à la Vente V2 — Intelligence Automobile",
};

export default async function AideVenteV2Page() {
  const { t } = await getTranslations();
  const s = t.resale;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO 100vh ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          <div className="absolute inset-0">
            <img
              src="/Photo du Site/Photo IA/Revente sur mesure 4.png"
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.92 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #070F1E 0%, rgba(7,15,30,0.78) 32%, rgba(7,15,30,0.22) 65%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(7,15,30,0.88) 0%, rgba(7,15,30,0.52) 38%, transparent 70%)",
              }}
            />
          </div>

          <div
            className="absolute z-10"
            style={{ bottom: "8vh", left: "6vw", right: "6vw" }}
          >
            <div style={{ maxWidth: "680px" }}>
              <h1
                className="font-black"
                style={{
                  fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.04em",
                  marginBottom: "clamp(1.5rem, 3vh, 2.5rem)",
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
          </div>
        </section>

        {/* ── COMPARATIF ── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <p
              className="text-[10px] tracking-[0.38em] uppercase mb-4 text-center"
              style={{ color: "#C8D8EE" }}
            >
              {s.comparativeLabel}
            </p>
            <h2
              className="font-black uppercase leading-[0.9] text-center mb-20"
              style={{
                fontSize: "clamp(2rem, 3.8vw, 3.4rem)",
                letterSpacing: "-0.03em",
              }}
            >
              {s.comparativeTitle}
            </h2>

            {/* Table desktop */}
            <div
              className="hidden md:block overflow-hidden"
              style={{ border: "1px solid #1B3055" }}
            >
              <div
                className="grid grid-cols-4"
                style={{ backgroundColor: "#080F1C", borderBottom: "1px solid #1B3055" }}
              >
                <div className="px-6 py-5" />
                {[s.colDealer, s.colSolo, s.colIA].map(
                  (col, i) => (
                    <div
                      key={col}
                      className="px-6 py-5"
                      style={{
                        borderLeft: "1px solid #1B3055",
                        backgroundColor:
                          i === 2 ? "rgba(107,159,238,0.04)" : undefined,
                      }}
                    >
                      <span
                        className="text-[9px] tracking-[0.32em] uppercase font-semibold"
                        style={{ color: i === 2 ? "#6B9FEE" : "#C8D8EE" }}
                      >
                        {col}
                      </span>
                    </div>
                  )
                )}
              </div>

              {s.comparatif.map((row, i) => (
                <div
                  key={row.critere}
                  className="grid grid-cols-4"
                  style={{
                    borderBottom: i < s.comparatif.length - 1 ? "1px solid #1B3055" : "none",
                  }}
                >
                  <div className="px-6 py-5">
                    <span
                      className="text-[10px] tracking-[0.25em] uppercase"
                      style={{ color: "#C8D8EE" }}
                    >
                      {row.critere}
                    </span>
                  </div>
                  <div className="px-6 py-5" style={{ borderLeft: "1px solid #1B3055" }}>
                    <span className="text-sm" style={{ color: "#C4D8EE", fontWeight: 400 }}>
                      {row.dealer}
                    </span>
                  </div>
                  <div className="px-6 py-5" style={{ borderLeft: "1px solid #1B3055" }}>
                    <span className="text-sm" style={{ color: "#C4D8EE", fontWeight: 400 }}>
                      {row.seul}
                    </span>
                  </div>
                  <div
                    className="px-6 py-5"
                    style={{
                      borderLeft: "1px solid #1B3055",
                      backgroundColor: "rgba(107,159,238,0.04)",
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: "#F0F5FF" }}>
                      {row.ia}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table mobile */}
            <div className="md:hidden space-y-4">
              {s.comparatif.map((row) => (
                <div key={row.critere} style={{ border: "1px solid #1B3055" }}>
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: "#080F1C",
                      borderBottom: "1px solid #1B3055",
                    }}
                  >
                    <span
                      className="text-[9px] tracking-[0.3em] uppercase"
                      style={{ color: "#C8D8EE" }}
                    >
                      {row.critere}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#1B3055" }}>
                    {[
                      { label: s.colDealer, val: row.dealer, highlight: false },
                      { label: s.colSolo, val: row.seul, highlight: false },
                      { label: s.colIA, val: row.ia, highlight: true },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center px-4 py-3"
                        style={{
                          backgroundColor: item.highlight
                            ? "rgba(107,159,238,0.04)"
                            : undefined,
                        }}
                      >
                        <span
                          className="text-[10px]"
                          style={{ color: item.highlight ? "#6B9FEE" : "#C8D8EE" }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="text-sm text-right"
                          style={{
                            maxWidth: "55%",
                            color: item.highlight ? "#F0F5FF" : "#C4D8EE",
                            fontWeight: item.highlight ? 500 : 300,
                          }}
                        >
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ÉTAPES ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <p
              className="text-[10px] tracking-[0.38em] uppercase mb-20"
              style={{ color: "#C8D8EE" }}
            >
              {s.stepsLabel}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {s.steps.map((step, i) => (
                <div key={step.num} className="relative">
                  {i > 0 && (
                    <div
                      className="hidden lg:block absolute left-0 top-0 bottom-0 w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 0%, #1B3055 20%, #1B3055 80%, transparent 100%)",
                      }}
                    />
                  )}
                  <div
                    className="px-8 py-6"
                    style={{
                      borderLeft:
                        i > 0 ? "2px solid #6B9FEE" : undefined,
                      ...(i > 0 && { borderLeftColor: "#6B9FEE" }),
                    }}
                  >
                    <div
                      style={{
                        borderLeft: "2px solid #6B9FEE",
                        paddingLeft: "16px",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <span
                        className="font-black leading-none"
                        style={{
                          fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
                          color: "#6B9FEE",
                          letterSpacing: "-0.04em",
                          display: "block",
                        }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3
                      className="font-black uppercase mb-4"
                      style={{ fontSize: "0.9rem", letterSpacing: "0.06em" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#C8D8EE", fontWeight: 400 }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE ── */}
        <section
          id="formulaire"
          style={{ backgroundColor: "#040B16", borderTop: "1px solid #1B3055" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">

            <div className="mb-20">
              <p
                className="text-[10px] tracking-[0.38em] uppercase mb-4"
                style={{ color: "#6B9FEE" }}
              >
                {s.formSectionLabel}
              </p>
              <h2
                className="font-black uppercase leading-[0.88]"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 5rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                {s.formTitle[0]}
                <br />
                {s.formTitle[1]}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

              <div className="lg:col-span-2 space-y-10">
                <div style={{ borderTop: "1px solid #1B3055" }}>
                  {s.guarantees.map((g) => (
                    <div
                      key={g}
                      className="flex items-center gap-4 py-4"
                      style={{ borderBottom: "1px solid #1B3055" }}
                    >
                      <span
                        style={{ color: "#6B9FEE", fontSize: "10px", flexShrink: 0 }}
                      >
                        ✓
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "#C4D8EE", fontWeight: 400 }}
                      >
                        {g}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="p-5 space-y-5"
                  style={{
                    backgroundColor: "rgba(107,159,238,0.06)",
                    border: "1px solid rgba(107,159,238,0.18)",
                  }}
                >
                  {[
                    { label: s.vehicleTypesLabel, values: s.vehicleTypes, separator: " · " },
                    { label: s.vehicleBrandsLabel, values: s.vehicleBrands, separator: " · " },
                    { label: s.vehicleCriteriaLabel, values: s.vehicleCriteria, separator: " · " },
                  ].map((block, i, arr) => (
                    <div
                      key={block.label}
                      style={{
                        paddingBottom: i < arr.length - 1 ? "20px" : undefined,
                        borderBottom:
                          i < arr.length - 1
                            ? "1px solid rgba(107,159,238,0.18)"
                            : "none",
                      }}
                    >
                      <p
                        className="text-[9px] tracking-[0.38em] uppercase mb-2"
                        style={{ color: "#6B9FEE" }}
                      >
                        {block.label}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "#C8D8EE", fontWeight: 400 }}
                      >
                        {block.values.join(block.separator)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3">
                <AideVenteForm />
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
