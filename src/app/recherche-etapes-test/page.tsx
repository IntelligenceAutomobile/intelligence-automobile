import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Recherche — étapes en test (cohérence revente/convoyage)",
  robots: { index: false, follow: false },
};

const STEPS = [
  { num: "01", title: "Vous définissez", desc: "Marque, modèle, motorisation, budget, kilométrage, options. Le plus précis vous êtes, le mieux nous ciblons." },
  { num: "02", title: "Nous cherchons", desc: "+2 000 annonces analysées chaque mois sur les marchés de l'Union européenne. Nous filtrons, vérifions, comparons." },
  { num: "03", title: "Vous validez", desc: "Sous 5 à 15 jours, vous recevez une sélection commentée avec photos, historique et rapport de prix. Aucun engagement avant votre accord." },
  { num: "04", title: "Nous livrons", desc: "Achat, contrôle technique, homologation, immatriculation française. Remise des clés en France." },
];

function PropLabel({ letter, name, desc }: { letter: string; name: string; desc: string }) {
  return (
    <div style={{ borderTop: "2px solid #6B9FEE", backgroundColor: "#02060D", padding: "3.2vh 6vw" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "baseline", gap: "1.2rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {letter}
        </span>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE", margin: 0 }}>{letter === "A" ? "Actuel" : "Proposition"}</p>
          <p style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", margin: "0.2rem 0 0" }}>{name}</p>
          <p style={{ fontSize: "13px", color: "#8FB0DA", margin: "0.3rem 0 0" }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── A — Design actuel (liste verticale) ─────────────────────────────────── */
function StepsCurrent() {
  return (
    <section style={{ backgroundColor: "#040B16" }}>
      <div className="max-w-7xl mx-auto" style={{ padding: "clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 6vw, 5rem) clamp(4rem, 8vw, 7rem)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                borderTop: "1px solid",
                borderImage: "linear-gradient(to right, rgba(107,159,238,0.6), rgba(107,159,238,0.08)) 1",
                display: "flex",
                alignItems: "flex-start",
                gap: "clamp(2rem, 5vw, 5rem)",
                padding: "clamp(1.8rem, 3.5vw, 2.8rem) 0",
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                  lineHeight: 1,
                  borderLeft: "2px solid #6B9FEE",
                  paddingLeft: "1.6rem",
                  color: "#F0F5FF",
                  letterSpacing: "-0.04em",
                  flexShrink: 0,
                  minWidth: "clamp(6rem, 10vw, 10rem)",
                }}
              >
                {step.num}
              </div>
              <div style={{ flex: 1, paddingTop: "0.5rem" }}>
                <p style={{ fontSize: "13px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.12em", color: "#F0F5FF", marginBottom: "0.8rem" }}>
                  {step.title}
                </p>
                <p style={{ fontSize: "13px", color: "#DCE8F8", lineHeight: 1.8, fontWeight: 400, borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.8rem", maxWidth: "520px" }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── B — Proposition (grille horizontale, style exact revente & convoyage) ── */
function StepsProposal() {
  return (
    <section id="proposition" className="border-b" style={{ borderColor: "#1B3055", backgroundColor: "#070F1E", scrollMarginTop: "100px" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.num} className="relative">
              <div className="px-8 py-6" style={{ borderLeft: "2px solid #6B9FEE" }}>
                <div style={{ borderLeft: "2px solid #6B9FEE", paddingLeft: "16px", marginBottom: "1.5rem" }}>
                  <span className="font-black leading-none" style={{ fontSize: "clamp(2.4rem, 4vw, 3.2rem)", color: "#6B9FEE", letterSpacing: "-0.04em", display: "block" }}>
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
  );
}

export default function RechercheEtapesTestPage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO (identique à la vraie page, pour le contexte) ── */}
        <section className="relative overflow-hidden" style={{ height: "100dvh", minHeight: "520px" }}>
          <img
            src="/Photo du Site/Recherche personnalisé/Recherche 2.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 1, objectPosition: "center" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(7,15,30,0.85) 0%, rgba(7,15,30,0.2) 60%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "40%", background: "linear-gradient(to top, #070F1E, transparent)" }} />

          <div className="absolute z-10" style={{ bottom: "8vh", left: "6vw", right: "6vw" }}>
            <div style={{ maxWidth: "760px" }}>
              <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: "2rem", color: "#F0F5FF" }}>
                Décrivez-le.
                <br />
                Nous allons <span style={{ color: "#6B9FEE" }}>le trouver.</span>
              </h1>
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
                <p style={{ color: "rgba(214,228,246,0.85)", fontSize: "clamp(0.78rem, 1.1vw, 0.88rem)", lineHeight: 1.8, fontWeight: 400, maxWidth: "440px", fontStyle: "italic", letterSpacing: "0.01em" }}>
                  Dites-nous ce qu'il vous faut. On s'occupe du reste.
                </p>
              </div>
              <a
                href="#proposition"
                style={{ display: "inline-block", backgroundColor: "#F0F5FF", color: "#070F1E", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", padding: "16px 36px", borderRadius: 0, textDecoration: "none" }}
              >
                Voir la proposition ↓
              </a>
            </div>
          </div>
        </section>

        <PropLabel letter="A" name="Design actuel — liste verticale" desc="Ce que /recherche-personnalisee affiche aujourd'hui." />
        <StepsCurrent />

        <PropLabel letter="B" name="Grille horizontale — style revente & convoyage" desc="Code identique aux sections ÉTAPES de /revente-sur-mesure et /transport-livraison, même contenu." />
        <StepsProposal />

      </main>
      <Footer />
    </>
  );
}
