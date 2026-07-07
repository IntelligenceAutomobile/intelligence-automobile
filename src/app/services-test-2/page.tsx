import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SERVICES, NUM_GRADIENT, CheckIcon } from "./shared";
import { VariantAccordion, VariantTabs } from "./Interactive";

export const metadata = {
  title: "Services — page de test 2 (5 propositions)",
  robots: { index: false, follow: false },
};

/* ─── HERO commun ────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position: "relative", height: "100svh", minHeight: "560px", overflow: "hidden", backgroundColor: "#070F1E" }}>
      <img src="/Photo du Site/Nos Services/Nos service 2.png" alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "blur(26px) brightness(0.5)", transform: "scale(1.18)" }} />
      <img src="/Photo du Site/Nos Services/Nos service 2.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 42%" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "26%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "66%", background: "linear-gradient(to top, #070F1E 0%, rgba(7,15,30,0.9) 24%, rgba(7,15,30,0.5) 58%, transparent 100%)" }} />
      <div style={{ position: "absolute", left: "6vw", right: "6vw", bottom: "8vh", maxWidth: "1400px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.32em", textTransform: "uppercase", color: "#9DBFF2", marginBottom: "1.5rem" }}>Nos services</p>
        <h1 style={{ fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.03em", fontSize: "clamp(2.4rem, 5.4vw, 4.4rem)", textTransform: "uppercase", color: "#F0F5FF", margin: 0 }}>
          Tout ce qui entoure<br />votre véhicule,<br /><span style={{ color: "#6B9FEE" }}>pris en charge.</span>
        </h1>
        <p style={{ marginTop: "1.8rem", maxWidth: "540px", fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)", lineHeight: 1.6, color: "rgba(240,245,255,0.8)" }}>
          De la garantie à la carte grise définitive, on gère les démarches qui sécurisent votre acquisition. Vous conduisez, on s'occupe du reste.
        </p>
      </div>
    </section>
  );
}

function IntroBand() {
  return (
    <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E", padding: "5vh 6vw", textAlign: "center" }}>
      <p style={{ maxWidth: "720px", margin: "0 auto", fontSize: "13px", lineHeight: 1.7, color: "#8FB0DA" }}>
        Second lot : <strong style={{ color: "#C4D8EE" }}>5 pistes (D → H)</strong>, dont certaines plus expérimentales.
        <strong style={{ color: "#C4D8EE" }}> D et E sont interactives</strong> (clique les lignes / les onglets). Hero et CTA restent communs.
      </p>
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

/* ─── F — Frise horizontale du parcours ──────────────────────────────────── */
function VariantHorizontal() {
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(3.5rem, 9vh, 7rem) 5vw" }}>
      <div className="max-w-7xl mx-auto" style={{ position: "relative" }}>
        <div className="frise-line"><span className="frise-beam" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5" style={{ gap: "clamp(1.5rem, 3vw, 2rem)" }}>
          {SERVICES.map((it) => (
            <div key={it.id} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div className="frise-node" style={{ width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#070F1E", border: "1px solid #24406B", boxShadow: "0 0 22px rgba(107,159,238,0.18)", marginBottom: "1.6rem", position: "relative", zIndex: 1 }}>
                <span style={{ fontSize: "1rem", fontWeight: 900, letterSpacing: "-0.02em", ...NUM_GRADIENT }}>{it.num}</span>
              </div>
              <h3 style={{ fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", lineHeight: 1.1, margin: 0, minHeight: "2.4em" }}>{it.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "#8BB8F5", fontWeight: 500, margin: "0.5rem 0 0" }}>{it.hook}</p>
              <ul style={{ listStyle: "none", margin: "1.1rem 0 0", padding: 0, display: "grid", gap: "0.6rem", borderTop: "1px solid rgba(107,159,238,0.18)", paddingTop: "1.1rem", width: "100%" }}>
                {it.points.map((pt) => (
                  <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "12px", color: "#C4D8EE", lineHeight: 1.45 }}>
                    <span style={{ color: "#6B9FEE", flexShrink: 0, fontWeight: 700 }}>—</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── G — Bento asymétrique ──────────────────────────────────────────────── */
function BentoTile({ it, wide }: { it: (typeof SERVICES)[number]; wide?: boolean }) {
  return (
    <div className={`ia-lift ${wide ? "lg:col-span-2" : ""}`} style={{ background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)", border: "1px solid rgba(107,159,238,0.14)", borderRadius: "14px", padding: "clamp(1.5rem, 2.5vw, 2rem)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "0.9rem" }}>
        <span style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", ...NUM_GRADIENT }}>{it.num}</span>
        <h3 style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", lineHeight: 1.05, margin: 0 }}>{it.title}</h3>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#8BB8F5", fontWeight: 500, margin: "0 0 1rem" }}>{it.hook}</p>
      <ul className={wide ? "sm:grid-cols-2" : ""} style={{ listStyle: "none", margin: "auto 0 0", padding: 0, display: "grid", gap: "0.6rem" }}>
        {it.points.map((pt) => (
          <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "12.5px", color: "#D4E2F4", lineHeight: 1.4 }}>
            <CheckIcon />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VariantBento() {
  return (
    <section style={{ backgroundColor: "#040B16", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3" style={{ gap: "1rem", gridAutoRows: "minmax(0, auto)" }}>
        {/* Tuile promesse */}
        <div className="lg:col-span-2" style={{ position: "relative", overflow: "hidden", borderRadius: "14px", border: "1px solid rgba(107,159,238,0.22)", background: "linear-gradient(150deg, #12294D 0%, #0A1830 100%)", padding: "clamp(2rem, 4vw, 3rem)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE", margin: "0 0 1rem" }}>Nos services</p>
          <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#F0F5FF", lineHeight: 1, margin: 0 }}>
            Vous conduisez.<br /><span style={{ color: "#6B9FEE" }}>On s'occupe du reste.</span>
          </h3>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.65, color: "#B9CFEC", margin: "1.3rem 0 0", maxWidth: "460px" }}>
            De la garantie à l'immatriculation définitive, cinq services pour sécuriser votre acquisition sans une démarche à votre charge.
          </p>
        </div>
        {/* Tuile stat */}
        <div style={{ borderRadius: "14px", border: "1px solid rgba(107,159,238,0.14)", background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)", padding: "clamp(1.8rem, 3vw, 2.2rem)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: "clamp(3.5rem, 7vw, 5rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.9, ...NUM_GRADIENT }}>0</span>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#F0F5FF", margin: "0.8rem 0 0", lineHeight: 1.3 }}>démarche administrative à votre charge</p>
          <div style={{ width: "40px", height: "2px", background: "linear-gradient(to right, #6B9FEE, transparent)", margin: "1rem 0 0" }} />
        </div>
        {/* Services */}
        <BentoTile it={SERVICES[0]} />
        <BentoTile it={SERVICES[1]} />
        <BentoTile it={SERVICES[2]} />
        <BentoTile it={SERVICES[3]} wide />
        <BentoTile it={SERVICES[4]} />
      </div>
    </section>
  );
}

/* ─── H — Éditorial magazine ─────────────────────────────────────────────── */
function VariantEditorial() {
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-5xl mx-auto">
        {SERVICES.map((it, i) => (
          <div key={it.id}>
            {i === 3 && (
              <figure style={{ margin: "clamp(2.5rem, 6vh, 4.5rem) 0", padding: "clamp(2rem, 5vh, 3.5rem) 0", borderTop: "1px solid #1B3055", borderBottom: "1px solid #1B3055", textAlign: "center" }}>
                <blockquote style={{ fontSize: "clamp(1.6rem, 4vw, 3rem)", fontWeight: 300, fontStyle: "italic", letterSpacing: "-0.01em", color: "#F0F5FF", lineHeight: 1.2, margin: 0, maxWidth: "760px", marginInline: "auto" }}>
                  « Vous conduisez. <span style={{ color: "#6B9FEE" }}>On s'occupe du reste.</span> »
                </blockquote>
              </figure>
            )}
            <article
              className="grid grid-cols-1 md:grid-cols-[minmax(0,150px)_1fr]"
              style={{ gap: "clamp(1rem, 3vw, 2.5rem)", alignItems: "start", padding: "clamp(2rem, 5vh, 3.5rem) 0", borderTop: i === 0 ? "none" : "1px solid #1B3055" }}
            >
              <span aria-hidden="true" style={{ fontSize: "clamp(3.5rem, 9vw, 7rem)", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.03em", color: "transparent", WebkitTextStroke: "1.5px rgba(107,159,238,0.5)", userSelect: "none" }}>{it.num}</span>
              <div>
                <h3 style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.8rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", color: "#F0F5FF", lineHeight: 1, margin: 0 }}>{it.title}</h3>
                <p style={{ fontSize: "1.1rem", color: "#8BB8F5", fontWeight: 500, margin: "0.7rem 0 0" }}>{it.hook}</p>
                <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#C4D8EE", margin: "1.4rem 0 0", maxWidth: "640px" }}>{it.lead}</p>
                <ul className="sm:grid-cols-2" style={{ listStyle: "none", margin: "1.8rem 0 0", padding: 0, display: "grid", gap: "0.5rem 2rem", maxWidth: "640px" }}>
                  {it.points.map((pt) => (
                    <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "13.5px", color: "#A8C6F4", lineHeight: 1.5, borderTop: "1px solid rgba(107,159,238,0.12)", paddingTop: "0.6rem" }}>
                      <span style={{ color: "#6B9FEE", flexShrink: 0, fontWeight: 700 }}>—</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA commun ─────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16", minHeight: "42vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8vh 6vw 10vh" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9DBFF2", marginBottom: "2rem" }}>Une question sur nos services ?</p>
      <h2 style={{ fontWeight: 900, fontSize: "clamp(2.2rem, 5.5vw, 4.6rem)", letterSpacing: "-0.035em", lineHeight: 0.92, textTransform: "uppercase", color: "#F0F5FF", maxWidth: "780px", marginBottom: "3rem" }}>
        Parlons de<br /><span style={{ color: "#6B9FEE" }}>votre projet.</span>
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
        <Link href="/contact" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "16px 40px", textDecoration: "none" }}>Nous contacter</Link>
        <Link href="/vehicules" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#F0F5FF", border: "1px solid rgba(240,245,255,0.2)", padding: "16px 40px", textDecoration: "none" }}>Voir nos véhicules</Link>
      </div>
    </section>
  );
}

export default function ServicesTest2Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ia-lift { transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), border-color 0.4s ease, box-shadow 0.4s ease; }
        .ia-lift:hover { transform: translateY(-5px); border-color: rgba(107,159,238,0.4); box-shadow: 0 0 40px rgba(107,159,238,0.1); }
        /* F — ligne horizontale du parcours (masquée quand les colonnes s'empilent) */
        .frise-line { display: none; }
        @media (min-width: 768px) {
          .frise-line { display: block; position: absolute; top: 26px; left: 10%; right: 10%; height: 2px; overflow: hidden; pointer-events: none; }
          .frise-line::before { content: ""; position: absolute; inset: 0; background: #1B3055; }
          .frise-beam { position: absolute; top: 0; left: 0; width: 22%; height: 2px; transform: translateX(-120%); background: linear-gradient(90deg, transparent, rgba(140,180,240,0.8), transparent); box-shadow: 0 0 10px 1px rgba(107,159,238,0.4); animation: frise-flow 5s linear infinite; }
        }
        @keyframes frise-flow { 0% { transform: translateX(-120%); } 100% { transform: translateX(560%); } }
        @media (prefers-reduced-motion: reduce) { .ia-lift, .ia-lift:hover { transition: none; transform: none; } .frise-beam { animation: none; opacity: 0; } }
      ` }} />
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", overflowX: "hidden" }}>
        <div id="prop-hero"><Hero /></div>
        <IntroBand />

        <div id="prop-d">
          <PropLabel letter="D" name="Accordéon éditorial" desc="Interactif : une ligne s'ouvre au clic, l'œil va sur l'active. Très compact." />
          <VariantAccordion />
        </div>

        <div id="prop-e">
          <PropLabel letter="E" name="Dossier à onglets" desc="Interactif : services à gauche, détail à droite. Façon configurateur premium." />
          <VariantTabs />
        </div>

        <div id="prop-f">
          <PropLabel letter="F" name="Frise horizontale" desc="Le parcours d'achat en 5 étapes reliées par la ligne lumineuse de l'accueil." />
          <VariantHorizontal />
        </div>

        <div id="prop-g">
          <PropLabel letter="G" name="Bento asymétrique" desc="Mosaïque de tuiles de tailles variées, tuile-promesse et tuile-stat. Le plus neuf." />
          <VariantBento />
        </div>

        <div id="prop-h">
          <PropLabel letter="H" name="Éditorial magazine" desc="Grande typo, chiffres géants en contour, citation pleine largeur, beaucoup d'air." />
          <VariantEditorial />
        </div>

        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
