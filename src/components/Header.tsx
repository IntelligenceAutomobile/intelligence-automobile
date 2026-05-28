"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
}: {
  markHeight?: number;
  layout?: "row" | "col";
}) {
  const isCol = layout === "col";
  const intelSize = isCol ? Math.round(markHeight * 0.14) : Math.round(markHeight * 0.22);
  const autoSize  = isCol ? Math.round(markHeight * 0.10) : Math.round(markHeight * 0.15);

  return (
    <div
      className={`flex ${isCol ? "flex-col items-center" : "flex-row items-center"} gap-3`}
    >
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(7, 15, 30, 0.94)",
        borderColor: "#1B3055",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between" style={{ height: "80px" }}>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <LogoFull markHeight={52} layout="row" />
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium tracking-widest uppercase transition-colors duration-200"
                  style={{ color: isActive ? "#6B9FEE" : "#8AABD4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isActive ? "#6B9FEE" : "#8AABD4")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:block flex-shrink-0">
            <Link
              href="/contact"
              className="text-xs font-semibold tracking-widest uppercase px-6 py-2.5 rounded-full transition-all duration-200"
              style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4B7FD8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6B9FEE")}
            >
              Nous contacter
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              className="block w-6 h-0.5 transition-all duration-200"
              style={{
                backgroundColor: "#F0F5FF",
                transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "",
              }}
            />
            <span
              className="block w-6 h-0.5 transition-all duration-200"
              style={{ backgroundColor: "#F0F5FF", opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-6 h-0.5 transition-all duration-200"
              style={{
                backgroundColor: "#F0F5FF",
                transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "",
              }}
            />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: "#070F1E", borderColor: "#1B3055" }}
        >
          <nav className="flex flex-col px-6 py-6 gap-5">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium tracking-widest uppercase py-1"
                  style={{ color: isActive ? "#6B9FEE" : "#8AABD4" }}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="text-xs font-semibold tracking-widest uppercase px-6 py-3 text-center mt-2 rounded-full"
              style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
            >
              Nous contacter
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
