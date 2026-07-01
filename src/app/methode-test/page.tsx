import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Méthode — page de test (3 concepts)",
  robots: { index: false, follow: false },
};

type Step = { num: string; title: string; description: string; tagline: string };
type SecureItem = { icon: string; color: string; title: string; desc: string };

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

        </div>
      </main>
      <Footer />
    </>
  );
}
