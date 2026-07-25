// Rattrape les modules de la démo pas encore construits (Lot 2 : Factures,
// Relances, Reprises, Diffusion, Garanties, Immatriculations, Avis, Atelier,
// Comptes, Utilisateurs, Marque blanche). Affiche un écran « en préparation »
// dans la coquille de démo au lieu d'un 404. Les vraies pages, quand elles
// existeront, auront priorité sur cette route attrape-tout.
import Link from "next/link";
import { Hammer, ChevronLeft } from "lucide-react";
import { AdminPage, PageHeader, T } from "@/app/admin/ui";
import { DEMO_BASE } from "../demo";

const LABELS: Record<string, string> = {
  factures: "Factures",
  relances: "Relances",
  reprises: "Reprises",
  diffusion: "Diffusion",
  garanties: "Garanties",
  immatriculations: "Immatriculations",
  avis: "Avis clients",
  atelier: "Atelier",
  comptes: "Comptes",
  utilisateurs: "Utilisateurs",
  marque: "Marque blanche",
};

export default async function DemoPlaceholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug?.[0] ?? "";
  const label = LABELS[key] ?? "Ce module";

  return (
    <AdminPage>
      <PageHeader title={label} subtitle="Ce module de la démonstration arrive prochainement." />
      <div
        className="flex flex-col items-center text-center px-6 py-16 gap-4"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
      >
        <span
          className="flex items-center justify-center"
          style={{ width: 52, height: 52, backgroundColor: "var(--adm-accent-soft)", border: "1px solid var(--adm-accent-border)", color: T.accent }}
        >
          <Hammer size={22} />
        </span>
        <p className="text-base" style={{ color: T.textDim }}>
          {label} fait partie du back-office et sera ajouté à la démonstration.
        </p>
        <p className="text-sm max-w-md" style={{ color: T.muted }}>
          Le tableau de bord, le stock, les devis, les clients et le planning sont déjà explorables.
        </p>
        <Link
          href={DEMO_BASE}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase mt-2 transition-colors hover:text-[#F0F5FF]"
          style={{ color: T.accent }}
        >
          <ChevronLeft size={13} />
          Retour au tableau de bord
        </Link>
      </div>
    </AdminPage>
  );
}
