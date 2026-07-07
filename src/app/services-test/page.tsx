import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Services — page de test (3 propositions)",
  robots: { index: false, follow: false },
};

/* ─── Contenu (texte déjà raccourci pour la démo) ────────────────────────── */
type Service = {
  num: string;
  id: string;
  title: string;
  hook: string;
  lead: string;
  points: string[];
};

const SERVICES: Service[] = [
  {
    num: "01",
    id: "garantie",
    title: "Garantie",
    hook: "Roulez l'esprit tranquille.",
    lead: "Les organes essentiels couverts dès la remise des clés, sans démarche de votre part.",
    points: [
      "Garantie panne mécanique 3 mois incluse",
      "Extension jusqu'à 24 mois en option",
      "Moteur, boîte et transmission",
      "Assistance + véhicule de remplacement",
    ],
  },
  {
    num: "02",
    id: "financement",
    title: "Financement",
    hook: "Adapté à votre projet.",
    lead: "Crédit, LOA ou LLD : on vous oriente vers la formule qui colle à votre budget, réponse sous 48 h.",
    points: [
      "Crédit auto, LOA, LLD",
      "Étude personnalisée sous 48 h",
      "Partenaires spécialisés premium",
      "Financement des véhicules importés",
    ],
  },
  {
    num: "03",
    id: "assurances",
    title: "Assurances",
    hook: "Assuré dès la remise des clés.",
    lead: "Assurance temporaire WW pour rouler tout de suite, puis devis comparatifs pour votre couverture définitive.",
    points: [
      "Temporaire WW & assurance définitive",
      "Effective dès la livraison",
      "Partenaires premium & import",
      "Devis comparatifs sans engagement",
    ],
  },
  {
    num: "04",
    id: "demarches",
    title: "Démarches administratives",
    hook: "L'import sans la paperasse.",
    lead: "Quitus, COC, CPI, plaques WW : on monte et on suit tout le dossier ANTS à votre place.",
    points: [
      "Quitus fiscal & certificat de conformité",
      "CPI — Certificat Provisoire d'Immatriculation",
      "Plaques provisoires WW immédiates",
      "Dossier ANTS de bout en bout",
    ],
  },
  {
    num: "05",
    id: "carte-grise",
    title: "Carte grise définitive",
    hook: "Immatriculé en France.",
    lead: "On obtient votre carte grise française définitive et on fait poser vos plaques, sans une démarche de votre part.",
    points: [
      "Immatriculation définitive française",
      "Démarche ANTS prise en charge",
      "Suivi jusqu'à réception du titre",
      "Plaques définitives posées",
    ],
  },
];

/* Chiffre en dégradé (motif repris de /methode). */
const NUM_GRADIENT = {
  backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
      <path d="M5 12.5l4 4L19 6.5" stroke="#6B9FEE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── HERO commun ────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position: "relative", height: "100svh", minHeight: "560px", overflow: "hidden", backgroundColor: "#070F1E" }}>
      <img
        src="/Photo du Site/Nos Services/Nos service 2.png"
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "blur(26px) brightness(0.5)", transform: "scale(1.18)" }}
      />
      <img
        src="/Photo du Site/Nos Services/Nos service 2.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 42%" }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "26%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "66%", background: "linear-gradient(to top, #070F1E 0%, rgba(7,15,30,0.9) 24%, rgba(7,15,30,0.5) 58%, transparent 100%)" }} />

      <div style={{ position: "absolute", left: "6vw", right: "6vw", bottom: "8vh", maxWidth: "1400px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.32em", textTransform: "uppercase", color: "#9DBFF2", marginBottom: "1.5rem" }}>
          Nos services
        </p>
        <h1 style={{ fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.03em", fontSize: "clamp(2.4rem, 5.4vw, 4.4rem)", textTransform: "uppercase", color: "#F0F5FF", margin: 0 }}>
          Tout ce qui entoure
          <br />votre véhicule,
          <br /><span style={{ color: "#6B9FEE" }}>pris en charge.</span>
        </h1>
        <p style={{ marginTop: "1.8rem", maxWidth: "540px", fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)", lineHeight: 1.6, color: "rgba(240,245,255,0.8)" }}>
          De la garantie à la carte grise définitive, on gère les démarches qui sécurisent votre acquisition. Vous conduisez, on s'occupe du reste.
        </p>
        <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
          {SERVICES.map((it) => (
            <a
              key={it.id}
              href={`#a-${it.id}`}
              style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 16px", borderRadius: "999px", color: "#A8C4F0", border: "1px solid rgba(107,159,238,0.3)", backgroundColor: "rgba(7,15,30,0.35)", textDecoration: "none" }}
            >
              {it.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Bandeau d'intro + étiquette de proposition (repères pour la démo, à retirer ensuite). */
function IntroBand() {
  return (
    <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E", padding: "5vh 6vw", textAlign: "center" }}>
      <p style={{ maxWidth: "680px", margin: "0 auto", fontSize: "13px", lineHeight: 1.7, color: "#8FB0DA" }}>
        Le hero ci-dessus et le CTA tout en bas seront <strong style={{ color: "#C4D8EE" }}>communs aux 3 propositions</strong>.
        Ci-dessous, trois mises en forme des 5 services. Choisis une direction (ou un mélange).
      </p>
    </section>
  );
}

function PropLabel({ letter, name, desc }: { letter: string; name: string; desc: string }) {
  return (
    <div style={{ borderTop: "2px solid #6B9FEE", backgroundColor: "#02060D", padding: "3.2vh 6vw" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "baseline", gap: "1.2rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, ...NUM_GRADIENT }}>
          {letter}
        </span>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE", margin: 0 }}>Proposition {letter}</p>
          <p style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", margin: "0.2rem 0 0" }}>{name}</p>
          <p style={{ fontSize: "13px", color: "#8FB0DA", margin: "0.3rem 0 0" }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── PROPOSITION A — Grille de cartes (langage /methode) ─────────────────── */
function VariantA() {
  return (
    <section style={{ backgroundColor: "#070F1E", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1.25rem" }}>
        {SERVICES.map((it, i) => {
          const featured = i === SERVICES.length - 1; // dernière carte en pleine largeur
          return (
            <div
              key={it.id}
              id={`a-${it.id}`}
              className={`ia-lift ${featured ? "sm:col-span-2" : ""}`}
              style={{
                position: "relative",
                background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
                border: "1px solid rgba(107,159,238,0.14)",
                borderRadius: "12px",
                padding: "clamp(1.6rem, 3vw, 2.2rem)",
                display: featured ? "grid" : "block",
                gridTemplateColumns: featured ? "minmax(0,1fr)" : undefined,
                scrollMarginTop: "120px",
              }}
            >
              <div className={featured ? "sm:grid sm:grid-cols-2 sm:gap-10 sm:items-center" : ""}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.1rem" }}>
                    <span style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", ...NUM_GRADIENT }}>{it.num}</span>
                    <span style={{ height: "1px", flex: 1, background: "linear-gradient(to right, rgba(107,159,238,0.4), transparent)" }} />
                  </div>
                  <h3 style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", lineHeight: 1.05, margin: 0 }}>{it.title}</h3>
                  <p style={{ fontSize: "0.95rem", color: "#8BB8F5", fontWeight: 500, margin: "0.5rem 0 0" }}>{it.hook}</p>
                  <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#A8C6F4", margin: "1rem 0 0", maxWidth: "440px" }}>{it.lead}</p>
                </div>
                <ul style={{ listStyle: "none", margin: featured ? 0 : "1.6rem 0 0", padding: 0, display: "grid", gap: "0.7rem" }}>
                  {it.points.map((pt) => (
                    <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "13px", color: "#D4E2F4", lineHeight: 1.4 }}>
                      <CheckIcon />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── PROPOSITION B — Parcours vertical (l'œil descend 01 → 05) ───────────── */
function VariantB() {
  return (
    <section style={{ backgroundColor: "#040B16", padding: "clamp(3rem, 8vh, 6rem) 6vw" }}>
      <div className="max-w-4xl mx-auto" style={{ position: "relative" }}>
        {/* ligne verticale du parcours */}
        <div style={{ position: "absolute", top: "18px", bottom: "18px", left: "27px", width: "2px", background: "linear-gradient(to bottom, #6B9FEE, #1B3055 30%, #1B3055 70%, transparent)" }} />
        <div style={{ display: "grid", gap: "clamp(2rem, 5vh, 3.5rem)" }}>
          {SERVICES.map((it) => (
            <div key={it.id} id={`b-${it.id}`} style={{ position: "relative", display: "grid", gridTemplateColumns: "56px 1fr", gap: "clamp(1.2rem, 3vw, 2rem)", alignItems: "start", scrollMarginTop: "120px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#070F1E", border: "1px solid #24406B", boxShadow: "0 0 22px rgba(107,159,238,0.18)", position: "relative", zIndex: 1 }}>
                <span style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.02em", ...NUM_GRADIENT }}>{it.num}</span>
              </div>
              <div style={{ paddingTop: "2px" }}>
                <h3 style={{ fontSize: "clamp(1.4rem, 2.6vw, 2rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", lineHeight: 1.05, margin: 0 }}>
                  {it.title}
                  <span style={{ color: "#6B9FEE" }}>.</span>
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#8BB8F5", fontWeight: 500, margin: "0.4rem 0 0" }}>{it.hook}</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "#A8C6F4", margin: "0.9rem 0 1.3rem", maxWidth: "560px" }}>{it.lead}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {it.points.map((pt) => (
                    <span key={pt} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", color: "#C4D8EE", border: "1px solid rgba(107,159,238,0.22)", backgroundColor: "rgba(107,159,238,0.06)", borderRadius: "999px", padding: "6px 12px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#6B9FEE", flexShrink: 0 }} />
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PROPOSITION C — Bandes alternées (langage accueil, gros chiffre) ────── */
function VariantC() {
  return (
    <section>
      {SERVICES.map((it, i) => {
        const flip = i % 2 === 1;
        return (
          <div
            key={it.id}
            id={`c-${it.id}`}
            className={`flex flex-col ${flip ? "lg:flex-row-reverse" : "lg:flex-row"}`}
            style={{ alignItems: "stretch", borderTop: "1px solid #1B3055", backgroundColor: i % 2 === 0 ? "#070F1E" : "#040B16", scrollMarginTop: "120px" }}
          >
            {/* Panneau visuel : gros chiffre fantôme + titre */}
            <div className="w-full lg:w-[44%]" style={{ position: "relative", minHeight: "300px", overflow: "hidden", background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)", display: "flex", alignItems: "center", padding: "clamp(2.5rem, 6vw, 4rem)" }}>
              <span aria-hidden="true" style={{ position: "absolute", top: "-0.12em", right: "0.15em", fontSize: "clamp(9rem, 20vw, 17rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(107,159,238,0.12)", userSelect: "none", pointerEvents: "none" }}>{it.num}</span>
              <div style={{ position: "relative" }}>
                <div style={{ width: "44px", height: "3px", borderRadius: "2px", background: "linear-gradient(to right, #6B9FEE, transparent)", marginBottom: "1.4rem" }} />
                <h3 style={{ fontSize: "clamp(1.9rem, 3.6vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", color: "#F0F5FF", lineHeight: 1, margin: 0 }}>{it.title}</h3>
                <p style={{ fontSize: "1rem", color: "#8BB8F5", fontWeight: 500, margin: "0.9rem 0 0" }}>{it.hook}</p>
              </div>
            </div>
            {/* Panneau contenu */}
            <div className="w-full lg:w-[56%]" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(2.5rem, 6vw, 4rem)" }}>
              <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.15rem)", lineHeight: 1.65, color: "#C4D8EE", margin: 0, maxWidth: "520px" }}>{it.lead}</p>
              <ul style={{ listStyle: "none", margin: "1.8rem 0 0", padding: 0, display: "grid", gap: "0.85rem", maxWidth: "520px" }}>
                {it.points.map((pt) => (
                  <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "14px", color: "#D4E2F4", lineHeight: 1.4, borderTop: "1px solid rgba(107,159,238,0.14)", paddingTop: "0.85rem" }}>
                    <CheckIcon />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ─── CTA commun ─────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16", minHeight: "42vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8vh 6vw 10vh" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9DBFF2", marginBottom: "2rem" }}>
        Une question sur nos services ?
      </p>
      <h2 style={{ fontWeight: 900, fontSize: "clamp(2.2rem, 5.5vw, 4.6rem)", letterSpacing: "-0.035em", lineHeight: 0.92, textTransform: "uppercase", color: "#F0F5FF", maxWidth: "780px", marginBottom: "3rem" }}>
        Parlons de<br /><span style={{ color: "#6B9FEE" }}>votre projet.</span>
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
        <Link href="/contact" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "16px 40px", textDecoration: "none" }}>
          Nous contacter
        </Link>
        <Link href="/vehicules" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#F0F5FF", border: "1px solid rgba(240,245,255,0.2)", padding: "16px 40px", textDecoration: "none" }}>
          Voir nos véhicules
        </Link>
      </div>
    </section>
  );
}

export default function ServicesTestPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ia-lift { transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), border-color 0.4s ease, box-shadow 0.4s ease; }
        .ia-lift:hover { transform: translateY(-5px); border-color: rgba(107,159,238,0.4); box-shadow: 0 0 40px rgba(107,159,238,0.1); }
        @media (prefers-reduced-motion: reduce) { .ia-lift { transition: none; } .ia-lift:hover { transform: none; } }
      ` }} />
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", overflowX: "hidden" }}>
        <div id="prop-hero"><Hero /></div>
        <IntroBand />

        <div id="prop-a">
          <PropLabel letter="A" name="Grille de cartes" desc="Langage de la page Méthode. Compact, scannable, chaque service dans sa carte." />
          <VariantA />
        </div>

        <div id="prop-b">
          <PropLabel letter="B" name="Parcours vertical" desc="Raconte le trajet 01 → 05. L'œil descend, les infos deviennent des pastilles." />
          <VariantB />
        </div>

        <div id="prop-c">
          <PropLabel letter="C" name="Bandes alternées" desc="Langage de l'accueil. Grand, aéré, premium, avec le gros chiffre fantôme." />
          <VariantC />
        </div>

        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
