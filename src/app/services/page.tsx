import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Services — Intelligence Automobile",
  description:
    "Garantie, financement, assurances, démarches administratives (WW, CPI) et carte grise définitive : tout ce qui entoure votre acquisition, pris en charge.",
};

export default async function ServicesPage() {
  const { t } = await getTranslations();
  const s = t.services;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ─── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden flex items-end"
          style={{ height: "100vh", minHeight: "600px", backgroundColor: "#070F1E", paddingBottom: "8vh" }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/Photo%20du%20Site/Nos%20Services/Nos%20service%202.png')",
              backgroundSize: "cover",
              backgroundPosition: "center 45%",
            }}
          />
          {/* Fondu bas pour la lisibilité */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #070F1E 16%, rgba(7,15,30,0.45) 55%, rgba(7,15,30,0.12) 100%)" }}
          />
          {/* Renfort gauche (le texte y est posé) */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(7,15,30,0.82) 0%, rgba(7,15,30,0.38) 38%, transparent 68%)" }}
          />

          <div className="relative w-full px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <p className="text-[11px] sm:text-sm tracking-[0.4em] uppercase font-bold mb-6" style={{ color: "#6B9FEE" }}>
                {s.heroLabel}
              </p>
              <h1 className="font-light leading-[1.05]" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}>
                {s.heroTitle.map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </h1>
              <p className="mt-8 max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: "rgba(240,245,255,0.78)" }}>
                {s.heroSubtitle}
              </p>

              {/* Accès rapide aux sections */}
              <div className="mt-10 flex flex-wrap gap-3">
                {s.items.map((it) => (
                  <a
                    key={it.id}
                    href={`#${it.id}`}
                    className="text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 rounded-full transition-colors duration-200"
                    style={{ color: "#A8C4F0", border: "1px solid rgba(107,159,238,0.3)", backgroundColor: "rgba(7,15,30,0.35)" }}
                  >
                    {it.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTIONS SERVICES ─────────────────────────────────────────── */}
        {s.items.map((it, idx) => (
          <section
            key={it.id}
            id={it.id}
            className="px-6 lg:px-12 scroll-mt-[150px] lg:scroll-mt-[180px]"
            style={{
              paddingTop: "70px",
              paddingBottom: "70px",
              backgroundColor: idx % 2 === 0 ? "#070F1E" : "#040B16",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              {/* Colonne titre */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-4 mb-5">
                  <span
                    className="font-black tabular-nums flex items-center justify-center leading-none flex-shrink-0"
                    style={{
                      fontSize: "1.05rem",
                      color: "#6B9FEE",
                      width: "2.75rem",
                      height: "2.75rem",
                      backgroundColor: "rgba(107,159,238,0.1)",
                      border: "1px solid rgba(107,159,238,0.3)",
                      borderRadius: "8px",
                    }}
                  >
                    {it.num}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: "rgba(107,159,238,0.25)" }} />
                </div>
                <h2 className="font-light leading-tight" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>
                  {it.title}
                </h2>
                <div className="mt-4" style={{ width: "48px", height: "3px", background: "linear-gradient(to right, #C6CCD6, transparent)", borderRadius: "2px" }} />
                <p className="mt-4 text-lg" style={{ color: "#8BB8F5" }}>{it.subtitle}</p>
              </div>

              {/* Colonne contenu */}
              <div className="lg:col-span-7">
                <div className="space-y-4">
                  {it.paragraphs.map((p, i) => (
                    <p key={i} className="text-base sm:text-[1.05rem] leading-relaxed" style={{ color: "rgba(240,245,255,0.78)" }}>
                      {p}
                    </p>
                  ))}
                </div>
                <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {it.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "#D4E2F4" }}>
                      <span className="mt-[7px] flex-shrink-0" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C6CCD6" }} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}

        {/* ─── CTA ───────────────────────────────────────────────────────── */}
        <section
          className="px-6 lg:px-12"
          style={{ paddingTop: "90px", paddingBottom: "110px", background: "linear-gradient(180deg, #040B16 0%, #070F1E 100%)" }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.4em] uppercase font-bold mb-5" style={{ color: "#6B9FEE" }}>
              {s.ctaLabel}
            </p>
            <h2 className="font-light leading-tight" style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)" }}>
              {s.ctaTitle.map((l, i) => (
                <span key={i} className="block">{l}</span>
              ))}
            </h2>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center text-[11px] font-bold tracking-[0.2em] uppercase px-8 py-4 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
              >
                {s.ctaContact}
              </Link>
              <Link
                href="/vehicules"
                className="inline-flex items-center text-[11px] font-bold tracking-[0.2em] uppercase px-8 py-4 transition-colors"
                style={{ color: "#A8C4F0", border: "1px solid rgba(107,159,238,0.4)" }}
              >
                {s.ctaStock}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
