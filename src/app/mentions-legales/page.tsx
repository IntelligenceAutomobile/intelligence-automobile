import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";
import { fr } from "@/i18n/fr";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.legal.metaTitle };
}

// Rend un paragraphe en transformant l'email et les URL en liens cliquables.
function linkify(text: string) {
  const parts = text.split(/(contact@intelligenceautomobile\.com|vercel\.com|mcpmediation\.org|ec\.europa\.eu\/consumers\/odr|intelligenceautomobile\.fr|intelligenceautomobile\.com)/g);
  return parts.map((part, i) => {
    if (part === "contact@intelligenceautomobile.com") {
      return (
        <a key={i} href={`mailto:${part}`} style={{ color: "#6B9FEE" }}>
          {part}
        </a>
      );
    }
    if (
      part === "vercel.com" ||
      part === "mcpmediation.org" ||
      part === "ec.europa.eu/consumers/odr" ||
      part === "intelligenceautomobile.com" ||
      part === "intelligenceautomobile.fr"
    ) {
      return (
        <a
          key={i}
          href={`https://${part}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6B9FEE" }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default async function MentionsLegalesPage() {
  const { t } = await getTranslations();
  const s: typeof fr.legal = t.legal;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", minHeight: "100vh" }}>
        <div
          className="max-w-3xl mx-auto px-6 lg:px-12"
          style={{ paddingTop: "9rem", paddingBottom: "6rem" }}
        >
          {/* En-tête */}
          <div
            style={{
              width: "40px",
              height: "2px",
              background: "linear-gradient(to right, #C6CCD6, rgba(198,204,214,0))",
              borderRadius: "2px",
              boxShadow: "0 0 8px rgba(198,204,214,0.35)",
              marginBottom: "1.4rem",
            }}
          />
          <h1
            className="font-black leading-tight"
            style={{
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              letterSpacing: "-0.025em",
              color: "#F0F5FF",
              marginBottom: "0.9rem",
            }}
          >
            {s.title}
          </h1>
          <p
            className="text-[13px]"
            style={{ color: "#6B9FEE", marginBottom: "3.5rem", fontFamily: "var(--font-inter)" }}
          >
            {s.updated}
          </p>

          {/* Sections */}
          <div className="space-y-12" style={{ fontFamily: "var(--font-inter)" }}>
            {s.sections.map((section, i) => (
              <section key={i}>
                <h2
                  className="text-[11px] font-semibold tracking-widest uppercase mb-4"
                  style={{ color: "#6B9FEE" }}
                >
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p
                      key={j}
                      className="text-[15px] leading-relaxed"
                      style={{ color: "#C8D8EE" }}
                    >
                      {linkify(p)}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
