"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/vehicules", label: "Nos véhicules" },
  { href: "/services", label: "Services" },
  { href: "/methode", label: "Notre méthode" },
  { href: "/contact", label: "Contact" },
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

  return (
    <div className={`flex ${isCol ? "flex-col items-center" : "flex-row items-center"} gap-3`}>
      <LogoMark height={markHeight} />
      <div className={`flex flex-col ${isCol ? "items-center" : ""} leading-none`}>
        <span
          className="font-light uppercase"
          style={{ color: "#F0F5FF", fontSize: `${intelSize}px`, letterSpacing: "0.28em" }}
        >
          Intelligence
        </span>
        <span
          className="font-light uppercase mt-1"
          style={{ color: "#6B9FEE", fontSize: `${autoSize}px`, letterSpacing: "0.22em" }}
        >
          Automobile
        </span>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
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
        backgroundColor: scrolled ? "rgba(4, 11, 22, 0.97)" : "rgba(7, 15, 30, 0.75)",
        borderBottom: `1px solid ${scrolled ? "#1B3055" : "rgba(27,48,85,0.4)"}`,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        boxShadow: scrolled ? "0 4px 60px rgba(0,0,0,0.6)" : "none",
        transition: "background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Accent line top */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(to right, transparent 0%, #6B9FEE 30%, #6B9FEE 70%, transparent 100%)",
          opacity: 0.35,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between" style={{ height: "88px" }}>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0" style={{ marginLeft: "-64px" }}>
            <LogoFull markHeight={96} layout="row" textScale={0.38} />
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-[11px] font-medium tracking-[0.22em] uppercase pb-0.5 transition-colors duration-200"
                  style={{ color: isActive ? "#F0F5FF" : "#8AABD4" }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#F0F5FF"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#8AABD4"; }}
                >
                  {link.label}
                  <span
                    className="absolute -bottom-px left-0 right-0 h-px"
                    style={{
                      backgroundColor: "#6B9FEE",
                      transformOrigin: "left",
                      transform: isActive ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <div className="w-px h-5" style={{ backgroundColor: "#1B3055" }} />
            <Link
              href="/contact"
              className="group flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-200"
              style={{ color: "#6B9FEE" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F5FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B9FEE")}
            >
              Nous contacter
              <span
                className="inline-block transition-transform duration-300"
                style={{ transform: "translateX(0)" }}
                onMouseEnter={(e) => ((e.currentTarget.parentElement as HTMLElement | null)?.style && ((e.currentTarget as HTMLElement).style.transform = "translateX(3px)"))}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateX(0)")}
              >
                →
              </span>
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="md:hidden flex flex-col justify-center gap-[5px] p-2 -mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span
              className="block w-5 h-px"
              style={{
                backgroundColor: "#F0F5FF",
                transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none",
                transition: "transform 0.25s ease",
              }}
            />
            <span
              className="block h-px"
              style={{
                backgroundColor: "#F0F5FF",
                width: menuOpen ? "20px" : "14px",
                opacity: menuOpen ? 0 : 1,
                transition: "opacity 0.2s ease, width 0.25s ease",
              }}
            />
            <span
              className="block w-5 h-px"
              style={{
                backgroundColor: "#F0F5FF",
                transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none",
                transition: "transform 0.25s ease",
              }}
            />
          </button>
        </div>
      </div>

      {/* Menu mobile — smooth reveal */}
      <div
        className="md:hidden overflow-hidden"
        style={{
          maxHeight: menuOpen ? "360px" : "0",
          transition: "max-height 0.35s ease",
          backgroundColor: "#040B16",
          borderTop: menuOpen ? "1px solid #1B3055" : "none",
        }}
      >
        <nav className="flex flex-col px-6 pt-8 pb-10">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between text-sm font-medium tracking-[0.2em] uppercase py-4"
                style={{
                  color: isActive ? "#F0F5FF" : "#8AABD4",
                  borderTop: i === 0 ? "none" : "1px solid #1B3055",
                }}
              >
                {link.label}
                {isActive && (
                  <span className="text-xs" style={{ color: "#6B9FEE" }}>→</span>
                )}
              </Link>
            );
          })}
          <div className="pt-6 mt-2" style={{ borderTop: "1px solid #1B3055" }}>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between text-[11px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: "#6B9FEE" }}
            >
              Nous contacter
              <span>→</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
