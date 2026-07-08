import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvoyageForm from "@/app/transport-livraison/ConvoyageForm";
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

        {/* CSS : cadrage & titre responsive.
            - Écrans plus hauts que larges (téléphone + tablette portrait, ratio ≤ 3/2) : photo décalée
              pour montrer le camion entier + un peu de route devant.
            - Téléphones : titre un peu plus petit.
            - Titre descendu (6vh) et légèrement réduit sur tous les formats pour mordre moins sur les voitures. */}
        <style dangerouslySetInnerHTML={{ __html: `
          .ia-convoyage-photo { object-position: 55% 45%; }
          .ia-convoyage-textblock { bottom: calc(8vh - 16px); }
          .ia-convoyage-title { font-size: clamp(2.6rem, 5.2vw, 4.6rem); }
          @media (max-aspect-ratio: 3/2) {
            .ia-convoyage-photo { object-position: 26% 45%; }
          }
          @media (max-width: 767px) {
            .ia-convoyage-title { font-size: 2.4rem; }
          }
        ` }} />

        {/* ── HERO 100vh ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100dvh", minHeight: "520px" }}
        >
          {/* fond flou de secours (même scène) : évite tout vide sur les ratios d'écran extrêmes */}
          <img
            src="/Photo du Site/Convoyage/convoyage 2.png"
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "blur(26px) brightness(0.5)", transform: "scale(1.18)" }}
          />
          {/* photo nette, remplit tout le hero (cover) — recadrée pour garder le camion et les voitures visibles sur tous les formats */}
          <img
            src="/Photo du Site/Convoyage/convoyage 2.png"
            alt=""
            className="ia-convoyage-photo"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* assombrit le haut pour la lisibilité du logo du header posé dessus */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "26%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
          {/* fondu bas : fusion avec le fond sombre + lisibilité du titre */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "62%", background: "linear-gradient(to top, #070F1E 0%, rgba(7,15,30,0.78) 32%, transparent 100%)" }} />

          <div
            className="absolute z-10 ia-convoyage-textblock"
            style={{ left: "6vw", right: "6vw" }}
          >
            <div style={{ maxWidth: "680px" }}>
              <h1
                className="ia-convoyage-title"
                style={{
                  fontWeight: 900,
                  lineHeight: 0.88,
                  letterSpacing: "-0.03em",
                  marginBottom: "1.8rem",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
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
                          fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
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
                      style={{ fontSize: "0.95rem", letterSpacing: "0.05em" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#DCE8F8", fontWeight: 400 }}>
                      {step.desc}
                    </p>
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
              <div className="mt-6" style={{ width: "48px", height: "3px", background: "linear-gradient(to right, #6B9FEE, transparent)", borderRadius: "2px" }} />
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
                      <span style={{ color: "#5BD89A", fontSize: "10px", flexShrink: 0 }}>
                        ✓
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#DCE8F8",
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
                  <p style={{ fontSize: "0.85rem", color: "#DCE8F8", fontWeight: 400 }}>
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
                  <p style={{ fontSize: "0.85rem", color: "#DCE8F8", fontWeight: 400 }}>
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
