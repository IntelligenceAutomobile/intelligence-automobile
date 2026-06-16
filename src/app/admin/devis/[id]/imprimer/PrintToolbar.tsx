"use client";

import { useRouter } from "next/navigation";
import { T, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../../../ui";

export default function PrintToolbar() {
  const router = useRouter();
  return (
    <div className="devis-no-print flex items-center justify-center gap-3 py-4 sticky top-0 z-10" style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
      <button onClick={() => window.print()} className={btnPrimaryClass} style={btnPrimaryStyle}>
        Imprimer / Enregistrer en PDF
      </button>
      <button onClick={() => router.back()} className={btnGhostClass} style={btnGhostStyle}>
        Retour
      </button>
    </div>
  );
}
