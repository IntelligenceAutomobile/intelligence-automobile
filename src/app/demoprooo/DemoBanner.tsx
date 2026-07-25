// Bandeau permanent rappelant qu'il s'agit d'une démonstration + appel au contact.
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { T } from "@/app/admin/ui";

export default function DemoBanner() {
  return (
    <div
      className="flex items-center gap-3 px-4 sm:px-6 py-2.5"
      style={{
        backgroundColor: "var(--adm-accent-soft)",
        borderBottom: `1px solid var(--adm-accent-border)`,
      }}
    >
      <Sparkles size={15} style={{ color: T.accent, flexShrink: 0 }} />
      <p className="text-[12.5px] min-w-0" style={{ color: T.textDim }}>
        <span className="font-semibold" style={{ color: T.text }}>Démonstration</span>
        <span className="hidden sm:inline"> — vous explorez le back-office avec des données d&apos;exemple. </span>
        <span className="sm:hidden"> · données d&apos;exemple. </span>
      </p>
      <Link
        href="/contact"
        className="ml-auto inline-flex items-center gap-1 text-[11px] tracking-widest uppercase font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ color: T.accent }}
      >
        <span className="hidden sm:inline">Demander une démo</span>
        <span className="sm:hidden">Contact</span>
        <ChevronRight size={13} />
      </Link>
    </div>
  );
}
