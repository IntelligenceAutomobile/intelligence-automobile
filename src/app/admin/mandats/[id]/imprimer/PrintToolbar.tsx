"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

// Barre d'outils à l'écran, masquée à l'impression par la classe
// mandat-no-print. Même recette que les offres de reprise.
export default function PrintToolbar() {
  const params = useParams<{ id: string }>();
  return (
    <div className="mandat-no-print flex items-center justify-center gap-3 py-4" style={{ backgroundColor: "#0A1628" }}>
      <button
        type="button"
        onClick={() => window.print()}
        className="text-xs font-semibold tracking-widest uppercase px-5 py-3"
        style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
      >
        Imprimer / Enregistrer en PDF
      </button>
      <Link
        href={`/admin/mandats/${params.id}`}
        className="text-xs font-semibold tracking-widest uppercase px-5 py-3 border"
        style={{ borderColor: "#1B3055", color: "#E7EFFC" }}
      >
        Retour
      </Link>
    </div>
  );
}
