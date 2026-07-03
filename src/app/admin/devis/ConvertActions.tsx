"use client";

// Conversion d'un devis en facture (acompte / solde / complète) — sur la fiche devis.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Loader2 } from "lucide-react";
import { btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";

export default function ConvertActions({ quoteId, hasDeposit }: { quoteId: string; hasDeposit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function convert(kind: "acompte" | "solde" | "complete") {
    setBusy(kind);
    try {
      const res = await fetch(`/api/admin/devis/${quoteId}/facture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Facture ${j.number} créée.`);
      router.push(`/admin/devis/${j.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La conversion a échoué.");
      setBusy(null);
    }
  }

  if (hasDeposit) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => convert("acompte")} disabled={busy !== null} className={btnGhostClass} style={btnGhostStyle}>
          {busy === "acompte" ? <Loader2 size={13} className="animate-spin" /> : <FileCheck2 size={13} />}
          Facture d&apos;acompte
        </button>
        <button type="button" onClick={() => convert("solde")} disabled={busy !== null} className={btnPrimaryClass} style={btnPrimaryStyle}>
          {busy === "solde" ? <Loader2 size={13} className="animate-spin" /> : <FileCheck2 size={13} />}
          Facture de solde
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => convert("complete")} disabled={busy !== null} className={btnPrimaryClass} style={btnPrimaryStyle}>
      {busy === "complete" ? <Loader2 size={13} className="animate-spin" /> : <FileCheck2 size={13} />}
      Créer la facture
    </button>
  );
}
