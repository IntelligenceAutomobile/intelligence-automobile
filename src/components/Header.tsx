"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocale, LanguageSwitcher } from "@/i18n/context";

const MARK_SRC = "/Logo/v9%20Logo%20Sans%20texte.png";

export function LogoMark({ height = 48 }: { height?: number }) {
  return (
    <img
      src={MARK_SRC}
      alt=""
      style={{ height: `${height}px`, width: "auto", display: "block" }}
    />
  );
}

export function LogoText({
  markHeight = 48,
  layout = "row",
  textScale = 1,
  offsetLeft = true,
  widthScale = 1,
}: {
  markHeight?: number;
  layout?: "row" | "col";
  textScale?: number;
  offsetLeft?: boolean;
  widthScale?: number;
}) {
  const isCol = layout === "col";
  const intelSize = Math.round(markHeight * (isCol ? 0.14 : 0.22) * textScale);
  const autoSize  = Math.round(markHeight * (isCol ? 0.10 : 0.15) * textScale);
  // décalage optique vers la marque (vaut -20px à markHeight=110) — désactivable quand le texte est séparé
  const textLeft = isCol || !offsetLeft ? undefined : markHeight * (-20 / 110);

  return (
    <div
      className="flex flex-col items-start leading-none"
      style={{
        marginLeft: textLeft,
        transform: widthScale !== 1 ? `scaleX(${widthScale})` : undefined,
        transformOrigin: "right",
      }}
    >
      <span
        className="font-light uppercase"
        style={{ color: "#F0F5FF", fontSize: `${intelSize}px`, letterSpacing: "0.45em" }}
      >
        Intelligence
      </span>
      <div className={`flex items-center mt-[0.4em] ${isCol ? "justify-center" : ""}`}>
        <span className="font-normal uppercase" style={{ color: "#6B9FEE", fontSize: `${autoSize}px`, letterSpacing: "0.38em" }}>
          Automobile
        </span>
      </div>
    </div>
  );
}

// Zone visible (non transparente) du fichier v9 Logo Sans texte.png, mesurée sur
// le canal alpha : image de 1536x1024, glyphe de x=630 a 1102, y=239 à y=622.
// Sert a convertir une taille de texte cible en la taille d'<img> (avec ses
// marges transparentes) qui donnera un glyphe visible de cette même taille,
// cale a gauche du texte (bord droit du glyphe = bord gauche du texte).
const MARK_W = 1536, MARK_H = 1024;
const MARK_TOP_PAD = 239 / MARK_H;
const MARK_VISIBLE_FRAC_Y = (622 - 239) / MARK_H;
const MARK_VISIBLE_LEFT_X = 630 / MARK_W;
const MARK_VISIBLE_RIGHT_X = 1102 / MARK_W;
// Hauteur de texte "raisonnable" utilisée le temps du tout premier rendu,
// avant que la vraie mesure (ResizeObserver) ne soit disponible — évite que
// le mark soit invisible un instant (et, sur certains chargements, le reste).
const FALLBACK_TEXT_HEIGHT = 44;

function computeMarkFit(textHeight: number) {
  const imgHeight = textHeight / MARK_VISIBLE_FRAC_Y;
  const imgWidth = imgHeight * (MARK_W / MARK_H);
  return {
    height: imgHeight,
    width: imgWidth,
    top: -imgHeight * MARK_TOP_PAD,
    // le mark est decale a gauche pour compenser SA PROPRE marge
    // transparente gauche (glyphe visible flush avec le debut du bloc) ;
    // le texte recoit un marginLeft base sur la largeur du glyphe visible
    // (pas la largeur totale de l'image) pour rester colle a sa droite.
    left: -imgWidth * MARK_VISIBLE_LEFT_X,
    textMarginLeft: imgWidth * (MARK_VISIBLE_RIGHT_X - MARK_VISIBLE_LEFT_X),
  };
}

export function LogoFull({
  markHeight = 48,
  layout = "row",
  textScale = 1,
  matchTextHeight = false,
}: {
  markHeight?: number;
  layout?: "row" | "col";
  textScale?: number;
  // Cale le haut/bas du glyphe visible du mark sur le haut de "Intelligence"
  // et le bas de "Automobile", au lieu de dimensionner le mark via markHeight.
  // Le texte utilise alors une taille responsive (clamp/vw) au lieu de
  // markHeight/textScale : pense pour l'unique logo du header (toutes tailles
  // d'ecran), pas pour les autres usages (admin) qui ne l'activent pas.
  matchTextHeight?: boolean;
}) {
  const isCol = layout === "col";
  // décalages optiques proportionnels à markHeight (valent 22 / 23 px à markHeight=110)
  const markTop  = isCol ? undefined : markHeight * (22 / 110);
  const markLeft = isCol ? undefined : markHeight * (23 / 110);

  const textRef = useRef<HTMLDivElement>(null);
  const [fitted, setFitted] = useState(() => computeMarkFit(FALLBACK_TEXT_HEIGHT));

  useLayoutEffect(() => {
    if (!matchTextHeight || isCol || !textRef.current) return;
    const el = textRef.current;
    const measure = () => {
      const textHeight = el.getBoundingClientRect().height;
      if (!textHeight) return;
      setFitted(computeMarkFit(textHeight));
    };
    measure();
    // ResizeObserver plutot qu'un seul recalcul post-chargement des polices :
    // se re-declenche a chaque changement de taille reel du bloc de texte
    // (police qui finit de charger, re-render, largeur d'ecran qui change le
    // clamp() du texte, etc.), donc toujours a jour.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [matchTextHeight, isCol]);

  if (matchTextHeight && !isCol) {
    // Mark en position absolue dans un conteneur dimensionne par le SEUL texte :
    // le glyphe (avec ses marges transparentes, plus grand que le texte) peut
    // deborder sans jamais agrandir la boite du conteneur. Indispensable ici
    // car ce composant est aussi utilise dans un lien position:absolute (logo
    // du header) dont le centrage automatique se base sur cette boite — une
    // marge negative sur un enfant en flux normal aurait fausse ce calcul.
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div ref={textRef} style={{ marginLeft: fitted.textMarginLeft }}>
          <div className="flex flex-col items-start leading-none">
            <span
              className="font-light uppercase"
              style={{ color: "#F0F5FF", fontSize: "clamp(14px, calc(7px + 1.85vw), 20px)", letterSpacing: "0.45em" }}
            >
              Intelligence
            </span>
            <div className="flex items-center mt-[0.4em]">
              <span
                className="font-normal uppercase"
                style={{ color: "#6B9FEE", fontSize: "clamp(10px, calc(5.4px + 1.23vw), 14px)", letterSpacing: "0.38em" }}
              >
                Automobile
              </span>
            </div>
          </div>
        </div>
        <img
          src={MARK_SRC}
          alt=""
          style={{
            position: "absolute",
            top: fitted.top,
            left: fitted.left,
            height: fitted.height,
            width: fitted.width,
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex ${isCol ? "flex-col items-center" : "flex-row items-center"}`} style={{ gap: isCol ? "12px" : "0px" }}>
      <div style={{ marginTop: markTop, position: isCol ? undefined : "relative", left: markLeft, flexShrink: 0 }}>
        <LogoMark height={markHeight} />
      </div>
      <LogoText markHeight={markHeight} layout={layout} textScale={textScale} />
    </div>
  );
}

export default function Header() {
  const pathname  = usePathname();
  const { t }     = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);

  const NAV_LINKS_V2 = [
    { href: "/",           label: t.nav.home },
    { href: "/vehicules",  label: t.nav.vehicles },
    { href: "/recherche-personnalisee",  label: t.nav.search },
    { href: "/revente-sur-mesure", label: t.nav.resale },
    { href: "/transport-livraison",  label: t.nav.transport },
    { href: "/methode",    label: t.nav.method },
    { href: "/services",   label: t.nav.services },
    { href: "/contact",    label: t.nav.contact },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me").then(r => r.json()).then(d => setIsAdmin(d.isAdmin));
  }, []);

  const isLinkActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: scrolled ? "rgba(4, 11, 22, 0.97)" : "rgba(7, 15, 30, 0.82)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        boxShadow: scrolled ? "0 4px 60px rgba(0,0,0,0.6)" : "none",
        transition: "background-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Filet accent top */}
      <div style={{ height: "1px", background: "linear-gradient(to right, transparent 0%, #6B9FEE 30%, #6B9FEE 70%, transparent 100%)", opacity: 0.45 }} />

      {/* ── Rangée 1 : Logo centré (toutes tailles) + LanguageSwitcher + burger ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="relative flex items-center justify-end" style={{ paddingTop: "26px", paddingBottom: "22px", paddingRight: "6px" }}>

          {/* Logo — centré, décalage optique proportionnel (vw) pour rester cohérent de 375px à desktop */}
          <Link
            href="/"
            className="absolute left-1/2 w-max flex-shrink-0"
            style={{ transform: "translateX(calc(-50% - 2.08vw))" }}
          >
            <LogoFull markHeight={110} layout="row" textScale={0.82} matchTextHeight />
          </Link>

          {/* Desktop : uniquement le sélecteur de langue (nav en dessous) */}
          <div className="hidden lg:flex flex-shrink-0">
            <LanguageSwitcher />
          </div>

          {/* Mobile/tablette : burger + sélecteur empilés (peu de largeur prise,
              laisse la place au logo centré), avec un peu de marge sur le bord */}
          <div className="lg:hidden flex flex-col items-end flex-shrink-0" style={{ gap: "8px", marginRight: "2px" }}>
            <button
              className="flex flex-col justify-center gap-[5px] p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? t.nav.menuClose : t.nav.menuOpen}
            >
              <span className="block w-5 h-px" style={{ backgroundColor: "#F0F5FF", transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none", transition: "transform 0.25s ease" }} />
              <span className="block h-px"     style={{ backgroundColor: "#F0F5FF", width: menuOpen ? "20px" : "14px", opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s ease, width 0.25s ease" }} />
              <span className="block w-5 h-px" style={{ backgroundColor: "#F0F5FF", transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none", transition: "transform 0.25s ease" }} />
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", transition: "opacity 0.4s ease" }} />

      {/* ── Navigation desktop : 1 ligne, à partir de lg ── */}
      <div
        className="hidden lg:block"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-evenly" style={{ height: "60px" }}>
            {NAV_LINKS_V2.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center h-full whitespace-nowrap transition-all duration-200"
                  style={{
                    color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.52)",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.52)";
                  }}
                >
                  {link.label}
                  <span
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "2px",
                      background: "linear-gradient(to right, transparent, #8BB8F5, transparent)",
                      borderRadius: "2px",
                      transformOrigin: "center",
                      transform: isActive ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bordure basse */}
      <div style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)" }} />

      {/* ── Menu mobile ── */}
      <div
        className="lg:hidden overflow-hidden"
        style={{
          maxHeight: menuOpen ? "680px" : "0",
          transition: "max-height 0.35s ease",
          backgroundColor: "#040B16",
        }}
      >
        <nav className="flex flex-col px-6 pt-8 pb-10">
          {NAV_LINKS_V2.map((link, i) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between py-4"
                style={{
                  color: isActive ? "#F0F5FF" : "#A8C4F0",
                  borderTop: i === 0 ? "none" : "1px solid rgba(27,48,85,0.6)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                <span>{link.label}</span>
                <span
                  style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    backgroundColor: "#6B9FEE", flexShrink: 0,
                    opacity: isActive ? 1 : 0, transition: "opacity 0.2s",
                  }}
                />
              </Link>
            );
          })}
          <div className="pt-4">
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center text-[11px] font-bold tracking-[0.22em] uppercase py-4 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
            >
              {t.nav.contactCta}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
