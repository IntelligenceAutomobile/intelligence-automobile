"use client";

// Colonne de navigation de la démonstration (copie autonome de la Sidebar admin,
// réaiguillée vers /demoprooo et sans aucune action réelle). Le vrai back-office
// n'est pas impacté.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, FileText, ReceiptText, BellRing, Wallet, MessagesSquare, Users,
  CalendarClock, Radio, HandCoins, ShieldCheck, Star, UserCog, ExternalLink, Palette, FileBadge, LogOut, type LucideIcon,
} from "lucide-react";
import { T } from "@/app/admin/ui";
import { DEMO_BASE, DEMO_BRAND, DEMO_USER } from "./demo";
import { ROLE_LABEL } from "@/lib/roles";

type NavItem = { icon: LucideIcon; label: string; href: string; exact?: boolean };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Pilotage", items: [{ icon: LayoutDashboard, label: "Tableau de bord", href: "", exact: true }] },
  {
    section: "Activité",
    items: [
      { icon: Car, label: "Stock", href: "/vehicules" },
      { icon: FileText, label: "Devis", href: "/devis" },
      { icon: ReceiptText, label: "Factures", href: "/factures" },
      { icon: BellRing, label: "Relances", href: "/relances" },
      { icon: Users, label: "Clients & leads", href: "/clients" },
      { icon: HandCoins, label: "Reprises", href: "/reprises" },
      { icon: CalendarClock, label: "Planning atelier", href: "/planning" },
      { icon: Radio, label: "Diffusion", href: "/diffusion" },
      { icon: ShieldCheck, label: "Garanties", href: "/garanties" },
      { icon: FileBadge, label: "Immatriculations", href: "/immatriculations" },
      { icon: Star, label: "Avis clients", href: "/avis" },
    ],
  },
  {
    section: "Équipe",
    items: [
      { icon: MessagesSquare, label: "Atelier", href: "/atelier" },
      { icon: Wallet, label: "Comptes", href: "/comptes" },
    ],
  },
  {
    section: "Réglages",
    items: [
      { icon: UserCog, label: "Utilisateurs", href: "/utilisateurs" },
      { icon: Palette, label: "Marque blanche", href: "/marque" },
    ],
  },
];

export default function DemoSidebar() {
  const pathname = usePathname();
  const initials = DEMO_USER.name
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
      <Link href={DEMO_BASE} className="block px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${T.border}` }}>
        <span className="block text-[13px] tracking-[0.24em] uppercase font-semibold leading-snug" style={{ color: T.text }}>
          {DEMO_BRAND.name}
        </span>
        <span className="block text-[9px] tracking-[0.38em] uppercase mt-1 truncate" style={{ color: "#C7D3E8" }}>
          {DEMO_BRAND.tagline}
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
                const full = `${DEMO_BASE}${item.href}`;
                const active = item.exact ? pathname === full : pathname.startsWith(full);
                const cls = "adm-nav-item relative flex items-center gap-2.5 px-2.5 py-2 text-[12.5px]";
                const style = {
                  color: active ? T.text : T.muted,
                  backgroundColor: active ? "rgba(107,159,238,0.10)" : "transparent",
                  fontWeight: active ? 600 : 400,
                } as const;
                return (
                  <li key={item.label}>
                    <Link href={full} className={cls} style={style}>
                      {active && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-[2px]"
                          style={{ background: `linear-gradient(to bottom, transparent, ${T.accent}, transparent)` }}
                        />
                      )}
                      <item.icon size={15} style={{ color: active ? T.accent : T.muted, flexShrink: 0 }} />
                      <span className="truncate">{item.label}</span>
                    </Link>
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
          <div className="text-xs font-medium truncate" style={{ color: T.textDim }}>
            {DEMO_USER.name}
            <span className="ml-1.5 text-[9px] tracking-widest uppercase" style={{ color: T.muted }}>· {ROLE_LABEL[DEMO_USER.role]}</span>
          </div>
          <Link href="/" className="inline-flex items-center gap-1 text-[11px] mt-0.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }}>
            <LogOut size={11} />
            Quitter la démo
          </Link>
        </div>
      </div>
    </aside>
  );
}
