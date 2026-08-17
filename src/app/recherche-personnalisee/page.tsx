import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RechercheForm from "@/app/recherche-personnalisee/RechercheForm";
import AnnonceCard from "@/components/AnnonceCard";
import { getTranslations } from "@/lib/i18n-server";
import { pageMetadata } from "@/lib/og";

export const metadata = pageMetadata({
  title: "Recherche Personnalisée — Intelligence Automobile",
  description:
    "Décrivez le véhicule que vous recherchez. Nous activons notre réseau européen et vous soumettons une sélection validée sous 5 à 15 jours.",
  path: "/recherche-personnalisee",
  image: "/og/recherche-personnalisee.jpg",
});

export default async function RecherchePage2() {
  const { t } = await getTranslations();
  const s = t.search;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* CSS : cadrage responsive — la photo est au format 3/2, donc au-delà de ce ratio
            (desktop) elle se rogne en haut/bas : on vise 20 % depuis le haut pour que les
            moniteurs (bande 22-65 % de la photo) restent entiers même sur une fenêtre large
            et peu haute, où `center` coupait le haut de l'écran sous le menu. En dessous
            (téléphone/tablette) elle se rogne sur les côtés : on décale vers la droite pour
            garder l'écran de recherche entier, avec l'arrière de la Porsche encore visible
            à gauche. */}
        <style dangerouslySetInnerHTML={{ __html: `
          .ia-recherche-photo { object-position: center 20%; }
          @media (max-aspect-ratio: 3/2) {
            .ia-recherche-photo { object-position: 62% 50%; }
          }
        ` }} />

        {/* ── HERO FULL-BLEED (plein écran, mobile + desktop) ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100dvh", minHeight: "520px" }}
        >
          <img
            src="/Photo du Site/Recherche personnalisé/Recherche 5.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover ia-recherche-photo"
            style={{ opacity: 1 }}
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
                  fontSize: "clamp(2.6rem, 6vw, 5rem)",
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
                    color: "rgba(214,228,246,0.85)",
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
        <section className="border-b" style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {s.steps.map((step) => (
                <div key={step.num} className="relative">
                  <div className="px-8 py-6" style={{ borderLeft: "2px solid #6B9FEE" }}>
                    <div style={{ borderLeft: "2px solid #6B9FEE", paddingLeft: "16px", marginBottom: "1.5rem" }}>
                      <span
                        className="font-black leading-none"
                        style={{ fontSize: "clamp(2.4rem, 4vw, 3.2rem)", color: "#6B9FEE", letterSpacing: "-0.04em", display: "block" }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3 className="font-black uppercase mb-4" style={{ fontSize: "0.9rem", letterSpacing: "0.06em" }}>
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
              <div style={{ marginTop: "1.4rem", width: "48px", height: "3px", background: "linear-gradient(to right, #C6CCD6, transparent)", borderRadius: "2px" }} />
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
                          color: "#5BD89A",
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
                          color: "#DCE8F8",
                          fontWeight: 400,
                        }}
                      >
                        {g}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mandat d'import : carte au-dessus de l'encadré « Marchés couverts »,
                    même habillage pour se fondre parmi les garanties. */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <AnnonceCard
                    label={s.mandat.chip}
                    title={s.mandat.title}
                    text={s.mandat.text}
                    cta={s.mandat.cta}
                  />
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
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#6B9FEE",
                      marginBottom: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C6CCD6", flexShrink: 0 }} />
                    {s.marketsLabel}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#DCE8F8",
                      fontWeight: 400,
                      marginBottom: "16px",
                    }}
                  >
                    {s.markets}
                  </p>

                  <div
                    style={{
                      height: "1px",
                      background: "linear-gradient(to right, rgba(198,204,214,0.45), transparent)",
                      marginBottom: "16px",
                    }}
                  />

                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#6B9FEE",
                      marginBottom: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C6CCD6", flexShrink: 0 }} />
                    {s.brandsLabel}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#DCE8F8",
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
