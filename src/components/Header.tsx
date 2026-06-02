"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/vehicules",  label: "Nos Véhicules" },
  { href: "/recherche",  label: "Recherche Spécifique" },
  { href: "/aide-vente", label: "Aide à la Vente" },
  { href: "/convoyage",  label: "Convoyage" },
  { href: "/methode",    label: "Notre Méthode" },
  { href: "/contact",    label: "Contact" },
];

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

export function LogoFull({
  markHeight = 48,
  layout = "row",
  textScale = 1,
}: {
  markHeight?: number;
  layout?: "row" | "col";
  textScale?: number;
}) {
  const isCol = layout === "col";
  const intelSize = Math.round(markHeight * (isCol ? 0.14 : 0.22) * textScale);
  const autoSize  = Math.round(markHeight * (isCol ? 0.10 : 0.15) * textScale);
  const lineW = Math.round(intelSize * 1.2);

  return (
    <div className={`flex ${isCol ? "flex-col items-center" : "flex-row items-center"}`} style={{ gap: isCol ? "12px" : "0px" }}>
      <div style={{ marginTop: isCol ? undefined : "6px" }}>
        <LogoMark height={markHeight} />
      </div>
      <div className="flex flex-col items-center leading-none" style={{ marginLeft: isCol ? undefined : "-20px" }}>
        <span
          className="font-light uppercase"
          style={{ color: "#F0F5FF", fontSize: `${intelSize}px`, letterSpacing: "0.45em" }}
        >
          Intelligence
        </span>
        <div className={`flex items-center gap-2 mt-[0.4em] ${isCol ? "justify-center" : ""}`}>
          <div className="h-px flex-shrink-0" style={{ width: `${lineW}px`, background: "linear-gradient(to right, transparent, #6B9FEE)" }} />
          <span className="font-normal uppercase" style={{ color: "#6B9FEE", fontSize: `${autoSize}px`, letterSpacing: "0.38em" }}>
            Automobile
          </span>
          <div className="h-px flex-shrink-0" style={{ width: `${lineW}px`, background: "linear-gradient(to left, transparent, #6B9FEE)" }} />
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname  = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

      {/* ── Rangée 1 : Logo centré + CTA ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="relative flex items-center justify-between" style={{ paddingTop: "18px", paddingBottom: "18px" }}>

          {/* Logo — centré absolument */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex-shrink-0">
            <LogoFull markHeight={110} layout="row" textScale={0.82} />
          </Link>

          {/* Spacer gauche */}
          <div className="hidden md:block" style={{ visibility: "hidden", pointerEvents: "none" }}>
            <span className="text-[10px] tracking-[0.2em] px-5 py-2.5">Nous contacter</span>
          </div>

          {/* CTA desktop — outlined discret */}
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] uppercase px-5 py-2.5 flex-shrink-0 transition-all duration-250"
            style={{
              color: "#A8C4F0",
              border: "1px solid rgba(107,159,238,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#F0F5FF";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(107,159,238,0.75)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#A8C4F0";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(107,159,238,0.35)";
            }}
          >
            Nous contacter
          </Link>

          {/* Burger mobile */}
          <button
            className="md:hidden flex flex-col justify-center gap-[5px] p-2 -mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span className="block w-5 h-px" style={{ backgroundColor: "#F0F5FF", transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none", transition: "transform 0.25s ease" }} />
            <span className="block h-px"     style={{ backgroundColor: "#F0F5FF", width: menuOpen ? "20px" : "14px", opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s ease, width 0.25s ease" }} />
            <span className="block w-5 h-px" style={{ backgroundColor: "#F0F5FF", transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none", transition: "transform 0.25s ease" }} />
          </button>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", transition: "opacity 0.4s ease" }} />

      {/* ── Rangée 2 : Navigation ── */}
      <div
        className="hidden md:block"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <nav className="flex items-center justify-evenly" style={{ height: "50px" }}>
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center h-full whitespace-nowrap transition-all duration-200"
                  style={{
                    color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.52)",
                    fontSize: "11px",
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.52)";
                    }
                  }}
                >
                  {link.label}
                  {/* Point actif en haut */}
                  <span
                    className="absolute top-2.5 left-1/2 -translate-x-1/2"
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      backgroundColor: "#6B9FEE",
                      opacity: isActive ? 1 : 0,
                      transition: "opacity 0.25s ease",
                    }}
                  />
                  {/* Underline bas */}
                  <span
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "1.5px",
                      background: "linear-gradient(to right, transparent, #6B9FEE, transparent)",
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
        className="md:hidden overflow-hidden"
        style={{
          maxHeight: menuOpen ? "420px" : "0",
          transition: "max-height 0.35s ease",
          backgroundColor: "#040B16",
        }}
      >
        <nav className="flex flex-col px-6 pt-8 pb-10">
          {NAV_LINKS.map((link, i) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
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
          <div className="pt-6 mt-2" style={{ borderTop: "1px solid rgba(27,48,85,0.7)" }}>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center text-[11px] font-bold tracking-[0.22em] uppercase py-4 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
            >
              Nous contacter
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
