import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from "@/lib/i18n-server";
import ServicesAccordion from "./ServicesAccordion";

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

        {/* CSS : cadrage responsive — sur écrans portrait (téléphone/tablette), décale vers la droite
            pour garder la clé (élément clé du service) visible ; desktop/laptop inchangés (déjà complets). */}
        <style dangerouslySetInnerHTML={{ __html: `
          .ia-services-photo { object-position: center 42%; }
          .ia-services-title { font-size: clamp(2.6rem, 6vw, 5rem); }
          @media (max-aspect-ratio: 3/2) {
            .ia-services-photo { object-position: 72% 42%; }
          }
        ` }} />

        {/* ─── HERO ──────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", height: "100dvh", minHeight: "600px", overflow: "hidden", backgroundColor: "#070F1E" }}>
          {/* fond flou de secours : évite tout vide sur les ratios d'écran extrêmes */}
          <img
            src="/Photo du Site/Nos Services/Nos service 2.png"
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "blur(26px) brightness(0.5)", transform: "scale(1.18)" }}
          />
          {/* photo nette, plein cadre */}
          <img
            src="/Photo du Site/Nos Services/Nos service 2.png"
            alt=""
            className="ia-services-photo"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* assombrit le haut pour la lisibilité du logo du header */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "26%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
          {/* fondu bas : fusion avec le fond + lisibilité du titre */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "66%", background: "linear-gradient(to top, #070F1E 0%, rgba(7,15,30,0.9) 24%, rgba(7,15,30,0.5) 58%, transparent 100%)" }} />

          <div style={{ position: "absolute", left: "6vw", right: "6vw", bottom: "8vh", maxWidth: "1400px", margin: "0 auto" }}>
            <h1 className="ia-services-title" style={{ fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.03em", color: "#F0F5FF", margin: 0 }}>
              {s.heroTitle.map((line, i) => (
                <span key={i} style={{ display: "block", color: i === s.heroTitle.length - 1 ? "#6B9FEE" : "#F0F5FF" }}>{line}</span>
              ))}
            </h1>
            <div style={{ marginTop: "1.8rem" }}>
              <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
              <p style={{ color: "rgba(214,228,246,0.82)", fontSize: "clamp(0.82rem, 1.1vw, 0.92rem)", lineHeight: 1.8, fontWeight: 300, maxWidth: "460px", fontStyle: "italic", letterSpacing: "0.01em" }}>
                {s.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTIONS SERVICES ─────────────────────────────────────────── */}
        <ServicesAccordion items={s.items} />

        {/* ─── CTA ───────────────────────────────────────────────────────── */}
        <section
          className="px-6 lg:px-12"
          style={{ paddingTop: "90px", paddingBottom: "110px", background: "linear-gradient(180deg, #040B16 0%, #070F1E 100%)" }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9DBFF2", marginBottom: "1.4rem" }}>
              {s.ctaLabel}
            </p>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.6rem)", letterSpacing: "-0.03em", lineHeight: 0.95, textTransform: "uppercase" }}>
              {s.ctaTitle.map((l, i) => (
                <span key={i} style={{ display: "block", color: i === s.ctaTitle.length - 1 ? "#6B9FEE" : "#F0F5FF" }}>{l}</span>
              ))}
            </h2>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center transition-opacity hover:opacity-90"
                style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "16px 40px" }}
              >
                {s.ctaContact}
              </Link>
              <Link
                href="/vehicules"
                className="inline-flex items-center transition-colors"
                style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#F0F5FF", border: "1px solid rgba(240,245,255,0.2)", padding: "16px 40px" }}
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
