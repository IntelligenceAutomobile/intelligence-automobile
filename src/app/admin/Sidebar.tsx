"use client";

// Colonne de navigation du back-office (desktop).
import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Car, FileText, ReceiptText, BellRing, Wallet, MessagesSquare, Users,
  CalendarClock, Radio, HandCoins, ShieldCheck, Star, UserCog, ExternalLink, Palette, RotateCcw, FileBadge,
  NotebookPen, FolderKanban, Check, Mail, Info, BarChart3, ImagePlus, FileSignature, type LucideIcon,
} from "lucide-react";
import { can, ROLE_LABEL, type Role, type Capability } from "@/lib/roles";
import { T } from "./ui";
import AdminLogout from "./AdminLogout";
import { ConfirmDialog } from "./confirm";
import { useToast } from "./toast";
import { useAcceptationCount } from "./AcceptationsWatcher";
import { useMandatSignatureCount } from "./MandatSignaturesWatcher";
import NouveautesModal from "./NouveautesModal";
import { nouveautePour, type Nouveaute } from "./nouveautes";

// `revu` marque les modules repris et audités ces derniers jours : une coche
// verte dans la barre sert de repère pour savoir où le travail est passé.
// La date est celle de la dernière refonte, lisible au survol.
type NavItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
  exact?: boolean;
  soon?: boolean;
  cap?: Capability;
  revu?: string;
  /** Écran nominatif : visible des seules personnes autorisées (voitAudience). */
  prive?: boolean;
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Pilotage",
    items: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin", exact: true },
      { icon: BarChart3, label: "Audience", href: "/admin/audience", revu: "3 août 2026", prive: true },
    ],
  },
  {
    section: "Activité",
    items: [
      { icon: Car, label: "Stock", href: "/admin/vehicules", revu: "28 juillet 2026" },
      { icon: FileText, label: "Devis", href: "/admin/devis", revu: "29 juillet 2026" },
      { icon: ReceiptText, label: "Factures", href: "/admin/factures", revu: "28 juillet 2026" },
      { icon: BellRing, label: "Relances", href: "/admin/relances", revu: "30 juillet 2026" },
      { icon: Users, label: "Clients & leads", href: "/admin/clients" },
      { icon: HandCoins, label: "Reprises", href: "/admin/reprises", revu: "31 juillet 2026" },
      { icon: FileSignature, label: "Mandats", href: "/admin/mandats" },
      { icon: CalendarClock, label: "Planning atelier", href: "/admin/planning", revu: "28 juillet 2026" },
      { icon: Radio, label: "Diffusion", href: "/admin/diffusion", revu: "10 août 2026" },
      { icon: ShieldCheck, label: "Garanties", href: "/admin/garanties" },
      { icon: FileBadge, label: "Immatriculations", href: "/admin/immatriculations" },
      { icon: Star, label: "Avis clients", href: "/admin/avis" },
    ],
  },
  {
    section: "Équipe",
    items: [
      { icon: MessagesSquare, label: "Atelier", href: "/admin/atelier", revu: "29 juillet 2026" },
      { icon: FolderKanban, label: "Projets", href: "/admin/projets" },
      { icon: ImagePlus, label: "Visuels", href: "/admin/visuels" },
      { icon: NotebookPen, label: "Réunions", href: "/admin/reunions", revu: "29 juillet 2026" },
      { icon: Wallet, label: "Comptes", href: "/admin/comptes", cap: "finances" },
    ],
  },
  {
    section: "Réglages",
    items: [
      { icon: Mail, label: "Messagerie", href: "/admin/messagerie", cap: "settings" },
      { icon: UserCog, label: "Utilisateurs", href: "/admin/utilisateurs", cap: "users" },
      { icon: Palette, label: "Marque blanche", href: "/admin/marque", cap: "settings" },
    ],
  },
];

export default function Sidebar({
  name,
  role,
  audience = false,
  mandats = true,
  brandName,
  brandTagline,
  showroom = false,
  relanceCount = 0,
}: {
  name: string;
  role: Role;
  /** Droit d'ouvrir l'écran d'audience, accordé nominativement. */
  audience?: boolean;
  /** Lancement nominatif des mandats (Fab puis César) : voir voitMandats(). */
  mandats?: boolean;
  brandName: string;
  brandTagline: string;
  showroom?: boolean;
  relanceCount?: number;
}) {
  const pathname = usePathname();
  // Devis et mandats signés en ligne, pas encore consultés : la bonne nouvelle
  // se voit sans avoir à ouvrir la liste.
  const acceptations = useAcceptationCount();
  const mandatsSignes = useMandatSignatureCount();
  // Filtre la navigation selon les capacités du rôle et les écrans nominatifs ;
  // retire les sections vides.
  const nav = NAV.map((g) => ({
    ...g,
    items: g.items.filter(
      (it) =>
        (!it.cap || can(role, it.cap)) &&
        (!it.prive || audience) &&
        // Verrou de lancement des mandats : la ligne s'efface pour les autres.
        (it.href !== "/admin/mandats" || mandats),
    ),
  })).filter((g) => g.items.length > 0);
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);
  // Fiche des nouveautés du module, ouverte par le « i » de la ligne.
  const [nouveaute, setNouveaute] = useState<Nouveaute | null>(null);
  const [resetting, setResetting] = useState(false);

  async function resetDemo() {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/showroom-reset", { method: "POST" });
      if (!res.ok) throw new Error();
      setConfirmReset(false);
      toast.success("Démo réinitialisée : données remises à neuf.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("La réinitialisation a échoué.");
    } finally {
      setResetting(false);
    }
  }
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
        <span className="block text-[13px] tracking-[0.24em] uppercase font-semibold leading-snug" style={{ color: T.text }}>
          {brandName}
        </span>
        <span className="block text-[9px] tracking-[0.38em] uppercase mt-1 truncate" style={{ color: "#C7D3E8" }}>
          {brandTagline}
        </span>
      </Link>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {nav.map((group) => (
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
                const fiche = nouveautePour(item.href);
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
                    {item.revu && (
                      <span
                        title={`Repris et audité le ${item.revu}`}
                        aria-label={`Repris et audité le ${item.revu}`}
                        className="flex-shrink-0 inline-flex"
                        style={{ color: T.success }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    {fiche && (
                      // Ouvre la fiche des nouveautés sans suivre le lien de la
                      // ligne : c'est un point d'information, pas une navigation.
                      <span
                        role="button"
                        tabIndex={0}
                        title={`Ce qui a changé dans ${item.label}`}
                        aria-label={`Ce qui a changé dans ${item.label}`}
                        className="adm-act flex-shrink-0 inline-flex cursor-pointer"
                        style={{ color: T.accent }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNouveaute(fiche);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setNouveaute(fiche);
                          }
                        }}
                      >
                        <Info size={12} />
                      </span>
                    )}
                    {item.soon && (
                      <span
                        className="ml-auto text-[8px] tracking-[0.14em] uppercase px-1.5 py-0.5 flex-shrink-0"
                        style={{ border: "1px solid rgba(199,211,232,0.28)", color: "#C7D3E8" }}
                      >
                        Bientôt
                      </span>
                    )}
                    {item.href === "/admin/devis" && acceptations > 0 && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(78,209,161,0.10)",
                          border: "1px solid rgba(78,209,161,0.40)",
                          color: T.success,
                          fontVariantNumeric: "tabular-nums",
                        }}
                        aria-label={`${acceptations} devis accepté${acceptations > 1 ? "s" : ""} par un client`}
                      >
                        {acceptations}
                      </span>
                    )}
                    {item.href === "/admin/mandats" && mandatsSignes > 0 && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(78,209,161,0.10)",
                          border: "1px solid rgba(78,209,161,0.40)",
                          color: T.success,
                          fontVariantNumeric: "tabular-nums",
                        }}
                        aria-label={`${mandatsSignes} mandat${mandatsSignes > 1 ? "s" : ""} signé${mandatsSignes > 1 ? "s" : ""} par un client`}
                      >
                        {mandatsSignes}
                      </span>
                    )}
                    {item.href === "/admin/relances" && relanceCount > 0 && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(240,180,90,0.10)",
                          border: "1px solid rgba(240,180,90,0.38)",
                          color: T.warning,
                          fontVariantNumeric: "tabular-nums",
                        }}
                        aria-label={`${relanceCount} relance${relanceCount > 1 ? "s" : ""} à faire`}
                      >
                        {relanceCount}
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
        {showroom && can(role, "settings") && (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="adm-nav-item flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] w-full text-left"
            style={{ color: "#F0B45A" }}
          >
            <RotateCcw size={14} />
            Réinitialiser la démo
          </button>
        )}
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
          <div className="text-xs font-medium truncate" style={{ color: T.textDim }}>
            {name}
            <span className="ml-1.5 text-[9px] tracking-widest uppercase" style={{ color: T.muted }}>· {ROLE_LABEL[role]}</span>
          </div>
          <AdminLogout />
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Réinitialiser la démo ?"
        description="Toutes les données de démonstration (clients, leads, RDV, devis, diffusion) seront remises à leur état d'origine."
        confirmLabel="Réinitialiser"
        busy={resetting}
        onConfirm={resetDemo}
        onCancel={() => setConfirmReset(false)}
      />

      {nouveaute && <NouveautesModal nouveaute={nouveaute} onClose={() => setNouveaute(null)} />}
    </aside>
  );
}
