import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Méthode — page de test (3 concepts)",
  robots: { index: false, follow: false },
};

type Step = { num: string; title: string; description: string; tagline: string };
type SecureItem = { icon: string; color: string; title: string; desc: string };
type Pillar = { icon: string; color: string; title: string; desc: string };

/* Convertit un hex #RRGGBB en rgba() avec l'alpha voulu. */
function tint(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* Rend le texte en colorant en magenta ce qui est entre [[ ]] (les plaques WW). */
function Pinked({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[|\]\]/).map((part, j) =>
        j % 2 === 1 ? (
          <span key={j} style={{ color: "#FF14E1", fontWeight: 700 }}>
            {part}
          </span>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </>
  );
}

/* Corps commun d'une étape : description aérée + (étape 04) liste des démarches. */
function Desc({ step, importSteps }: { step: Step; importSteps: string[] }) {
  return (
    <>
      <div style={{ marginBottom: "0.9rem" }}>
        {step.description.split("\n").map((line, j, arr) => (
          <p
            key={j}
            style={{
              fontSize: "14px",
              color: "#A8C6F4",
              lineHeight: 1.75,
              marginBottom: j < arr.length - 1 ? "0.6rem" : 0,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {step.num === "04" && (
        <ul style={{ listStyle: "none", margin: "0 0 0.9rem", padding: 0 }}>
          {importSteps.map((it, k) => (
            <li
              key={k}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
                fontSize: "14px",
                color: "#A8C6F4",
                lineHeight: 1.5,
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "#6B9FEE", fontWeight: 700, flexShrink: 0 }}>—</span>
              <span>
                <Pinked text={it} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Tag({ step }: { step: Step }) {
  return (
    <p style={{ fontSize: "13px", color: "#C6CCD6", fontStyle: "italic", fontWeight: 500 }}>
      → {step.tagline}
    </p>
  );
}

function ConceptHeader({ letter, title, note }: { letter: string; title: string; note: string }) {
  return (
    <div style={{ marginBottom: "3rem", borderTop: "1px solid #1B3055", paddingTop: "2rem" }}>
      <p
        className="uppercase"
        style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#6B9FEE", marginBottom: "0.6rem" }}
      >
        Concept {letter}
      </p>
      <h2
        style={{
          fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: "#F0F5FF",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#8FA9CE", maxWidth: "560px" }}>{note}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
  border: "1px solid rgba(107,159,238,0.12)",
  borderRadius: "10px",
};

/* Liste de cartes-ticket : seule la mise en forme du numéro (panneau gauche) change. */
function NumberTicket({
  steps,
  importSteps,
  number,
  showKicker = true,
  compact = false,
}: {
  steps: Step[];
  importSteps: string[];
  number: (step: Step) => React.ReactNode;
  showKicker?: boolean;
  compact?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {steps.map((step, i) => (
        <div
          key={i}
          className="transition-transform duration-300 hover:-translate-y-1"
          style={{ ...cardStyle, overflow: "hidden" }}
        >
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr]">
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: compact ? "1.1rem 0.5rem" : "1.5rem 0.5rem",
                background: "linear-gradient(160deg, rgba(107,159,238,0.16) 0%, rgba(107,159,238,0.03) 100%)",
                borderRight: "1px solid rgba(107,159,238,0.18)",
              }}
            >
              {number(step)}
            </div>
            <div style={{ padding: compact ? "1.35rem clamp(1.25rem, 3vw, 2rem)" : "1.75rem clamp(1.25rem, 3vw, 2rem)" }}>
              {showKicker && (
                <p
                  className="uppercase"
                  style={{ fontSize: "0.62rem", letterSpacing: "0.3em", color: "#6B9FEE", marginBottom: "0.7rem" }}
                >
                  Étape {step.num}
                </p>
              )}
              <h3
                style={{
                  fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                  fontWeight: 800,
                  color: "#F0F5FF",
                  letterSpacing: "-0.01em",
                  marginBottom: "0.8rem",
                }}
              >
                {step.title}
              </h3>
              <Desc step={step} importSteps={importSteps} />
              <Tag step={step} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Style d'un chiffre en dégradé bleu → argent (taille/graisse paramétrables). */
function gradNum(fontSize: string, fontWeight = 800): React.CSSProperties {
  return {
    fontSize,
    fontWeight,
    lineHeight: 1,
    letterSpacing: "-0.03em",
    backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };
}

/* Carte-ticket paramétrable : proportions et tailles de texte réglables pour affiner le rendu. */
function RefinedTicket({
  steps,
  importSteps,
  gridCols,
  panelPad,
  number,
  contentPad,
  titleStyle,
  bodySize = 13,
}: {
  steps: Step[];
  importSteps: string[];
  gridCols: string;
  panelPad: string;
  number: (step: Step) => React.ReactNode;
  contentPad: string;
  titleStyle: React.CSSProperties;
  bodySize?: number;
}) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {steps.map((step, i) => (
        <div
          key={i}
          className="transition-transform duration-300 hover:-translate-y-1"
          style={{ ...cardStyle, overflow: "hidden" }}
        >
          <div className={`grid ${gridCols}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: panelPad,
                background: "linear-gradient(160deg, rgba(107,159,238,0.16) 0%, rgba(107,159,238,0.03) 100%)",
                borderRight: "1px solid rgba(107,159,238,0.18)",
              }}
            >
              {number(step)}
            </div>
            <div style={{ padding: contentPad }}>
              <h3 style={titleStyle}>{step.title}</h3>
              <div style={{ marginBottom: "0.7rem", maxWidth: "560px" }}>
                {step.description.split("\n").map((line, j, arr) => (
                  <p
                    key={j}
                    style={{
                      fontSize: `${bodySize}px`,
                      color: "#A8C6F4",
                      lineHeight: 1.65,
                      marginBottom: j < arr.length - 1 ? "0.5rem" : 0,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
              {step.num === "04" && (
                <ul style={{ listStyle: "none", margin: "0 0 0.7rem", padding: 0 }}>
                  {importSteps.map((it, k) => (
                    <li
                      key={k}
                      style={{
                        display: "flex",
                        gap: "0.6rem",
                        alignItems: "flex-start",
                        fontSize: `${bodySize}px`,
                        color: "#A8C6F4",
                        lineHeight: 1.5,
                        marginBottom: "0.4rem",
                      }}
                    >
                      <span style={{ color: "#6B9FEE", fontWeight: 700, flexShrink: 0 }}>—</span>
                      <span>
                        <Pinked text={it} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ fontSize: `${bodySize - 1}px`, color: "#C6CCD6", fontStyle: "italic", fontWeight: 500 }}>
                → {step.tagline}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CtaButtons({ contact, stock, center, stack }: { contact: string; stock: string; center?: boolean; stack?: boolean }) {
  return (
    <div className={`flex ${stack ? "flex-col" : "flex-col sm:flex-row"} gap-3 ${center ? "justify-center" : ""}`}>
      <a
        href="/recherche-personnalisee"
        className="inline-block text-center px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase transition-transform duration-300 hover:-translate-y-px"
        style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
      >
        {contact}
      </a>
      <a
        href="/vehicules"
        className="inline-block text-center px-8 py-4 text-xs font-semibold tracking-widest uppercase border transition-colors duration-300"
        style={{ borderColor: "rgba(107,159,238,0.4)", color: "#C8D8EE" }}
      >
        {stock}
      </a>
    </div>
  );
}

function PartDivider({ kicker, title, note }: { kicker: string; title: string; note: string }) {
  return (
    <div style={{ borderTop: "2px solid #1B3055", paddingTop: "2.5rem", marginBottom: "3.5rem" }}>
      <p className="uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#FF14E1", marginBottom: "0.8rem" }}>
        {kicker}
      </p>
      <h2
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: "#F0F5FF",
          marginBottom: "0.6rem",
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: "0.95rem", color: "#A8C6F4", maxWidth: "620px", lineHeight: 1.7 }}>{note}</p>
    </div>
  );
}

export default async function MethodeTestPage() {
  const { t } = await getTranslations();
  const s = t.method;
  const steps = s.steps as Step[];
  const importSteps = s.importSteps as string[];
  const secureItems = s.secureItems as SecureItem[];
  const pillars = s.pillars as Pillar[];
  const accents = ["#6B9FEE", "#5BD89A", "#C6CCD6"];

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>
        {/* Bandeau de test */}
        <div
          style={{
            backgroundColor: "#040B16",
            borderBottom: "1px solid #1B3055",
            paddingTop: "8rem",
            paddingBottom: "2.5rem",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <p
              className="uppercase"
              style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#FF14E1", marginBottom: "0.8rem" }}
            >
              Page de test · non indexée
            </p>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
              La méthode en 6 étapes — 11 mises en forme
            </h1>
            <p style={{ marginTop: "1rem", color: "#A8C6F4", maxWidth: "620px", lineHeight: 1.7 }}>
              Onze directions visuelles pour la même liste. Compare la lisibilité et l&apos;envie de lire, puis
              dis-moi laquelle on garde (ou quel mélange). L&apos;apparition au scroll et les micro-animations
              s&apos;ajoutent ensuite sur le concept retenu.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-12" style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>

          {/* ─────────── CONCEPT A · TIMELINE VERTICALE ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="A"
              title="Timeline verticale"
              note="Les numéros deviennent des nœuds reliés par un fil conducteur. On lit un vrai parcours, du premier échange à l'après-vente."
            />
            <div style={{ ...cardStyle, padding: "2.5rem clamp(1.5rem, 4vw, 3rem)" }}>
              <div style={{ position: "relative" }}>
                {steps.map((step, i) => {
                  const last = i === steps.length - 1;
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", gap: "1.5rem", position: "relative", paddingBottom: last ? 0 : "2.75rem" }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {!last && (
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "2.75rem",
                              bottom: 0,
                              width: "1px",
                              transform: "translateX(-50%)",
                              backgroundColor: "rgba(107,159,238,0.25)",
                            }}
                          />
                        )}
                        <span
                          style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "2.75rem",
                            height: "2.75rem",
                            borderRadius: "999px",
                            backgroundColor: "#0B1929",
                            border: "1px solid rgba(107,159,238,0.45)",
                            color: "#6B9FEE",
                            fontWeight: 900,
                            fontSize: "0.95rem",
                          }}
                        >
                          {step.num}
                        </span>
                      </div>
                      <div style={{ flex: 1, paddingTop: "0.3rem" }}>
                        <h3
                          style={{
                            fontSize: "clamp(1.15rem, 2vw, 1.5rem)",
                            fontWeight: 800,
                            color: "#F0F5FF",
                            letterSpacing: "-0.01em",
                            marginBottom: "0.7rem",
                          }}
                        >
                          {step.title}
                        </h3>
                        <Desc step={step} importSteps={importSteps} />
                        <Tag step={step} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ─────────── CONCEPT B · GRAND CHIFFRE ÉDITORIAL ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="B"
              title="Grand chiffre éditorial"
              note="Chaque étape est une carte détachée avec un énorme numéro fantôme. Look magazine, aéré, la carte se soulève au survol."
            />
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "2.25rem clamp(1.5rem, 4vw, 2.5rem)" }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: "-1.5rem",
                      right: "0.5rem",
                      fontSize: "clamp(5rem, 12vw, 8rem)",
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      color: "rgba(107,159,238,0.07)",
                      pointerEvents: "none",
                    }}
                  >
                    {step.num}
                  </span>
                  <div style={{ position: "relative", maxWidth: "600px" }}>
                    <p
                      className="uppercase"
                      style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#6B9FEE", marginBottom: "0.8rem" }}
                    >
                      Étape {step.num}
                    </p>
                    <h3
                      style={{
                        fontSize: "clamp(1.3rem, 2.4vw, 1.85rem)",
                        fontWeight: 900,
                        color: "#F0F5FF",
                        letterSpacing: "-0.02em",
                        marginBottom: "0.9rem",
                      }}
                    >
                      {step.title}
                    </h3>
                    <Desc step={step} importSteps={importSteps} />
                    <Tag step={step} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────── CONCEPT C · DEUX COLONNES STICKY ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="C"
              title="Deux colonnes sticky"
              note="À gauche un titre qui reste fixe pendant que les étapes défilent à droite. Très éditorial, effet de guidage (visible surtout sur grand écran)."
            />
            <div style={{ ...cardStyle, padding: "2.5rem clamp(1.5rem, 4vw, 3rem)" }}>
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]" style={{ gap: "clamp(2rem, 5vw, 4rem)" }}>
                <div>
                  <div className="lg:sticky" style={{ top: "7rem" }}>
                    <p
                      className="uppercase"
                      style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#6B9FEE", marginBottom: "0.9rem" }}
                    >
                      La méthode
                    </p>
                    <h3
                      style={{
                        fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                        fontWeight: 900,
                        color: "#F0F5FF",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                        marginBottom: "1.2rem",
                      }}
                    >
                      En 6<br />étapes.
                    </h3>
                    <div style={{ width: "40px", height: "2px", backgroundColor: "#C6CCD6", marginBottom: "1.2rem" }} />
                    <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.7, maxWidth: "260px" }}>
                      De la première discussion à l&apos;après-vente, un accompagnement de bout en bout.
                    </p>
                  </div>
                </div>

                <div>
                  {steps.map((step, i) => {
                    const last = i === steps.length - 1;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: "1.25rem",
                          paddingBottom: last ? 0 : "2rem",
                          marginBottom: last ? 0 : "2rem",
                          borderBottom: last ? "none" : "1px solid rgba(107,159,238,0.12)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: 900,
                            color: "#6B9FEE",
                            flexShrink: 0,
                            width: "2rem",
                            paddingTop: "0.15rem",
                          }}
                        >
                          {step.num}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                              fontWeight: 800,
                              color: "#F0F5FF",
                              letterSpacing: "-0.01em",
                              marginBottom: "0.7rem",
                            }}
                          >
                            {step.title}
                          </h4>
                          <Desc step={step} importSteps={importSteps} />
                          <Tag step={step} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ─────────── CONCEPT D · CARTE-TICKET ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="D"
              title="Carte-ticket"
              note="Un panneau numéroté à gauche, façon ticket, et le contenu à droite. Structuré, premium, lisible d'un coup d'œil."
            />
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, overflow: "hidden" }}
                >
                  <div className="grid grid-cols-[92px_1fr] sm:grid-cols-[140px_1fr]">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        padding: "1.5rem 0.5rem",
                        background:
                          "linear-gradient(160deg, rgba(107,159,238,0.16) 0%, rgba(107,159,238,0.03) 100%)",
                        borderRight: "1px solid rgba(107,159,238,0.18)",
                      }}
                    >
                      <span
                        className="uppercase"
                        style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#6B9FEE" }}
                      >
                        Étape
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(2.2rem, 4vw, 3rem)",
                          fontWeight: 900,
                          color: "#F0F5FF",
                          lineHeight: 1,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <div style={{ padding: "1.75rem clamp(1.25rem, 3vw, 2rem)" }}>
                      <h3
                        style={{
                          fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                          fontWeight: 800,
                          color: "#F0F5FF",
                          letterSpacing: "-0.01em",
                          marginBottom: "0.8rem",
                        }}
                      >
                        {step.title}
                      </h3>
                      <Desc step={step} importSteps={importSteps} />
                      <Tag step={step} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────── CONCEPT E · GRILLE MAGAZINE ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="E"
              title="Grille magazine"
              note="Les six étapes en mosaïque deux colonnes. Compact et dynamique, on embrasse tout le parcours d'un regard."
            />
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.25rem" }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, padding: "1.75rem clamp(1.5rem, 3vw, 2rem)", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.1rem" }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2.4rem",
                        height: "2.4rem",
                        flexShrink: 0,
                        borderRadius: "8px",
                        backgroundColor: "rgba(107,159,238,0.1)",
                        border: "1px solid rgba(107,159,238,0.3)",
                        color: "#6B9FEE",
                        fontWeight: 900,
                        fontSize: "0.9rem",
                      }}
                    >
                      {step.num}
                    </span>
                    <span style={{ flex: 1, height: "1px", backgroundColor: "rgba(107,159,238,0.18)" }} />
                  </div>
                  <h3
                    style={{
                      fontSize: "clamp(1.15rem, 2vw, 1.45rem)",
                      fontWeight: 800,
                      color: "#F0F5FF",
                      letterSpacing: "-0.01em",
                      marginBottom: "0.8rem",
                    }}
                  >
                    {step.title}
                  </h3>
                  <Desc step={step} importSteps={importSteps} />
                  <div style={{ marginTop: "auto", paddingTop: "0.4rem" }}>
                    <Tag step={step} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────── CONCEPT F · ÉDITORIAL ÉPURÉ ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="F"
              title="Éditorial épuré"
              note="Ni cartes ni cadres : de gros numéros fantômes, des filets fins et beaucoup d'air. Le parti pris le plus luxe et minimal."
            />
            <div>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_1fr]"
                  style={{
                    gap: "clamp(1.25rem, 4vw, 3rem)",
                    padding: "2.5rem 0",
                    borderTop: i === 0 ? "none" : "1px solid rgba(107,159,238,0.15)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
                      fontWeight: 900,
                      lineHeight: 0.85,
                      color: "rgba(107,159,238,0.35)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {step.num}
                  </span>
                  <div style={{ maxWidth: "640px" }}>
                    <h3
                      style={{
                        fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)",
                        fontWeight: 800,
                        color: "#F0F5FF",
                        letterSpacing: "-0.02em",
                        marginBottom: "0.9rem",
                      }}
                    >
                      {step.title}
                    </h3>
                    <Desc step={step} importSteps={importSteps} />
                    <Tag step={step} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────── CONCEPT G · CARTE-TICKET × GRAND CHIFFRE ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="G"
              title="Carte-ticket × grand chiffre"
              note="Le mix de tes préférés : la structure carte-ticket, avec à gauche le grand chiffre éditorial du concept B à la place du petit numéro."
            />
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, overflow: "hidden" }}
                >
                  <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr]">
                    <div
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1.5rem 0.5rem",
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
                          color: "rgba(107,159,238,0.28)",
                        }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <div style={{ padding: "1.75rem clamp(1.25rem, 3vw, 2rem)" }}>
                      <p
                        className="uppercase"
                        style={{ fontSize: "0.62rem", letterSpacing: "0.3em", color: "#6B9FEE", marginBottom: "0.7rem" }}
                      >
                        Étape {step.num}
                      </p>
                      <h3
                        style={{
                          fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                          fontWeight: 800,
                          color: "#F0F5FF",
                          letterSpacing: "-0.01em",
                          marginBottom: "0.8rem",
                        }}
                      >
                        {step.title}
                      </h3>
                      <Desc step={step} importSteps={importSteps} />
                      <Tag step={step} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────── CONCEPT H · CHIFFRE CONTOUR ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="H"
              title="Chiffre contour"
              note="Même carte-ticket, mais le numéro est en contour (outline) : lettres creuses cerclées de bleu. Très graphique et léger."
            />
            <NumberTicket
              steps={steps}
              importSteps={importSteps}
              number={(step) => (
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: "clamp(3.4rem, 8vw, 6rem)",
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: "transparent",
                    WebkitTextStroke: "1.5px rgba(107,159,238,0.75)",
                  }}
                >
                  {step.num}
                </span>
              )}
            />
          </section>

          {/* ─────────── CONCEPT I · CHIFFRE DÉGRADÉ ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="I"
              title="Chiffre dégradé"
              note="Le numéro est rempli d'un dégradé bleu vers argenté. Un peu de matière et de brillance, sans surcharger."
            />
            <NumberTicket
              steps={steps}
              importSteps={importSteps}
              showKicker={false}
              compact
              number={(step) => (
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
              )}
            />
          </section>

          {/* ─────────── CONCEPT J · CHIFFRE ARGENTÉ LUMINEUX ─────────── */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="J"
              title="Chiffre argenté lumineux"
              note="Numéro plein en argenté, avec un léger halo. Cohérent avec les nouvelles touches argentées du site."
            />
            <NumberTicket
              steps={steps}
              importSteps={importSteps}
              number={(step) => (
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: "clamp(3.4rem, 8vw, 6rem)",
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: "#C6CCD6",
                    textShadow: "0 0 18px rgba(198,204,214,0.35)",
                  }}
                >
                  {step.num}
                </span>
              )}
            />
          </section>

          {/* ─────────── CONCEPT K · CHIFFRE COMPTEUR / 06 ─────────── */}
          <section>
            <ConceptHeader
              letter="K"
              title="Chiffre compteur"
              note="Le numéro est présenté comme un compteur d'étapes (01 / 06). On ressent la progression dans le parcours."
            />
            <NumberTicket
              steps={steps}
              importSteps={importSteps}
              number={(step) => (
                <span aria-hidden="true" style={{ display: "flex", alignItems: "flex-end", gap: "0.15rem", color: "#6B9FEE" }}>
                  <span
                    style={{
                      fontSize: "clamp(3rem, 7vw, 5rem)",
                      fontWeight: 900,
                      lineHeight: 0.9,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {step.num}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "rgba(107,159,238,0.5)",
                      marginBottom: "0.55rem",
                    }}
                  >
                    / {String(steps.length).padStart(2, "0")}
                  </span>
                </span>
              )}
            />
          </section>

          {/* ═══════════ PARTIE 2 · CE QUE NOUS SÉCURISONS ═══════════ */}
          <PartDivider
            kicker="Partie 2 · alternatives"
            title="Ce que nous sécurisons"
            note="Quatre mises en forme pour les 6 garanties, dans le même esprit premium : plus esthétiques, agréables à lire et pratiques. Elles réutilisent les icônes et couleurs déjà prévues dans le contenu."
          />

          {/* S1 · CARTES À ICÔNE COLORÉE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S1"
              title="Cartes à icône colorée"
              note="Chaque garantie dans sa carte, avec une pastille d'icône à sa couleur. Coloré et clair, on repère chaque point d'un regard."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "1rem" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, padding: "1.5rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2.75rem",
                      height: "2.75rem",
                      borderRadius: "10px",
                      backgroundColor: tint(item.color, 0.12),
                      border: `1px solid ${tint(item.color, 0.35)}`,
                      fontSize: "1.25rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3
                    style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.01em", marginBottom: "0.5rem" }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* S2 · CHECK COLORÉ + FILETS */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S2"
              title="Check coloré + filets"
              note="Une liste éditoriale épurée sur deux colonnes, chaque garantie ponctuée d'un check à sa couleur. Sobre et haut de gamme."
            />
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: "3rem" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1.4rem 0", borderTop: "1px solid rgba(107,159,238,0.14)" }}
                >
                  <span style={{ color: item.color, fontWeight: 900, fontSize: "1rem", marginTop: "1px", flexShrink: 0 }}>✓</span>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.35rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* S3 · GRILLE COMPACTE À ACCENT */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S3"
              title="Grille compacte à accent"
              note="Six tuiles compactes, chacune coiffée d'un filet coloré. Dense et pratique, tout tient d'un seul coup d'œil."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "1rem" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "1.5rem" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      background: `linear-gradient(to right, ${item.color}, transparent)`,
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.7rem" }}>
                    <span style={{ fontSize: "1.15rem" }}>{item.icon}</span>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#F0F5FF" }}>{item.title}</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* S4 · BENTO — PREMIÈRE GARANTIE EN AVANT */}
          <section>
            <ConceptHeader
              letter="S4"
              title="Bento (garantie mise en avant)"
              note="Format asymétrique : la première garantie occupe toute la largeur, les autres suivent. Rythme dynamique, façon dashboard premium."
            />
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1rem" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className={`transition-transform duration-300 hover:-translate-y-1 ${i === 0 ? "md:col-span-3" : ""}`}
                  style={{ ...cardStyle, padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      width: "2.75rem",
                      height: "2.75rem",
                      borderRadius: "10px",
                      backgroundColor: tint(item.color, 0.12),
                      border: `1px solid ${tint(item.color, 0.35)}`,
                      fontSize: "1.25rem",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.4rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════ VARIANTES SANS ICÔNE ═══════════ */}
          <PartDivider
            kicker="Variantes sans icône"
            title="Ce que nous sécurisons — sans icône"
            note="Cinq styles nettement différents, sans aucune icône : chiffres éditoriaux, filet latéral, fiche technique, soulignement et grand format."
          />

          {/* S5 · GRANDS NUMÉROS ÉDITORIAUX */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S5"
              title="Grands numéros éditoriaux"
              note="Chaque garantie numérotée en gros chiffre coloré translucide, filets fins et beaucoup d'air. Typographique et haut de gamme."
            />
            <div>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_1fr]"
                  style={{
                    gap: "clamp(1rem, 3vw, 2rem)",
                    alignItems: "baseline",
                    padding: "1.6rem 0",
                    borderTop: i === 0 ? "none" : "1px solid rgba(107,159,238,0.14)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: tint(item.color, 0.55),
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.35rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6, maxWidth: "460px" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* S6 · ACCENT LATÉRAL COLORÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S6"
              title="Accent latéral coloré"
              note="Des cartes sobres, chacune marquée d'un filet vertical à sa couleur. Net et corporate, très lisible."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, padding: "1.4rem 1.5rem", borderLeft: `3px solid ${item.color}` }}
                >
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.4rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* S7 · FICHE TECHNIQUE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S7"
              title="Fiche technique"
              note="Un tableau encadré, lignes alternées, intitulé à gauche et détail à droite. Le format le plus « pratique », clair comme un cahier des charges."
            />
            <div style={{ ...cardStyle, overflow: "hidden" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-[220px_1fr]"
                  style={{
                    gap: "0.35rem 2rem",
                    padding: "1.25rem clamp(1.25rem, 3vw, 2rem)",
                    borderTop: i === 0 ? "none" : "1px solid rgba(107,159,238,0.12)",
                    backgroundColor: i % 2 === 1 ? "rgba(107,159,238,0.03)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#F0F5FF" }}>{item.title}</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* S8 · TITRE SOULIGNÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="S8"
              title="Titre souligné"
              note="Cartes en grille, chaque intitulé suivi d'un court soulignement dégradé à sa couleur. Discret mais élégant."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "1rem" }}>
              {secureItems.map((item, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, padding: "1.5rem" }}
                >
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.6rem" }}>{item.title}</h3>
                  <div
                    style={{
                      width: "32px",
                      height: "2px",
                      borderRadius: "1px",
                      background: `linear-gradient(to right, ${item.color}, transparent)`,
                      marginBottom: "0.8rem",
                    }}
                  />
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* S9 · GRAND FORMAT ÉDITORIAL */}
          <section>
            <ConceptHeader
              letter="S9"
              title="Grand format éditorial"
              note="Ni cartes ni accents : de grands intitulés en gras, un sous-texte discret, beaucoup d'espace. Le parti pris le plus luxe et minimal."
            />
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "2.5rem 3rem" }}>
              {secureItems.map((item, i) => (
                <div key={i}>
                  <h3
                    style={{
                      fontSize: "clamp(1.3rem, 2.4vw, 1.7rem)",
                      fontWeight: 900,
                      color: "#F0F5FF",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      marginBottom: "0.6rem",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.7, maxWidth: "420px" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════ ÉTAPES · VERSIONS AFFINÉES ═══════════ */}
          <PartDivider
            kicker="Étapes · versions affinées"
            title="Une méthode en six étapes — affiné"
            note="On garde la carte-ticket à chiffre dégradé, mais avec des chiffres et des textes réduits pour un rendu plus fin et moins massif. Quatre dosages différents."
          />

          {/* R1 · AFFINÉ (RÉDUIT D'UN CRAN) */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="R1"
              title="Affiné (réduit d'un cran)"
              note="Le modèle actuel, tout réduit d'un cran : chiffre, titre et texte plus compacts. Le même esprit, en plus léger."
            />
            <RefinedTicket
              steps={steps}
              importSteps={importSteps}
              gridCols="grid-cols-[84px_1fr] sm:grid-cols-[130px_1fr]"
              panelPad="1rem 0.5rem"
              number={(step) => (
                <span aria-hidden="true" style={gradNum("clamp(2.6rem, 6vw, 4.25rem)", 800)}>
                  {step.num}
                </span>
              )}
              contentPad="1.25rem clamp(1.1rem, 3vw, 1.75rem)"
              titleStyle={{ fontSize: "clamp(1.05rem, 1.8vw, 1.3rem)", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.01em", marginBottom: "0.6rem" }}
              bodySize={13}
            />
          </section>

          {/* R2 · NUMÉRO LÉGER + FILET */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="R2"
              title="Numéro léger + filet"
              note="Le chiffre est plus fin (moins gras) et souligné d'un court filet dégradé. Plus délicat, plus premium."
            />
            <RefinedTicket
              steps={steps}
              importSteps={importSteps}
              gridCols="grid-cols-[84px_1fr] sm:grid-cols-[130px_1fr]"
              panelPad="1rem 0.5rem"
              number={(step) => (
                <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <span style={gradNum("clamp(2.2rem, 5vw, 3.5rem)", 700)}>{step.num}</span>
                  <span style={{ width: "26px", height: "2px", borderRadius: "1px", background: "linear-gradient(to right, #6B9FEE, transparent)" }} />
                </span>
              )}
              contentPad="1.25rem clamp(1.1rem, 3vw, 1.75rem)"
              titleStyle={{ fontSize: "clamp(1.05rem, 1.8vw, 1.3rem)", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.01em", marginBottom: "0.6rem" }}
              bodySize={13}
            />
          </section>

          {/* R3 · TITRE EN VEDETTE, NUMÉRO DISCRET */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="R3"
              title="Titre en vedette, numéro discret"
              note="On inverse la hiérarchie : chiffre plus discret, titre légèrement mis en avant. Le regard va d'abord au texte."
            />
            <RefinedTicket
              steps={steps}
              importSteps={importSteps}
              gridCols="grid-cols-[76px_1fr] sm:grid-cols-[120px_1fr]"
              panelPad="1rem 0.5rem"
              number={(step) => (
                <span aria-hidden="true" style={gradNum("clamp(2rem, 4.5vw, 3.25rem)", 800)}>
                  {step.num}
                </span>
              )}
              contentPad="1.35rem clamp(1.25rem, 3vw, 2rem)"
              titleStyle={{ fontSize: "clamp(1.15rem, 2vw, 1.45rem)", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.015em", marginBottom: "0.65rem" }}
              bodySize={13}
            />
          </section>

          {/* R4 · ULTRA FIN */}
          <section>
            <ConceptHeader
              letter="R4"
              title="Ultra fin"
              note="La version la plus resserrée : cartes fines, chiffre et textes menus. Sobre et pointu."
            />
            <RefinedTicket
              steps={steps}
              importSteps={importSteps}
              gridCols="grid-cols-[70px_1fr] sm:grid-cols-[108px_1fr]"
              panelPad="0.9rem 0.5rem"
              number={(step) => (
                <span aria-hidden="true" style={gradNum("clamp(1.8rem, 4vw, 2.75rem)", 800)}>
                  {step.num}
                </span>
              )}
              contentPad="1.1rem clamp(1rem, 2.5vw, 1.5rem)"
              titleStyle={{ fontSize: "clamp(1rem, 1.7vw, 1.2rem)", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.01em", marginBottom: "0.55rem" }}
              bodySize={12}
            />
          </section>

          {/* ═══════════ NOS VALEURS ═══════════ */}
          <PartDivider
            kicker="Partie 3 · nos valeurs"
            title="Nos valeurs"
            note="Six pistes pour les 4 valeurs, dans le même univers que les étapes et les garanties (cartes sombres, dégradé bleu → argent, accents colorés). Différentes les unes des autres, à creuser ensuite."
          />

          {/* V1 · ACCENT LATÉRAL COLORÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="V1"
              title="Accent latéral coloré"
              note="Le raccord direct avec « Ce que nous sécurisons » : cartes à filet vertical coloré. Cohérence maximale."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, borderLeft: `3px solid ${p.color}`, padding: "1.4rem 1.5rem" }}
                >
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.4rem" }}>{p.title}</h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* V2 · CHIFFRE DÉGRADÉ + FILET */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="V2"
              title="Chiffre dégradé + filet"
              note="Le raccord avec les étapes : chaque valeur numérotée d'un petit chiffre dégradé souligné d'un filet."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, padding: "1.5rem" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.9rem" }}>
                    <span aria-hidden="true" style={gradNum("2rem", 800)}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ width: "24px", height: "2px", borderRadius: "1px", background: "linear-gradient(to right, #6B9FEE, transparent)" }} />
                  </div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.4rem" }}>{p.title}</h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* V3 · GRANDE INITIALE DÉGRADÉE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="V3"
              title="Grande initiale dégradée"
              note="La première lettre de chaque valeur en grand chiffre dégradé. Éditorial et mémorable."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, padding: "1.5rem", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                >
                  <span aria-hidden="true" style={gradNum("clamp(2.4rem, 5vw, 3.25rem)", 800)}>{p.title.charAt(0)}</span>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.4rem" }}>{p.title}</h3>
                    <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* V4 · FILET SUPÉRIEUR DÉGRADÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="V4"
              title="Filet supérieur dégradé"
              note="Quatre tuiles coiffées d'un filet coloré. Compact, tient sur une ligne en grand écran."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div
                  key={i}
                  className="transition-transform duration-300 hover:-translate-y-1"
                  style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "1.5rem" }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${p.color}, transparent)` }} />
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.5rem" }}>{p.title}</h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* V5 · PASTILLE COLORÉE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader
              letter="V5"
              title="Pastille colorée"
              note="Un simple point coloré devant chaque valeur. Minimaliste et discret, sans jamais alourdir."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div key={i} style={{ ...cardStyle, padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.7rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F0F5FF" }}>{p.title}</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* V6 · ÉDITORIAL ÉPURÉ */}
          <section>
            <ConceptHeader
              letter="V6"
              title="Éditorial épuré"
              note="Ni cartes ni cadres : de grands intitulés, un court soulignement coloré, beaucoup d'air. Le plus haut de gamme."
            />
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "2.5rem 3rem" }}>
              {pillars.map((p, i) => (
                <div key={i}>
                  <h3 style={{ fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", marginBottom: "0.6rem" }}>{p.title}</h3>
                  <div style={{ width: "32px", height: "2px", borderRadius: "1px", background: `linear-gradient(to right, ${p.color}, transparent)`, marginBottom: "0.8rem" }} />
                  <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.7, maxWidth: "420px" }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════ POSITIONNEMENT ═══════════ */}
          <PartDivider
            kicker="Partie 4 · positionnement"
            title="Un cabinet automobile premium"
            note="Sept façons de présenter le positionnement (accroche + argument + les 4 points), dans le même univers visuel. Volontairement variées, à départager ensuite."
          />

          {/* P1 · MANIFESTE CENTRÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P1" title="Manifeste centré" note="Une déclaration centrée, points en pastilles. Fort et affirmé." />
            <div style={{ ...cardStyle, padding: "clamp(2rem, 5vw, 3.5rem)", textAlign: "center" }}>
              <h3 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "600px", margin: "0 auto 1.8rem" }}>{s.cabinetText}</p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.6rem" }}>
                {s.cabinetPoints.map((pt, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.9rem", borderRadius: "999px", border: "1px solid rgba(107,159,238,0.25)", backgroundColor: "rgba(107,159,238,0.06)", fontSize: "12.5px", color: "#E8F0FC" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accents[i % accents.length] }} />
                    {pt}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* P2 · SPLIT DEUX COLONNES */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P2" title="Split deux colonnes" note="Accroche et argument à gauche, checklist à droite. Classique premium, très clair." />
            <div style={{ ...cardStyle, padding: "clamp(1.75rem, 4vw, 3rem)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "clamp(1.5rem, 4vw, 3rem)", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
                  <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75 }}>{s.cabinetText}</p>
                </div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {s.cabinetPoints.map((pt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.75rem", borderBottom: i < s.cabinetPoints.length - 1 ? "1px solid rgba(107,159,238,0.12)" : "none" }}>
                      <span style={{ color: accents[i % accents.length], fontWeight: 900, fontSize: "0.95rem", flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: "14px", color: "#E8F0FC" }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* P3 · INTRO + POINTS EN CARTES (ACCENT LATÉRAL) */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P3" title="Intro + points en cartes" note="Un bloc d'accroche, puis les points en petites cartes à filet latéral. Raccord direct avec les garanties." />
            <div style={{ ...cardStyle, padding: "clamp(1.75rem, 4vw, 2.5rem)", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "620px" }}>{s.cabinetText}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "1rem" }}>
              {s.cabinetPoints.map((pt, i) => (
                <div key={i} className="transition-transform duration-300 hover:-translate-y-1" style={{ ...cardStyle, borderLeft: `3px solid ${accents[i % accents.length]}`, padding: "1.1rem 1.25rem" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#F0F5FF", lineHeight: 1.4 }}>{pt}</p>
                </div>
              ))}
            </div>
          </section>

          {/* P4 · CITATION / PULL-QUOTE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P4" title="Grande citation" note="L'argument en pull-quote, gros guillemet dégradé, points en légende discrète. Éditorial et marquant." />
            <div style={{ ...cardStyle, padding: "clamp(2rem, 5vw, 3.5rem)", position: "relative", overflow: "hidden" }}>
              <span aria-hidden="true" style={{ position: "absolute", top: "0.5rem", left: "1.5rem", ...gradNum("clamp(4rem, 10vw, 7rem)", 900) }}>“</span>
              <div style={{ position: "relative" }}>
                <p className="uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#6B9FEE", marginBottom: "1.2rem" }}>{s.cabinetLabel}</p>
                <p style={{ fontSize: "clamp(1.15rem, 2.4vw, 1.6rem)", fontWeight: 700, color: "#F0F5FF", lineHeight: 1.4, maxWidth: "720px", marginBottom: "1.6rem" }}>{s.cabinetText}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
                  {s.cabinetPoints.map((pt, i) => (
                    <span key={i} style={{ fontSize: "12.5px", color: "#A8C6F4", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accents[i % accents.length] }} />
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* P5 · POINTS NUMÉROTÉS DÉGRADÉS */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P5" title="Points numérotés dégradés" note="Accroche puis points numérotés d'un petit chiffre dégradé. Raccord avec les étapes." />
            <div style={{ ...cardStyle, padding: "clamp(1.75rem, 4vw, 3rem)" }}>
              <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "620px", marginBottom: "2rem" }}>{s.cabinetText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1.25rem 2.5rem" }}>
                {s.cabinetPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "baseline", borderTop: "1px solid rgba(107,159,238,0.12)", paddingTop: "1rem" }}>
                    <span aria-hidden="true" style={gradNum("1.5rem", 800)}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: "14px", color: "#E8F0FC", fontWeight: 600 }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* P6 · BANDEAU HORIZONTAL */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P6" title="Bandeau horizontal" note="Accroche en haut, puis les points en bandeau segmenté à filet coloré. Rythmé, façon tableau de bord." />
            <div style={{ ...cardStyle, padding: "clamp(1.75rem, 4vw, 3rem)" }}>
              <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line", textAlign: "center" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "620px", margin: "0 auto 2rem", textAlign: "center" }}>{s.cabinetText}</p>
              <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "1px", backgroundColor: "rgba(107,159,238,0.15)", borderRadius: "8px", overflow: "hidden" }}>
                {s.cabinetPoints.map((pt, i) => (
                  <div key={i} style={{ backgroundColor: "#0B1929", padding: "1.25rem 1rem" }}>
                    <div style={{ width: "22px", height: "2px", borderRadius: "1px", background: `linear-gradient(to right, ${accents[i % accents.length]}, transparent)`, marginBottom: "0.7rem" }} />
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#F0F5FF", lineHeight: 1.4 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* P7 · ÉPURÉ TYPOGRAPHIQUE */}
          <section>
            <ConceptHeader letter="P7" title="Épuré typographique" note="Ni carte ni cadre : grande accroche, argument aéré, points en une ligne. Le plus minimal et luxe." />
            <div>
              <p className="uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#6B9FEE", marginBottom: "1rem" }}>{s.cabinetLabel}</p>
              <h3 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "15px", color: "#A8C6F4", lineHeight: 1.8, maxWidth: "620px", marginBottom: "1.5rem" }}>{s.cabinetText}</p>
              <p style={{ fontSize: "14px", color: "#E8F0FC", fontWeight: 600 }}>{s.cabinetPoints.join("  ·  ")}</p>
            </div>
          </section>

          {/* P8 · CENTRÉ MINIMAL (SÉPARATEURS) */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P8" title="Centré minimal" note="Accroche et argument centrés, sans cadre, points sur une ligne séparés de fins filets. Épuré." />
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.1rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "600px", margin: "0 auto 1.8rem" }}>{s.cabinetText}</p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "0.9rem" }}>
                {s.cabinetPoints.map((pt, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.9rem" }}>
                    {i > 0 && <span style={{ width: "1px", height: "14px", backgroundColor: "rgba(107,159,238,0.3)" }} />}
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#E8F0FC" }}>{pt}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* P9 · CENTRÉ + POINTS EN GRILLE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P9" title="Centré + points en grille" note="Accroche centrée dans une carte, puis les points en petite grille 2×2 centrée." />
            <div style={{ ...cardStyle, padding: "clamp(2rem, 5vw, 3rem)", textAlign: "center" }}>
              <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "600px", margin: "0 auto" }}>{s.cabinetText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "0.75rem", maxWidth: "560px", margin: "1.8rem auto 0" }}>
                {s.cabinetPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.75rem 1rem", border: "1px solid rgba(107,159,238,0.18)", borderRadius: "8px", backgroundColor: "rgba(107,159,238,0.05)" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accents[i % accents.length], flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#E8F0FC" }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* P10 · CENTRÉ À ACCENT */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="P10" title="Centré à accent" note="Carte pleine largeur, filet supérieur centré, accroche + argument centrés, soulignement dégradé et points en pastilles." />
            <div style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "clamp(2rem, 5vw, 3.5rem)", textAlign: "center" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(to right, transparent, #6B9FEE, transparent)" }} />
              <h3 style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.cabinetTitle}</h3>
              <div style={{ width: "40px", height: "2px", borderRadius: "1px", background: "linear-gradient(to right, #6B9FEE, #C6CCD6)", margin: "0 auto 1.2rem" }} />
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "600px", margin: "0 auto 1.8rem" }}>{s.cabinetText}</p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.6rem" }}>
                {s.cabinetPoints.map((pt, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.9rem", borderRadius: "999px", border: "1px solid rgba(107,159,238,0.25)", backgroundColor: "rgba(107,159,238,0.06)", fontSize: "12.5px", color: "#E8F0FC" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accents[i % accents.length] }} />
                    {pt}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════ NOS VALEURS · INITIALE DÉBUT DU MOT ═══════════ */}
          <PartDivider
            kicker="Nos valeurs · lettrine intégrée"
            title="Nos valeurs — initiale au début du mot"
            note="La première lettre du mot est agrandie et dégradée, le reste du mot enchaîne. Quatre traitements différents. (V4 « filet supérieur » reste validé pour la prod ; ceci est de l'exploration.)"
          />

          {/* VI1 · CAPITALE AGRANDIE (INLINE) */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="VI1" title="Capitale agrandie" note="La première lettre du titre agrandie en dégradé, le mot continue à sa suite. Simple et net." />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div key={i} className="transition-transform duration-300 hover:-translate-y-1" style={{ ...cardStyle, padding: "1.5rem" }}>
                  <h3 style={{ display: "flex", alignItems: "baseline", fontSize: "clamp(1.05rem, 1.9vw, 1.35rem)", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.9em", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{p.title.charAt(0)}</span>
                    <span>{p.title.slice(1)}</span>
                  </h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* VI2 · LETTRINE (DROP CAP) */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="VI2" title="Lettrine (drop cap)" note="La capitale géante en début de mot, le titre et la description s'écoulent autour. Éditorial, façon magazine." />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div key={i} className="transition-transform duration-300 hover:-translate-y-1" style={{ ...cardStyle, overflow: "hidden", padding: "1.5rem" }}>
                  <span style={{ float: "left", fontSize: "clamp(2.8rem, 6vw, 3.6rem)", fontWeight: 900, lineHeight: 0.78, marginRight: "0.5rem", marginTop: "0.15rem", backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{p.title.charAt(0)}</span>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.35rem" }}>{p.title.slice(1)}</h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* VI3 · LOGOTYPE MAJUSCULES */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="VI3" title="Logotype majuscules" note="Le mot en petites majuscules espacées, initiale agrandie en dégradé. Effet logotype, chic." />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div key={i} className="transition-transform duration-300 hover:-translate-y-1" style={{ ...cardStyle, padding: "1.5rem" }}>
                  <h3 style={{ display: "flex", alignItems: "baseline", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.85rem", fontWeight: 800, color: "#F0F5FF", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "2.2em", letterSpacing: "0", lineHeight: 1, backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{p.title.charAt(0)}</span>
                    <span>{p.title.slice(1)}</span>
                  </h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* VI4 · CAPITALE AGRANDIE + FILET (RACCORD V4) */}
          <section>
            <ConceptHeader letter="VI4" title="Capitale agrandie + filet" note="La capitale intégrée au mot, plus le filet supérieur coloré de V4. Le raccord le plus direct avec le choix validé." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "1rem" }}>
              {pillars.map((p, i) => (
                <div key={i} className="transition-transform duration-300 hover:-translate-y-1" style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "1.5rem" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${p.color}, transparent)` }} />
                  <h3 style={{ display: "flex", alignItems: "baseline", fontSize: "clamp(1rem, 1.7vw, 1.25rem)", fontWeight: 800, color: "#F0F5FF", letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.9em", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{p.title.charAt(0)}</span>
                    <span>{p.title.slice(1)}</span>
                  </h3>
                  <p style={{ fontSize: "13px", color: "#A8C6F4", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════ APPEL À L'ACTION (ENCADRÉ FINAL) ═══════════ */}
          <PartDivider
            kicker="Partie 5 · encadré final"
            title="Vous avez le projet. Nous avons la méthode."
            note="Sept mises en forme pour l'encadré de conclusion (titre + phrase + deux boutons), dans le même univers. À départager."
          />

          {/* C1 · CENTRÉ RAFFINÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="C1" title="Centré raffiné" note="La version actuelle, resserrée : eyebrow, grand titre, phrase, deux boutons centrés." />
            <div style={{ ...cardStyle, padding: "clamp(2.5rem, 6vw, 4rem)", textAlign: "center" }}>
              <p className="uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#6B9FEE", marginBottom: "1.2rem" }}>Intelligence Automobile</p>
              <h3 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 2rem" }}>{s.ctaSubtitle}</p>
              <CtaButtons contact={s.ctaContact} stock={s.ctaStock} center />
            </div>
          </section>

          {/* C2 · SPLIT MESSAGE / BOUTONS */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="C2" title="Split message / boutons" note="Message à gauche, boutons alignés à droite. Efficace, orienté action." />
            <div style={{ ...cardStyle, padding: "clamp(2rem, 5vw, 3.5rem)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "2rem", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
                  <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "440px" }}>{s.ctaSubtitle}</p>
                </div>
                <div className="flex md:justify-end">
                  <CtaButtons contact={s.ctaContact} stock={s.ctaStock} stack />
                </div>
              </div>
            </div>
          </section>

          {/* C3 · BANDEAU DÉGRADÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="C3" title="Bandeau dégradé" note="Fond bleuté plus marqué pour trancher avec le reste de la page. Centré, chaleureux." />
            <div style={{ background: "linear-gradient(135deg, rgba(107,159,238,0.18) 0%, rgba(107,159,238,0.04) 100%)", border: "1px solid rgba(107,159,238,0.25)", borderRadius: "12px", padding: "clamp(2.5rem, 6vw, 4rem)", textAlign: "center" }}>
              <h3 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
              <p style={{ fontSize: "14px", color: "#C8D8EE", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 2rem" }}>{s.ctaSubtitle}</p>
              <CtaButtons contact={s.ctaContact} stock={s.ctaStock} center />
            </div>
          </section>

          {/* C4 · TITRE GÉANT + UNDERLINE */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="C4" title="Titre géant + soulignement" note="Sans cadre, titre très grand, soulignement dégradé, boutons centrés. Impactant." />
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
              <div style={{ width: "48px", height: "2px", borderRadius: "1px", background: "linear-gradient(to right, #6B9FEE, #C6CCD6)", margin: "0 auto 1.5rem" }} />
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.8, maxWidth: "500px", margin: "0 auto 2rem" }}>{s.ctaSubtitle}</p>
              <CtaButtons contact={s.ctaContact} stock={s.ctaStock} center />
            </div>
          </section>

          {/* C5 · FILET SUPÉRIEUR CENTRÉ */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="C5" title="Filet supérieur centré" note="Carte à filet dégradé centré en haut, eyebrow, titre, phrase, boutons. Raccord avec les autres sections." />
            <div style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "clamp(2.5rem, 6vw, 4rem)", textAlign: "center" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(to right, transparent, #6B9FEE, transparent)" }} />
              <p className="uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#6B9FEE", marginBottom: "1.2rem" }}>Intelligence Automobile</p>
              <h3 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
              <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 2rem" }}>{s.ctaSubtitle}</p>
              <CtaButtons contact={s.ctaContact} stock={s.ctaStock} center />
            </div>
          </section>

          {/* C6 · MESSAGE + CARTE CONTACT */}
          <section style={{ marginBottom: "6rem" }}>
            <ConceptHeader letter="C6" title="Message + carte contact" note="Message à gauche, petit panneau d'action détaché à droite. Structuré, façon fiche contact." />
            <div style={{ ...cardStyle, padding: "clamp(2rem, 5vw, 3.5rem)" }}>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]" style={{ gap: "2.5rem", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "1rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
                  <p style={{ fontSize: "14px", color: "#A8C6F4", lineHeight: 1.75, maxWidth: "440px" }}>{s.ctaSubtitle}</p>
                </div>
                <div style={{ minWidth: "230px", padding: "1.5rem", borderRadius: "10px", border: "1px solid rgba(107,159,238,0.2)", backgroundColor: "rgba(107,159,238,0.05)" }}>
                  <p className="uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "#6B9FEE", marginBottom: "1rem" }}>Passer à l&apos;action</p>
                  <CtaButtons contact={s.ctaContact} stock={s.ctaStock} stack />
                </div>
              </div>
            </div>
          </section>

          {/* C7 · MINIMAL ÉDITORIAL */}
          <section>
            <ConceptHeader letter="C7" title="Minimal éditorial" note="Ni carte ni bouton plein : grand titre, phrase, actions en liens fléchés. Le plus sobre." />
            <div>
              <h3 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 900, color: "#F0F5FF", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{s.ctaTitle}</h3>
              <p style={{ fontSize: "15px", color: "#A8C6F4", lineHeight: 1.8, maxWidth: "520px", marginBottom: "1.8rem" }}>{s.ctaSubtitle}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.75rem", alignItems: "center" }}>
                <a href="/recherche-personnalisee" className="uppercase" style={{ color: "#6B9FEE", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em" }}>{s.ctaContact} →</a>
                <a href="/vehicules" className="uppercase" style={{ color: "#C8D8EE", fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.1em" }}>{s.ctaStock} →</a>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
