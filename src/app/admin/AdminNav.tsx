"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "./ui";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/vehicules", label: "Stock", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href) && pathname !== "/admin/vehicules/nouveau";
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative px-2 sm:px-3 py-2 text-[11px] sm:text-xs tracking-[0.14em] uppercase transition-colors duration-200 whitespace-nowrap"
            style={{ color: active ? T.text : "rgba(255,255,255,0.5)", fontWeight: active ? 600 : 400 }}
          >
            {link.label}
            <span
              className="absolute left-2 right-2 sm:left-3 sm:right-3"
              style={{
                bottom: 2,
                height: "2px",
                background: "linear-gradient(to right, transparent, #8BB8F5, transparent)",
                transform: active ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 0.3s ease",
              }}
            />
          </Link>
        );
      })}
    </nav>
  );
}
