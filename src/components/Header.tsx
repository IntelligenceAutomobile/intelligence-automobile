"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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

  return (
    <div className={`flex ${isCol ? "flex-col items-center" : "flex-row items-center"}`} style={{ gap: isCol ? "12px" : "0px" }}>
      <div style={{ marginTop: isCol ? undefined : "22px", position: isCol ? undefined : "relative", left: isCol ? undefined : "23px" }}>
        <LogoMark height={markHeight} />
      </div>
      <div className="flex flex-col items-start leading-none" style={{ marginLeft: isCol ? undefined : "-20px" }}>
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
    { href: "/",             label: t.nav.home },
    { href: "/vehicules-2",  label: t.nav.vehicles },
    { href: "/recherche-2",  label: t.nav.search },
    { href: "/aide-vente-2", label: t.nav.resale },
    { href: "/convoyage-2",  label: t.nav.transport },
    { href: "/methode-2",    label: t.nav.method },
    { href: "/contact-2",    label: t.nav.contact },
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

      {/* ── Rangée 1 : Logo centré + CTA + LanguageSwitcher ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="relative flex items-center justify-between" style={{ paddingTop: "18px", paddingBottom: "18px" }}>

          {/* Logo — centré (mobile : vrai centre ; desktop : compensation optique -30px) */}
          <Link
            href="/"
            className="absolute left-1/2 flex-shrink-0 [transform:translateX(-50%)] lg:[transform:translateX(calc(-50%_-_30px))]"
          >
            <LogoFull markHeight={110} layout="row" textScale={0.82} />
          </Link>

          {/* Spacer gauche */}
          <div className="hidden lg:block" style={{ visibility: "hidden", pointerEvents: "none" }}>
            <span className="text-[10px] tracking-[0.2em] px-5 py-2.5">{t.nav.contactCta}</span>
          </div>

          {/* Droite : CTA + LanguageSwitcher desktop */}
          <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
            <LanguageSwitcher />
            <Link
              href="/contact-2"
              className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] uppercase px-5 py-2.5 transition-all duration-250"
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
              {t.nav.contactCta}
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="lg:hidden ml-auto flex flex-col justify-center gap-[5px] p-2 -mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? t.nav.menuClose : t.nav.menuOpen}
          >
            <span className="block w-5 h-px" style={{ backgroundColor: "#F0F5FF", transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none", transition: "transform 0.25s ease" }} />
            <span className="block h-px"     style={{ backgroundColor: "#F0F5FF", width: menuOpen ? "20px" : "14px", opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s ease, width 0.25s ease" }} />
            <span className="block w-5 h-px" style={{ backgroundColor: "#F0F5FF", transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none", transition: "transform 0.25s ease" }} />
          </button>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", transition: "opacity 0.4s ease" }} />

      {/* ── Navigation V2 ── */}
      <div
        className="hidden lg:block"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-evenly" style={{ height: "60px" }}>
            {NAV_LINKS_V2.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
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
          maxHeight: menuOpen ? "480px" : "0",
          transition: "max-height 0.35s ease",
          backgroundColor: "#040B16",
        }}
      >
        <nav className="flex flex-col px-6 pt-8 pb-10">
          {NAV_LINKS_V2.map((link, i) => {
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
          {/* Language switcher mobile */}
          <div
            className="flex items-center gap-4 pt-6 mt-2"
            style={{ borderTop: "1px solid rgba(27,48,85,0.7)" }}
          >
            <LanguageSwitcher />
          </div>
          <div className="pt-4">
            <Link
              href="/contact-2"
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
