import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { STEPS, NUM_GRADIENT, Lines, ImportList } from "./shared";
import { MethodeAccordion, MethodeTabs } from "./Interactive";

export const metadata = {
  title: "Méthode — 6 fiches en test (D / E / F)",
  robots: { index: false, follow: false },
};

function TitleBand() {
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(7rem, 16vh, 11rem) 6vw clamp(2.5rem, 6vh, 4rem)" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.32em", textTransform: "uppercase", color: "#9DBFF2", marginBottom: "1.2rem" }}>Notre méthode · les 6 étapes</p>
        <h1 style={{ fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", fontSize: "clamp(2.2rem, 5vw, 4rem)", textTransform: "uppercase", color: "#F0F5FF", margin: 0 }}>
          Les 6 fiches,<br /><span style={{ color: "#6B9FEE" }}>3 mises en forme.</span>
        </h1>
        <p style={{ maxWidth: "640px", marginTop: "1.6rem", fontSize: "13px", lineHeight: 1.7, color: "#8FB0DA" }}>
          Les mêmes 6 étapes du haut de la page Méthode, présentées en D, E et F. <strong style={{ color: "#C4D8EE" }}>D et E sont interactives</strong> (clique les lignes / les onglets).
        </p>
      </div>
    </section>
  );
}

function PropLabel({ letter, name, desc }: { letter: string; name: string; desc: string }) {
  return (
    <div style={{ borderTop: "2px solid #6B9FEE", backgroundColor: "#02060D", padding: "3.2vh 6vw" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "baseline", gap: "1.2rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, ...NUM_GRADIENT }}>{letter}</span>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE", margin: 0 }}>Proposition {letter}</p>
          <p style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", margin: "0.2rem 0 0" }}>{name}</p>
          <p style={{ fontSize: "13px", color: "#8FB0DA", margin: "0.3rem 0 0" }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── F — Frise horizontale (6 étapes) ───────────────────────────────────── */
function MethodeFrise() {
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(3.5rem, 9vh, 7rem) 5vw" }}>
      <div className="max-w-7xl mx-auto" style={{ position: "relative" }}>
        <div className="frise-line"><span className="frise-beam" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" style={{ gap: "clamp(1.5rem, 2.5vw, 2rem)" }}>
          {STEPS.map((it) => (
            <div key={it.num} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div className="frise-node" style={{ width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#070F1E", border: "1px solid #24406B", boxShadow: "0 0 22px rgba(107,159,238,0.18)", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
                <span style={{ fontSize: "1rem", fontWeight: 900, letterSpacing: "-0.02em", ...NUM_GRADIENT }}>{it.num}</span>
              </div>
              <h3 style={{ fontSize: "clamp(1rem, 1.3vw, 1.15rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", lineHeight: 1.12, margin: "0 0 0.9rem", minHeight: "3.4em" }}>{it.title}</h3>
              <div style={{ borderTop: "1px solid rgba(107,159,238,0.18)", paddingTop: "0.9rem", width: "100%" }}>
                <Lines text={it.description} size="12px" />
                {it.num === "04" && <ImportList />}
                <p style={{ display: "flex", gap: "0.4rem", fontSize: "11.5px", fontStyle: "italic", fontWeight: 500, color: "#C6CCD6", margin: "1rem 0 0", lineHeight: 1.55 }}>
                  <span style={{ color: "#6B9FEE", flexShrink: 0, fontStyle: "normal" }}>→</span>
                  <span>{it.tagline}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MethodeFichesTestPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* F — ligne horizontale du parcours (visible seulement quand les 6 colonnes sont sur une ligne) */
        .frise-line { display: none; }
        @media (min-width: 1280px) {
          .frise-line { display: block; position: absolute; top: 26px; left: 8.33%; right: 8.33%; height: 2px; overflow: hidden; pointer-events: none; }
          .frise-line::before { content: ""; position: absolute; inset: 0; background: #1B3055; }
          .frise-beam { position: absolute; top: 0; left: 0; width: 18%; height: 2px; transform: translateX(-120%); background: linear-gradient(90deg, transparent, rgba(140,180,240,0.8), transparent); box-shadow: 0 0 10px 1px rgba(107,159,238,0.4); animation: frise-flow 6s linear infinite; }
        }
        @keyframes frise-flow { 0% { transform: translateX(-120%); } 100% { transform: translateX(660%); } }
        @media (prefers-reduced-motion: reduce) { .frise-beam { animation: none; opacity: 0; } }
      ` }} />
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", overflowX: "hidden" }}>
        <TitleBand />

        <div id="prop-d">
          <PropLabel letter="D" name="Accordéon éditorial" desc="Interactif : une étape s'ouvre au clic. Compact, l'œil suit le parcours." />
          <MethodeAccordion />
        </div>

        <div id="prop-e">
          <PropLabel letter="E" name="Dossier à onglets" desc="Interactif : les 6 étapes à gauche, le détail à droite. Façon dossier." />
          <MethodeTabs />
        </div>

        <div id="prop-f">
          <PropLabel letter="F" name="Frise horizontale" desc="Le parcours en 6 étapes reliées par la ligne lumineuse. La plus « process »." />
          <MethodeFrise />
        </div>
      </main>
      <Footer />
    </>
  );
}
