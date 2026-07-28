"use client";

// Bandeau permanent rappelant qu'il s'agit d'une démonstration, avec la remise
// à zéro du décor et l'appel au contact.
import Link from "next/link";
import { Sparkles, ChevronRight, RotateCcw } from "lucide-react";
import { T } from "@/app/admin/ui";
import { useToast } from "@/app/admin/toast";
import { resetDemo } from "./store";

export default function DemoBanner() {
  const toast = useToast();

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
        <span className="hidden sm:inline"> — essayez tout, rien n&apos;est enregistré. </span>
        <span className="sm:hidden"> · essayez tout. </span>
      </p>

      <button
        type="button"
        onClick={() => { resetDemo(); toast.success("Démonstration remise à zéro."); }}
        title="Remettre les données d'exemple en place"
        className="adm-act ml-auto inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase flex-shrink-0 transition-colors"
        style={{ color: T.muted }}
      >
        <RotateCcw size={13} />
        <span className="hidden sm:inline">Réinitialiser</span>
      </button>

      <Link
        href="/contact"
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ color: T.accent }}
      >
        <span className="hidden sm:inline">Demander une démo</span>
        <span className="sm:hidden">Contact</span>
        <ChevronRight size={13} />
      </Link>
    </div>
  );
}
