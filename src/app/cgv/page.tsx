import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";
import { fr } from "@/i18n/fr";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.cgv.metaTitle };
}

// Rend un texte en transformant l'email et les adresses de site en liens.
// Le site du médiateur et la plateforme européenne doivent rester atteignables
// d'un clic : c'est ce que la loi attend d'une information « accessible ».
function linkify(text: string) {
  const parts = text.split(
    /(contact@intelligenceautomobile\.com|mcpmediation\.org|ec\.europa\.eu\/consumers\/odr)/g
  );
  return parts.map((part, i) => {
    if (part === "contact@intelligenceautomobile.com") {
      return (
        <a key={i} href={`mailto:${part}`} style={{ color: "#6B9FEE" }}>
          {part}
        </a>
      );
    }
    if (part === "mcpmediation.org" || part === "ec.europa.eu/consumers/odr") {
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

export default async function CgvPage() {
  const { t } = await getTranslations();
  const s: typeof fr.cgv = t.cgv;

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
          <div className="space-y-11" style={{ fontFamily: "var(--font-inter)" }}>
            {s.sections.map((section, i) => (
              <section key={i}>
                <h2
                  className="text-[11px] font-semibold tracking-widest uppercase mb-4"
                  style={{ color: "#6B9FEE" }}
                >
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.blocks.map((block, j) =>
                    block.list !== undefined ? (
                      <ul key={j} className="space-y-2.5 pl-1">
                        {block.list.map((item, k) => (
                          <li
                            key={k}
                            className="flex gap-3 text-[15px] leading-relaxed"
                            style={{ color: "#C8D8EE" }}
                          >
                            <span style={{ color: "#6B9FEE", flexShrink: 0 }}>—</span>
                            <span>{linkify(item)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={j}
                        className="text-[15px] leading-relaxed"
                        style={{ color: "#C8D8EE" }}
                      >
                        {linkify(block.text)}
                      </p>
                    )
                  )}
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
