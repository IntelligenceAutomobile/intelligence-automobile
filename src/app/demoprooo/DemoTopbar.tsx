"use client";

// Barre supérieure de la démonstration : fil d'Ariane dérivé de l'URL et action
// « Ajouter » qui affiche un message de démo au lieu d'agir.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { T, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { useToast } from "@/app/admin/toast";
import { DEMO_BASE, DEMO_MSG } from "./demo";

const SEGMENT_LABELS: Record<string, string> = {
  vehicules: "Stock",
  devis: "Devis",
  factures: "Factures",
  relances: "Relances",
  clients: "Clients & leads",
  reprises: "Reprises",
  planning: "Planning atelier",
  diffusion: "Diffusion",
  garanties: "Garanties",
  immatriculations: "Immatriculations",
  avis: "Avis clients",
  marque: "Marque blanche",
  comptes: "Comptes",
  utilisateurs: "Utilisateurs",
  atelier: "Atelier",
  suivi: "Suivi du véhicule",
  nouveau: "Nouveau",
};

function crumbsFrom(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean).slice(1); // retire "demoprooo"
  if (parts.length === 0) return [{ label: "Tableau de bord" }];
  const crumbs: { label: string; href?: string }[] = [];
  let acc = DEMO_BASE;
  parts.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLast = i === parts.length - 1;
    const label = SEGMENT_LABELS[seg] ?? (seg.length > 12 ? "Fiche" : seg.charAt(0).toUpperCase() + seg.slice(1));
    crumbs.push({ label, href: isLast ? undefined : acc });
  });
  return crumbs;
}

export default function DemoTopbar() {
  const pathname = usePathname();
  const crumbs = crumbsFrom(pathname);
  const toast = useToast();

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-4 px-4 sm:px-6 h-14 flex-shrink-0"
      style={{
        borderBottom: `1px solid ${T.border}`,
        backgroundColor: "rgba(7,15,30,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase min-w-0" style={{ color: T.muted }}>
        <Link href={DEMO_BASE} className="transition-colors hover:text-[#F0F5FF] flex-shrink-0">Démo</Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight size={12} className="flex-shrink-0" />
            {c.href ? (
              <Link href={c.href} className="transition-colors hover:text-[#F0F5FF] truncate">{c.label}</Link>
            ) : (
              <span className="truncate" style={{ color: T.textDim }}>{c.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => toast.info(DEMO_MSG)}
          className={btnPrimaryClass + " flex-shrink-0"}
          style={btnPrimaryStyle}
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>
    </header>
  );
}
