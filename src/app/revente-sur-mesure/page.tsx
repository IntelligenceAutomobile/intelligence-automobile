import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AideVenteForm from "@/app/revente-sur-mesure/AideVenteForm";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Revente sur mesure — Intelligence Automobile",
};

export default async function AideVenteV2Page() {
  const { t } = await getTranslations();
  const s = t.resale;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* CSS : cadrage responsive — sur écrans portrait (téléphone/tablette), recadre et remonte
            légèrement la photo pour garder la voiture bien visible tout en montrant le photographe ;
            desktop/laptop inchangés (déjà complets). */}
        <style dangerouslySetInnerHTML={{ __html: `
          .ia-revente-photo { object-position: center; }
          @media (max-aspect-ratio: 3/2) {
            .ia-revente-photo {
              object-position: 62% 50%;
              transform: scale(1.25);
              transform-origin: 62% 25%;
            }
          }
        ` }} />

        {/* ── HERO 100vh ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          <div className="absolute inset-0">
            <img
              src="/Photo du Site/Photo IA/Revente sur mesure 4.png"
              alt=""
              className="w-full h-full object-cover ia-revente-photo"
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
                  fontSize: "clamp(2.6rem, 6vw, 5rem)",
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
                    color: "rgba(214,228,246,0.85)",
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

        {/* ── ÉTAPES ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {s.steps.map((step) => (
                <div key={step.num} className="relative">
                  <div
                    className="px-8 py-6"
                    style={{ borderLeft: "2px solid #6B9FEE" }}
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
                      style={{ color: "#DCE8F8", fontWeight: 400 }}
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
              <div style={{ marginTop: "1.4rem", width: "48px", height: "3px", background: "linear-gradient(to right, #6B9FEE, transparent)", borderRadius: "2px" }} />
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
                        style={{ color: "#5BD89A", fontSize: "10px", flexShrink: 0 }}
                      >
                        ✓
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "#DCE8F8", fontWeight: 400 }}
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
                            ? "1px solid rgba(192,200,212,0.35)"
                            : "none",
                      }}
                    >
                      <p
                        className="text-[9px] tracking-[0.38em] uppercase mb-2"
                        style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B9FEE" }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C0C8D4", flexShrink: 0 }} />
                        {block.label}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "#DCE8F8", fontWeight: 400 }}
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
