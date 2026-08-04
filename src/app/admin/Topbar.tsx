"use client";

// Barre supérieure : fil d'Ariane dérivé de l'URL, recherche (Ctrl+K), action rapide.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import type { Role } from "@/lib/roles";
import { T, btnPrimaryClass, btnPrimaryStyle } from "./ui";
import CommandPalette from "./CommandPalette";

const SEGMENT_LABELS: Record<string, string> = {
  audience: "Audience",
  vehicules: "Stock",
  devis: "Devis",
  factures: "Factures",
  relances: "Relances",
  clients: "Clients & leads",
  reprises: "Reprises",
  planning: "Planning atelier",
  diffusion: "Diffusion",
  garanties: "Garanties",
  avis: "Avis clients",
  marque: "Marque blanche",
  comptes: "Comptes",
  utilisateurs: "Utilisateurs",
  atelier: "Atelier",
  reunions: "Réunions",
  nouveau: "Nouveau",
  imprimer: "Impression",
  concept: "Concept",
  "modale-apercu": "Aperçu modale",
};

function crumbsFrom(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean).slice(1); // retire "admin"
  if (parts.length === 0) return [{ label: "Tableau de bord" }];
  const crumbs: { label: string; href?: string }[] = [];
  let acc = "/admin";
  parts.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLast = i === parts.length - 1;
    const label = SEGMENT_LABELS[seg] ?? (seg.length > 12 ? "Fiche" : seg.charAt(0).toUpperCase() + seg.slice(1));
    crumbs.push({ label, href: isLast ? undefined : acc });
  });
  return crumbs;
}

export default function Topbar({ role, audience = false }: { role: Role; audience?: boolean }) {
  const pathname = usePathname();
  const crumbs = crumbsFrom(pathname);

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
        <Link href="/admin" className="transition-colors hover:text-[#F0F5FF] flex-shrink-0">Admin</Link>
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
        <CommandPalette role={role} audience={audience} />
        <Link href="/admin/vehicules/nouveau" className={btnPrimaryClass + " flex-shrink-0"} style={btnPrimaryStyle}>
          <Plus size={14} />
          <span className="hidden sm:inline">Ajouter</span>
        </Link>
      </div>
    </header>
  );
}
