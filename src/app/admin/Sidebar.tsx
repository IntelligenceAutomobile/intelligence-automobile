"use client";

// Colonne de navigation du back-office (desktop). Les modules "Bientôt"
// annoncent la roadmap (CRM, planning, diffusion) sans être cliquables.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, FileText, Wallet, MessagesSquare, Users,
  CalendarClock, Radio, ExternalLink, type LucideIcon,
} from "lucide-react";
import { T } from "./ui";
import AdminLogout from "./AdminLogout";

type NavItem = { icon: LucideIcon; label: string; href?: string; exact?: boolean; soon?: boolean };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Pilotage", items: [{ icon: LayoutDashboard, label: "Tableau de bord", href: "/admin", exact: true }] },
  {
    section: "Activité",
    items: [
      { icon: Car, label: "Stock", href: "/admin/vehicules" },
      { icon: FileText, label: "Devis", href: "/admin/devis" },
      { icon: Users, label: "Clients & leads", href: "/admin/clients" },
      { icon: CalendarClock, label: "Planning atelier", href: "/admin/planning" },
      { icon: Radio, label: "Diffusion", href: "/admin/diffusion" },
    ],
  },
  {
    section: "Équipe",
    items: [
      { icon: MessagesSquare, label: "Atelier", href: "/admin/atelier" },
      { icon: Wallet, label: "Comptes", href: "/admin/comptes" },
    ],
  },
];

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="w-[232px] flex-shrink-0 flex-col hidden lg:flex sticky top-0 h-screen"
      style={{ backgroundColor: T.surfaceAlt, borderRight: `1px solid ${T.border}` }}
    >
      <Link href="/admin" className="block px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${T.border}` }}>
        <span className="block text-[13px] tracking-[0.3em] uppercase font-semibold" style={{ color: T.text }}>
          Intelligence
        </span>
        <span className="block text-[9px] tracking-[0.42em] uppercase mt-1" style={{ color: "#C7D3E8" }}>
          Automobile
        </span>
      </Link>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-2 mb-2 text-[9px] tracking-[0.28em] uppercase" style={{ color: T.muted }}>
              {group.section}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href
                  ? item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  : false;
                const inner = (
                  <>
                    {active && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-[2px]"
                        style={{ background: `linear-gradient(to bottom, transparent, ${T.accent}, transparent)` }}
                      />
                    )}
                    <item.icon size={15} style={{ color: active ? T.accent : T.muted, flexShrink: 0 }} />
                    <span className="truncate">{item.label}</span>
                    {item.soon && (
                      <span
                        className="ml-auto text-[8px] tracking-[0.14em] uppercase px-1.5 py-0.5 flex-shrink-0"
                        style={{ border: "1px solid rgba(199,211,232,0.28)", color: "#C7D3E8" }}
                      >
                        Bientôt
                      </span>
                    )}
                  </>
                );
                const cls = "adm-nav-item relative flex items-center gap-2.5 px-2.5 py-2 text-[12.5px]";
                const style = {
                  color: active ? T.text : T.muted,
                  backgroundColor: active ? "rgba(107,159,238,0.10)" : "transparent",
                  fontWeight: active ? 600 : 400,
                } as const;
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} className={cls} style={style}>{inner}</Link>
                    ) : (
                      <span className={cls + " cursor-default"} style={{ ...style, opacity: 0.75 }}>{inner}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3" style={{ borderTop: `1px solid ${T.border}` }}>
        <Link
          href="/"
          target="_blank"
          className="adm-nav-item flex items-center gap-2.5 px-2.5 py-2 text-[12.5px]"
          style={{ color: T.muted }}
        >
          <ExternalLink size={14} />
          Voir le site
        </Link>
      </div>

      <div className="px-4 py-4 flex items-center gap-3" style={{ borderTop: `1px solid ${T.border}` }}>
        <span
          className="flex items-center justify-center w-8 h-8 text-[11px] font-semibold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #24406E, #12233F)", border: "1px solid rgba(199,211,232,0.28)", color: "#C7D3E8" }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate" style={{ color: T.textDim }}>{name}</div>
          <AdminLogout />
        </div>
      </div>
    </aside>
  );
}
