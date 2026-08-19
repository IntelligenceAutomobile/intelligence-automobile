"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, FileText, Wallet, MessagesSquare, FolderKanban, type LucideIcon } from "lucide-react";
import { T } from "./ui";

const LINKS: { href: string; label: string; exact: boolean; icon: LucideIcon }[] = [
  { href: "/admin", label: "Tableau de bord", exact: true, icon: LayoutDashboard },
  { href: "/admin/vehicules", label: "Stock", exact: false, icon: Car },
  { href: "/admin/devis", label: "Devis", exact: false, icon: FileText },
  { href: "/admin/comptes", label: "Comptes", exact: false, icon: Wallet },
  { href: "/admin/atelier", label: "Atelier", exact: false, icon: MessagesSquare },
  { href: "/admin/projets", label: "Projets", exact: false, icon: FolderKanban },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href) && pathname !== "/admin/vehicules/nouveau";
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 text-[11px] sm:text-xs tracking-[0.14em] uppercase transition-colors duration-200 whitespace-nowrap"
            style={{ color: active ? T.text : "rgba(255,255,255,0.5)", fontWeight: active ? 600 : 400 }}
          >
            <Icon size={14} className="hidden md:inline" style={{ color: active ? T.accent : "rgba(255,255,255,0.4)" }} />
            {link.label}
            <span
              className="absolute left-2 right-2 sm:left-3 sm:right-3"
              style={{
                bottom: 2,
                height: "2px",
                background: "linear-gradient(to right, transparent, var(--adm-accent-light), transparent)",
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
