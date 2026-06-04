import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export default async function AccueilV3Page() {
  const derniersVehicules = await prisma.vehicle.findMany({
    where: { status: "disponible" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

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
      ` }} />

      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", overflowX: "hidden" }}>

        {/* ────────────────────────────────────────────
            1. HERO — plein écran, texte ancré en bas
        ──────────────────────────────────────────── */}
        <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>

          <img
            src="/Photo du Site/V2 Porshe Accueil.png"
            alt=""
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              opacity: 0.80,
            }}
          />

          {/* Voile très léger — la voiture domine */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(7,15,30,0.78) 0%, rgba(7,15,30,0.18) 55%, transparent 100%)" }} />
          {/* Fondu bas */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "38%", background: "linear-gradient(to top, #070F1E 0%, transparent 100%)" }} />
          {/* Halo studio */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 70% at 75% 44%, rgba(107,159,238,0.06) 0%, transparent 100%)" }} />

          {/* Texte ancré bas-gauche */}
          <div style={{ position: "absolute", bottom: "8vh", left: "6vw", right: "6vw" }}>
            <h1 style={{
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: "-0.04em",
              fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
              color: "#F0F5FF",
              marginBottom: "3rem",
              maxWidth: "700px",
            }}>
              L&apos;importation
              <br />automobile,
              <br /><span style={{ color: "#6B9FEE" }}>autrement.</span>
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
              <Link
                href="/vehicules"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "12px",
                  fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em",
                  textTransform: "uppercase", color: "#070F1E",
                  backgroundColor: "#F0F5FF",
                  padding: "14px 32px",
                  transition: "opacity 0.2s",
                }}
              >
                Voir les véhicules
              </Link>
              <Link
                href="/contact"
                style={{
                  fontSize: "11px", fontWeight: 500, letterSpacing: "0.28em",
                  textTransform: "uppercase", color: "rgba(240,245,255,0.55)",
                  borderBottom: "1px solid rgba(240,245,255,0.2)",
                  paddingBottom: "2px",
                }}
              >
                Nous contacter →
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position: "absolute", right: "3.5vw", bottom: "10vh", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "#1B3055", writingMode: "vertical-rl" }}>Défiler</span>
            <div style={{ width: "1px", height: "56px", background: "linear-gradient(to bottom, #1B3055, transparent)" }} />
          </div>
        </section>

        {/* ────────────────────────────────────────────
            2. MARQUEE — ticker de marques
        ──────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid #1B3055", borderBottom: "1px solid #1B3055", backgroundColor: "#040B16", overflow: "hidden", height: "54px", display: "flex", alignItems: "center" }}>
          <div className="ia-marquee-track">
            {[1, 2].map((n) => (
              <span key={n} style={{ fontSize: "11px", letterSpacing: "0.45em", textTransform: "uppercase", color: "#7A9CC8", whiteSpace: "nowrap", paddingRight: "4rem" }}>
                PORSCHE &nbsp;·&nbsp; BMW M &nbsp;·&nbsp; MERCEDES AMG &nbsp;·&nbsp; AUDI RS &nbsp;·&nbsp; FERRARI &nbsp;·&nbsp; ALPINE &nbsp;·&nbsp; MASERATI &nbsp;·&nbsp; ALFA ROMEO &nbsp;·&nbsp; LAMBORGHINI &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* ────────────────────────────────────────────
            3. CHIFFRES — liste horizontale éditoriale
        ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: "#040B16" }}>
          {[
            { val: "+2 000", label: "Annonces analysées par mois sur les marchés européens" },
            { val: "20–30%", label: "D'économie constatée vs. le marché français" },
            { val: "100%",   label: "Transparence — tous les coûts détaillés avant tout engagement" },
          ].map((s) => (
            <div key={s.val}>
              <div style={{ height: "1px", background: "linear-gradient(to right, transparent 0%, #1B3055 15%, #1B3055 85%, transparent 100%)" }} />
              <div style={{
                maxWidth: "1100px",
                margin: "0 auto",
                padding: "4.5vh 6vw",
                display: "flex",
                alignItems: "center",
                gap: "5vw",
              }}>
                {/* Nombre avec filet bleu à gauche */}
                <div style={{
                  fontWeight: 900,
                  fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
                  letterSpacing: "-0.04em",
                  color: "#F0F5FF",
                  lineHeight: 1,
                  flexShrink: 0,
                  minWidth: "200px",
                  borderLeft: "2px solid #6B9FEE",
                  paddingLeft: "1.6rem",
                }}>
                  {s.val}
                </div>
                {/* Label */}
                <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#8AABD4", letterSpacing: "0.03em" }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent 0%, #1B3055 15%, #1B3055 85%, transparent 100%)" }} />
        </section>


        {/* ────────────────────────────────────────────
            5a. SERVICE 01 — Recherche personnalisée
        ──────────────────────────────────────────── */}
        <section
          className="ia-service-block"
          style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16" }}
        >
          <Link href="/recherche" className="flex flex-col lg:flex-row" style={{ minHeight: "70vh", textDecoration: "none", cursor: "pointer" }}>
            <div className="w-full lg:w-[58%]" style={{ position: "relative", minHeight: "380px", overflow: "hidden" }}>
              <img
                className="ia-service-img"
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85"
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 55%, #040B16 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040B16 0%, transparent 25%)" }} />
            </div>
            <div
              className="w-full lg:w-[42%]"
              style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6vh 5vw", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: "-1.5rem", left: 0, fontSize: "clamp(5rem, 12vw, 10rem)", fontWeight: 900, color: "rgba(107,159,238,0.07)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>01</div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", marginBottom: "1.6rem", lineHeight: 1.05 }}>
                  Recherche<br />personnalisée
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.85, color: "#C4D8EE", maxWidth: "340px", marginBottom: "2.4rem", borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.9rem" }}>
                  Vous décrivez. On trouve. Au meilleur prix européen.
                </p>
                <span style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  En savoir plus <span style={{ fontSize: "14px" }}>→</span>
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ────────────────────────────────────────────
            5b. SERVICE 02 — Revente sur mesure
        ──────────────────────────────────────────── */}
        <section
          className="ia-service-block"
          style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16" }}
        >
          <Link href="/aide-vente" className="flex flex-col-reverse lg:flex-row" style={{ minHeight: "70vh", textDecoration: "none", cursor: "pointer" }}>
            <div
              className="w-full lg:w-[42%]"
              style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6vh 5vw", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: "-1.5rem", left: 0, fontSize: "clamp(5rem, 12vw, 10rem)", fontWeight: 900, color: "rgba(107,159,238,0.07)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>02</div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", marginBottom: "1.6rem", lineHeight: 1.05 }}>
                  Revente<br />sur mesure
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.85, color: "#C4D8EE", maxWidth: "340px", marginBottom: "2.4rem", borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.9rem" }}>
                  Photo pro, acheteurs qualifiés. Vendez vite, vendez bien.
                </p>
                <span style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  En savoir plus <span style={{ fontSize: "14px" }}>→</span>
                </span>
              </div>
            </div>
            <div className="w-full lg:w-[58%]" style={{ position: "relative", minHeight: "380px", overflow: "hidden" }}>
              <img
                className="ia-service-img"
                src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85"
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 55%, #040B16 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040B16 0%, transparent 25%)" }} />
            </div>
          </Link>
        </section>

        {/* ────────────────────────────────────────────
            5c. SERVICE 03 — Transport & Livraison
        ──────────────────────────────────────────── */}
        <section
          className="ia-service-block"
          style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16" }}
        >
          <Link href="/convoyage" className="flex flex-col lg:flex-row" style={{ minHeight: "70vh", textDecoration: "none", cursor: "pointer" }}>
            <div className="w-full lg:w-[58%]" style={{ position: "relative", minHeight: "380px", overflow: "hidden" }}>
              <img
                className="ia-service-img"
                src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85"
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 55%, #040B16 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #040B16 0%, transparent 25%)" }} />
            </div>
            <div
              className="w-full lg:w-[42%]"
              style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6vh 5vw", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: "-1.5rem", left: 0, fontSize: "clamp(5rem, 12vw, 10rem)", fontWeight: 900, color: "rgba(107,159,238,0.07)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>03</div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#F0F5FF", marginBottom: "1.6rem", lineHeight: 1.05 }}>
                  Transport<br />&amp; Livraison
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.85, color: "#C4D8EE", maxWidth: "340px", marginBottom: "2.4rem", borderTop: "1px solid rgba(107,159,238,0.35)", paddingTop: "0.9rem" }}>
                  D&apos;Europe à votre porte. Clé en main.
                </p>
                <span style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  En savoir plus <span style={{ fontSize: "14px" }}>→</span>
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ────────────────────────────────────────────
            6. PROCESSUS — 3 étapes en ligne, Apple-style
        ──────────────────────────────────────────── */}
        <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E", padding: "12vh 0" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 5vw" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.42em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "6vh", textAlign: "center" }}>
              Un processus simple
            </p>

            {/* Ligne de progression */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "18px", left: "16.6%", right: "16.6%", height: "1px", backgroundColor: "#1B3055" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
                {[
                  { n: "01", title: "Vous choisissez", desc: "Parmi notre stock ou via mandat sur-mesure." },
                  { n: "02", title: "On gère tout", desc: "Achat, transport, homologation, immatriculation." },
                  { n: "03", title: "Vous conduisez", desc: "Livraison à domicile sous 2 à 3 semaines." },
                ].map((s) => (
                  <div key={s.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 3vw" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      border: "1px solid #1B3055",
                      backgroundColor: "#070F1E",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "#6B9FEE",
                      marginBottom: "2.4rem", flexShrink: 0, position: "relative", zIndex: 1,
                    }}>
                      {s.n}
                    </div>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#F0F5FF", marginBottom: "0.8rem" }}>
                      {s.title}
                    </h4>
                    <p style={{ fontSize: "12px", lineHeight: 1.75, color: "#4A6A9A", maxWidth: "220px" }}>
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "6vh" }}>
              <Link href="/methode" style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", borderBottom: "1px solid rgba(107,159,238,0.3)", paddingBottom: "2px" }}>
                Notre méthode complète →
              </Link>
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────
            7. DERNIERS VÉHICULES — cards éditoriales
        ──────────────────────────────────────────── */}
        {derniersVehicules.length > 0 && (
          <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#070F1E" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "10vh 5vw 4vh" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "6vh" }}>
                <div>
                  <p style={{ fontSize: "10px", letterSpacing: "0.42em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "1rem" }}>
                    Stock actuel
                  </p>
                  <h2 style={{ fontWeight: 900, fontSize: "clamp(2rem, 4.5vw, 3.8rem)", letterSpacing: "-0.025em", textTransform: "uppercase", lineHeight: 1 }}>
                    Derniers arrivages
                  </h2>
                </div>
                <Link href="/vehicules" style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE", display: "none" }} className="md:block">
                  Tout le stock →
                </Link>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1px", backgroundColor: "#1B3055" }}>
              {derniersVehicules.map((v) => {
                const images = JSON.parse(v.images) as string[];
                const img = images[0] ?? null;
                return (
                  <Link
                    href={`/vehicules/${v.id}`}
                    key={v.id}
                    className="ia-card"
                    style={{ display: "block", overflow: "hidden", backgroundColor: "#070F1E", textDecoration: "none" }}
                  >
                    {/* Photo 400px */}
                    <div style={{ position: "relative", height: "400px", overflow: "hidden" }}>
                      {img ? (
                        <img
                          className="ia-card-img"
                          src={img}
                          alt={`${v.make} ${v.model}`}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", backgroundColor: "#0D1A2D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#1B3055" }}>
                          Photo à venir
                        </div>
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #070F1E 0%, transparent 50%)" }} />
                    </div>

                    {/* Infos */}
                    <div style={{ padding: "28px 32px 36px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700, color: "#6B9FEE" }}>
                          {v.make}
                        </span>
                        <span style={{ fontSize: "10px", letterSpacing: "0.08em", color: "#4A6A9A" }}>
                          {v.year} · {v.mileage.toLocaleString("fr-FR")} km
                        </span>
                      </div>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#F0F5FF", marginBottom: "20px", lineHeight: 1.1 }}>
                        {v.model}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1B3055", paddingTop: "18px" }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#F0F5FF" }}>
                          {v.price.toLocaleString("fr-FR")} €
                        </span>
                        <span style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE" }}>
                          Détail →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div style={{ textAlign: "center", padding: "36px", display: "block" }} className="md:hidden">
              <Link href="/vehicules" style={{ fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6B9FEE" }}>
                Tout le stock →
              </Link>
            </div>
          </section>
        )}


        {/* ────────────────────────────────────────────
            8. CTA FINAL — épuré, centré, fort
        ──────────────────────────────────────────── */}
        <section style={{ borderTop: "1px solid #1B3055", backgroundColor: "#040B16", minHeight: "52vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "12vh 6vw" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.45em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "2.4rem" }}>
            Prêt à commencer ?
          </p>
          <h2 style={{
            fontWeight: 900,
            fontSize: "clamp(2.4rem, 6vw, 5.5rem)",
            letterSpacing: "-0.035em",
            lineHeight: 0.9,
            color: "#F0F5FF",
            maxWidth: "820px",
            marginBottom: "4rem",
          }}>
            Votre prochain véhicule
            <br /><span style={{ color: "#6B9FEE" }}>vous attend.</span>
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            <Link
              href="/vehicules"
              style={{
                fontSize: "11px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase",
                color: "#070F1E", backgroundColor: "#F0F5FF",
                padding: "16px 40px",
              }}
            >
              Voir le stock
            </Link>
            <Link
              href="/contact"
              style={{
                fontSize: "11px", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase",
                color: "#F0F5FF", border: "1px solid rgba(240,245,255,0.2)",
                padding: "16px 40px",
              }}
            >
              Nous contacter
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
