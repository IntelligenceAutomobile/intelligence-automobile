import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/format";

export default async function HomePage() {
  const [{ t }, derniersVehicules, stockCount] = await Promise.all([
    getTranslations(),
    prisma.vehicle.findMany({
      where: { status: "disponible" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.vehicle.count({ where: { status: "disponible" } }),
  ]);

  return (
    <>
      {/* CSS global : marquee + transitions */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ia-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ia-marquee-track {
          display: flex;
          width: max-content;
          animation: ia-marquee 32s linear infinite;
        }
        .ia-service-img {
          transition: transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .ia-service-block:hover .ia-service-img {
          transform: scale(1.04);
        }
        .ia-card:hover .ia-card-img {
          transform: scale(1.04);
        }
        .ia-card-img {
          transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94);
        }

        /* 7. STOCK — cartes véhicules */
        .ia-card {
          position: relative;
          transition: background-color 0.5s cubic-bezier(0.25,0.46,0.45,0.94),
                      box-shadow 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .ia-card:hover {
          background-color: #0A1526;
          box-shadow: inset 0 0 0 1px rgba(107,159,238,0.35), 0 0 45px rgba(107,159,238,0.13);
          z-index: 1;
        }
        .ia-card-arrow, .ia-stock-arrow {
          display: inline-block;
          transition: transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .ia-card:hover .ia-card-arrow,
        .ia-stock-link:hover .ia-stock-arrow {
          transform: translateX(5px);
        }
        .ia-card-detail {
          transition: color 0.4s ease;
        }
        .ia-card:hover .ia-card-detail {
          color: #CFE0FB;
        }
        @keyframes ia-card-reveal {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            .ia-card {
              animation: ia-card-reveal linear both;
              animation-timeline: view();
              animation-range: entry 0% entry 42%;
            }
          }
        }
        .ia-rail {
          position: relative;
          height: 18px;
          overflow: hidden;
          pointer-events: none;
        }
        .ia-rail::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          transform: translateY(-50%);
          background-color: #1B3055;
        }
        .ia-rail-beam {
          position: absolute;
          top: 50%;
          left: 0;
          width: 22%;
          height: 2px;
          transform: translateY(-50%) translateX(-110%);
          background: linear-gradient(90deg, transparent, rgba(140,180,240,0.7), transparent);
          box-shadow: 0 0 10px 1px rgba(107,159,238,0.38);
          animation: ia-rail-flow 5s linear infinite;
        }
        @keyframes ia-rail-flow {
          0%   { transform: translateY(-50%) translateX(-110%); }
          100% { transform: translateY(-50%) translateX(560%); }
        }
        .ia-stock-dot {
          animation: ia-stock-dot-pulse 2.4s ease-in-out infinite;
        }
        @keyframes ia-stock-dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(107,159,238,0.5); opacity: 1; }
          50%      { box-shadow: 0 0 8px 2px rgba(107,159,238,0.55); opacity: 0.6; }
        }
        .ia-stock-cta {
          transition: box-shadow 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .ia-stock-cta:hover {
          box-shadow: 0 0 34px rgba(240,245,255,0.22);
        }
        @media (prefers-reduced-motion: reduce) {
          .ia-card { animation: none; }
          .ia-rail-beam { animation: none; opacity: 0; }
          .ia-stock-dot { animation: none; }
        }

        /* 6. PROCESSUS — étapes interactives + ligne lumineuse + apparition au scroll */
        .ia-step {
          transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .ia-step:hover {
          transform: translateY(-6px);
        }
        .ia-step-num {
          border: 1px solid #1B3055;
          background-color: #070F1E;
          color: #6B9FEE;
          box-shadow: 0 0 18px rgba(107,159,238,0.12);
          animation: ia-num-pulse 4s linear infinite;
        }
        .ia-step:nth-child(1) .ia-step-num { animation-delay: 0.32s; }
        .ia-step:nth-child(2) .ia-step-num { animation-delay: 1.65s; }
        .ia-step:nth-child(3) .ia-step-num { animation-delay: 2.99s; }
        @keyframes ia-num-pulse {
          0%   { border-color: #1B3055; color: #6B9FEE; box-shadow: 0 0 18px rgba(107,159,238,0.12); }
          6%   { border-color: #6B9FEE; color: #E2EEFE; box-shadow: 0 0 22px 2px rgba(107,159,238,0.5); }
          14%  { border-color: #1B3055; color: #6B9FEE; box-shadow: 0 0 18px rgba(107,159,238,0.12); }
          100% { border-color: #1B3055; color: #6B9FEE; box-shadow: 0 0 18px rgba(107,159,238,0.12); }
        }
        .ia-process-line {
          position: absolute;
          top: 12px;
          left: 16.6%;
          right: 16.6%;
          height: 22px;
          overflow: hidden;
          pointer-events: none;
        }
        .ia-process-line::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          transform: translateY(-50%);
          background-color: #1B3055;
        }
        .ia-process-beam {
          position: absolute;
          top: 50%;
          left: 0;
          width: 30%;
          height: 2px;
          transform: translateY(-50%) translateX(-120%);
          background: linear-gradient(90deg, transparent, rgba(140,180,240,0.7), transparent);
          box-shadow: 0 0 10px 1px rgba(107,159,238,0.38);
          animation: ia-process-flow 4s linear infinite;
        }
        @keyframes ia-process-flow {
          0%   { transform: translateY(-50%) translateX(-120%); }
          100% { transform: translateY(-50%) translateX(380%); }
        }
        @keyframes ia-step-reveal {
          to { opacity: 1; transform: translateY(0); }
        }
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            .ia-step-inner {
              opacity: 0;
              transform: translateY(30px);
              animation: ia-step-reveal linear both;
              animation-timeline: view();
              animation-range: entry 5% entry 50%;
            }
            .ia-step:nth-child(2) .ia-step-inner { animation-range: entry 14% entry 59%; }
            .ia-step:nth-child(3) .ia-step-inner { animation-range: entry 23% entry 68%; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ia-process-beam { animation: none; opacity: 0; }
          .ia-step-num { animation: none; }
          .ia-step, .ia-step:hover { transition: none; transform: none; }
        }
      ` }} />

      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", overflowX: "hidden" }}>

        {/* 1. HERO — mobile : bande photo (voiture entière, format 3:2 = aucun rognage) + titre dessous */}
        <section className="md:hidden" style={{ position: "relative", backgroundColor: "#070F1E" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", overflow: "hidden" }}>
            <img
              src="/Photo du Site/Photo IA/ChatGPT Image 5 juin 2026, 09_00_29.png"
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
            {/* assombrit le haut pour la lisibilité du logo posé dessus */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to bottom, rgba(7,15,30,0.85) 0%, transparent 100%)" }} />
            {/* fondu bas qui fusionne la photo avec le fond sombre */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, #070F1E 0%, transparent 100%)" }} />
          </div>
          <div style={{ padding: "0.25rem 6vw 2.75rem" }}>
            <h1 style={{ fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em", fontSize: "clamp(2.4rem, 11vw, 3.4rem)", color: "#F0F5FF", marginBottom: "1.75rem" }}>
              {t.home.heroTitle[0]}
              <br />{t.home.heroTitle[1]}
              <br /><span style={{ color: "#6B9FEE" }}>{t.home.heroTitle[2]}</span>
            </h1>
            <Link
              href="/vehicules-2"
              style={{ display: "inline-flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "16px 32px", transition: "opacity 0.2s" }}
            >
              {t.home.heroCta}
            </Link>
          </div>
        </section>

        {/* 1. HERO — desktop : plein écran immersif (inchangé) */}
        <section className="hidden md:block" style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
          <img
            src="/Photo du Site/Photo IA/ChatGPT Image 5 juin 2026, 09_00_29.png"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 1.0 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(7,15,30,0.78) 0%, rgba(7,15,30,0.18) 55%, transparent 100%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "38%", background: "linear-gradient(to top, #070F1E 0%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 70% at 75% 44%, rgba(107,159,238,0.06) 0%, transparent 100%)" }} />

          <div style={{ position: "absolute", bottom: "8vh", left: "6vw", right: "6vw" }}>
            <h1 style={{ fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.04em", fontSize: "clamp(3rem, 5.5vw, 5.5rem)", color: "#F0F5FF", marginBottom: "3rem", maxWidth: "700px" }}>
              {t.home.heroTitle[0]}
              <br />{t.home.heroTitle[1]}
              <br /><span style={{ color: "#6B9FEE" }}>{t.home.heroTitle[2]}</span>
            </h1>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Link
                href="/vehicules-2"
                style={{ display: "inline-flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "14px 32px", transition: "opacity 0.2s" }}
              >
                {t.home.heroCta}
              </Link>
            </div>
          </div>

          <div style={{ position: "absolute", right: "3.5vw", bottom: "10vh", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "#1B3055", writingMode: "vertical-rl" }}>{t.home.scrollIndicator}</span>
            <div style={{ width: "1px", height: "56px", background: "linear-gradient(to bottom, #1B3055, transparent)" }} />
          </div>
        </section>

        {/* 2. MARQUEE */}
        <div style={{ borderTop: "1px solid #1B3055", borderBottom: "1px solid #1B3055", backgroundColor: "#040B16", overflow: "hidden", height: "54px", display: "flex", alignItems: "center" }}>
          <div className="ia-marquee-track">
            {[1, 2].map((n) => (
              <span key={n} style={{ fontSize: "11px", letterSpacing: "0.45em", textTransform: "uppercase", color: "#7A9CC8", whiteSpace: "nowrap", paddingRight: "4rem" }}>
                PORSCHE &nbsp;·&nbsp; BMW M &nbsp;·&nbsp; MERCEDES AMG &nbsp;·&nbsp; AUDI RS &nbsp;·&nbsp; FERRARI &nbsp;·&nbsp; ALPINE &nbsp;·&nbsp; MASERATI &nbsp;·&nbsp; ALFA ROMEO &nbsp;·&nbsp; LAMBORGHINI &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* 3. CHIFFRES */}
        <section style={{ backgroundColor: "#040B16" }}>
          {t.home.stats.map((s) => (
            <div key={s.val}>
              <div style={{ height: "1px", background: "linear-gradient(to right, transparent 0%, #1B3055 15%, #1B3055 85%, transparent 100%)" }} />
              <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "4.5vh 6vw", display: "flex", alignItems: "center", gap: "5vw" }}>
                <div style={{ fontWeight: 900, fontSize: "clamp(2.8rem, 5.5vw, 5rem)", letterSpacing: "-0.04em", color: "#F0F5FF", lineHeight: 1, flexShrink: 0, minWidth: "200px", borderLeft: "2px solid #6B9FEE", paddingLeft: "1.6rem" }}>
                  {s.val}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#C8D8EE", letterSpacing: "0.03em" }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent 0%, #1B3055 15%, #1B3055 85%, transparent 100%)" }} />
        </section>

        {/* SERVICE 01 — Recherche */}
        <section className="ia-service-block" style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16" }}>
          <Link href="/recherche-2" className="flex flex-col lg:flex-row" style={{ alignItems: "center", textDecoration: "none", cursor: "pointer" }}>
            <div className="w-full lg:w-[58%]" style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}>
              <img className="ia-service-img" src="/Photo du Site/Photo IA/Recherche personnalisé.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 55%, #040B16 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040B16 0%, transparent 25%)" }} />
            </div>
            <div className="w-full lg:w-[42%]" style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6vh 5vw", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-1.5rem", left: 0, fontSize: "clamp(5rem, 12vw, 10rem)", fontWeight: 900, color: "rgba(107,159,238,0.14)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>01</div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", marginBottom: "1.6rem", lineHeight: 1.05 }}>
                  {t.home.service01Title[0]}<br />{t.home.service01Title[1]}
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.85, color: "#C4D8EE", maxWidth: "340px", marginBottom: "2.4rem", borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.9rem" }}>
                  {t.home.service01Desc}
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* SERVICE 02 — Revente */}
        <section className="ia-service-block" style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16" }}>
          <Link href="/aide-vente-2" className="flex flex-col-reverse lg:flex-row" style={{ alignItems: "center", textDecoration: "none", cursor: "pointer" }}>
            <div className="w-full lg:w-[42%]" style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6vh 5vw", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-1.5rem", left: 0, fontSize: "clamp(5rem, 12vw, 10rem)", fontWeight: 900, color: "rgba(107,159,238,0.14)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>02</div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", marginBottom: "1.6rem", lineHeight: 1.05 }}>
                  {t.home.service02Title[0]}<br />{t.home.service02Title[1]}
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.85, color: "#C4D8EE", maxWidth: "340px", marginBottom: "2.4rem", borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.9rem" }}>
                  {t.home.service02Desc}
                </p>
              </div>
            </div>
            <div className="w-full lg:w-[58%]" style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}>
              <img className="ia-service-img" src="/Photo du Site/Photo IA/Revente sur mesure 4.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 55%, #040B16 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040B16 0%, transparent 25%)" }} />
            </div>
          </Link>
        </section>

        {/* SERVICE 03 — Transport */}
        <section className="ia-service-block" style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16" }}>
          <Link href="/convoyage-2" className="flex flex-col lg:flex-row" style={{ alignItems: "center", textDecoration: "none", cursor: "pointer" }}>
            <div className="w-full lg:w-[58%]" style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}>
              <img className="ia-service-img" src="/Photo du Site/Photo IA/Covoyage 3 Logo Mate Optimiser Telephone Eloigné2  16 9eme.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 55%, #040B16 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040B16 0%, transparent 25%)" }} />
            </div>
            <div className="w-full lg:w-[42%]" style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6vh 5vw", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-1.5rem", left: 0, fontSize: "clamp(5rem, 12vw, 10rem)", fontWeight: 900, color: "rgba(107,159,238,0.14)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>03</div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", marginBottom: "1.6rem", lineHeight: 1.05 }}>
                  {t.home.service03Title[0]}<br />{t.home.service03Title[1]}
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.85, color: "#C4D8EE", maxWidth: "340px", marginBottom: "2.4rem", borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.9rem" }}>
                  {t.home.service03Desc}
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* 6. PROCESSUS */}
        <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E", padding: "12vh 0" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 5vw" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.42em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "6vh", textAlign: "center" }}>
              {t.home.processLabel}
            </p>
            <div style={{ position: "relative" }}>
              <div className="ia-process-line"><span className="ia-process-beam" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
                {t.home.processSteps.map((s) => (
                  <div key={s.n} className="ia-step" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 3vw" }}>
                    <div className="ia-step-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                      <div className="ia-step-num" style={{ width: "46px", height: "46px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "2.4rem", flexShrink: 0, position: "relative", zIndex: 1 }}>
                        {s.n}
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#F0F5FF", marginBottom: "1rem" }}>
                        {s.title}
                      </h4>
                      <p style={{ fontSize: "13px", lineHeight: 1.75, color: "#C4D8EE", maxWidth: "240px" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "6vh" }}>
              <Link href="/methode-2" style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", borderBottom: "1px solid rgba(107,159,238,0.3)", paddingBottom: "2px" }}>
                {t.home.processLink}
              </Link>
            </div>
          </div>
        </section>

        {/* 7. DERNIERS VÉHICULES */}
        {derniersVehicules.length > 0 && (
          <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E", padding: "10vh 0 12vh" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 5vw" }}>
              <div style={{ marginBottom: "5vh" }}>
                <p style={{ fontSize: "10px", letterSpacing: "0.42em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "1.4rem" }}>
                  {t.home.stockLabel}
                </p>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem 2rem" }}>
                  <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem, 4.5vw, 3.8rem)", letterSpacing: "-0.025em", textTransform: "uppercase", lineHeight: 1, color: "#F0F5FF" }}>
                    {t.home.stockTitle}<span style={{ color: "#6B9FEE" }}>.</span>
                  </h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", border: "1px solid #1B3055", padding: "7px 14px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B9FEE", whiteSpace: "nowrap" }}>
                    <span className="ia-stock-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#6B9FEE", flexShrink: 0 }} />
                    {formatNumber(stockCount)} {t.home.stockAvailable}
                  </span>
                </div>
                <div className="ia-rail" style={{ marginTop: "1.8rem" }}>
                  <span className="ia-rail-beam" />
                </div>
                <p style={{ marginTop: "1.4rem", fontSize: "13px", letterSpacing: "0.01em", color: "#C4D8EE" }}>
                  {t.home.stockKicker}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: "1px", backgroundColor: "#1B3055", border: "1px solid #1B3055" }}>
                {derniersVehicules.map((v) => {
                  const images = JSON.parse(v.images) as string[];
                  const img = images[0] ?? null;
                  return (
                    <Link href={`/vehicules/${v.id}`} key={v.id} className="ia-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#070F1E", textDecoration: "none" }}>
                      <div style={{ position: "relative", aspectRatio: "3 / 2", overflow: "hidden" }}>
                        {img ? (
                          <img className="ia-card-img" src={img} alt={`${v.make} ${v.model}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", backgroundColor: "#0D1A2D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#1B3055" }}>
                            {t.home.photoPlaceholder}
                          </div>
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #070F1E 0%, transparent 55%)" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 22px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                          <span style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, color: "#6B9FEE" }}>{v.make}</span>
                          <span style={{ fontSize: "10px", letterSpacing: "0.06em", color: "#7A9CC8", whiteSpace: "nowrap" }}>{v.year} · {formatNumber(v.mileage)} km</span>
                        </div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", marginBottom: "auto", lineHeight: 1.15 }}>{v.model}</h3>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1B3055", paddingTop: "16px", marginTop: "18px" }}>
                          <span style={{ fontSize: "1.15rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#F0F5FF" }}>{formatNumber(v.price)} €</span>
                          <span className="ia-card-detail" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "9px", letterSpacing: "0.26em", textTransform: "uppercase", color: "#6B9FEE" }}>
                            {t.home.vehicleDetail}
                            <span className="ia-card-arrow">→</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem", marginTop: "6vh" }}>
                <Link href="/vehicules-2" className="ia-stock-cta ia-stock-link" style={{ display: "inline-flex", alignItems: "center", gap: "14px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "17px 40px" }}>
                  {t.home.stockCta}
                  <span className="ia-stock-arrow">→</span>
                </Link>
                <div className="ia-rail" style={{ width: "min(320px, 70%)" }}>
                  <span className="ia-rail-beam" />
                </div>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", textAlign: "center" }}>
                  {formatNumber(stockCount)} {t.home.stockInStock}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 8. CTA FINAL */}
        <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16", minHeight: "52vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "12vh 6vw" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.45em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "2.4rem" }}>
            {t.home.ctaLabel}
          </p>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(2.4rem, 6vw, 5.5rem)", letterSpacing: "-0.035em", lineHeight: 0.9, color: "#F0F5FF", maxWidth: "820px", marginBottom: "4rem" }}>
            {t.home.ctaTitle[0]}
            <br /><span style={{ color: "#6B9FEE" }}>{t.home.ctaTitle[1]}</span>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            <Link href="/vehicules-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#070F1E", backgroundColor: "#F0F5FF", padding: "16px 40px" }}>
              {t.home.ctaBrowse}
            </Link>
            <Link href="/contact-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#F0F5FF", border: "1px solid rgba(240,245,255,0.2)", padding: "16px 40px" }}>
              {t.home.ctaContact}
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
