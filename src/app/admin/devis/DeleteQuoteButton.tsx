"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "../ui";

export default function DeleteQuoteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleDelete() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/devis/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
      setError(true);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-[11px]" style={{ color: error ? T.danger : T.muted }}>
          {error ? "Échec, réessayer ?" : "Supprimer ?"}
        </span>
        <button onClick={handleDelete} disabled={busy} className="text-[11px] tracking-widest uppercase py-2 -my-2 transition-opacity hover:opacity-80 disabled:opacity-50" style={{ color: T.danger }}>
          {busy ? "…" : "Oui"}
        </button>
        <button onClick={() => { setConfirming(false); setError(false); }} disabled={busy} className="text-[11px] tracking-widest uppercase py-2 -my-2 transition-colors hover:text-[#F0F5FF]" style={{ color: T.textDim }}>
          Non
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="inline-block text-[11px] tracking-widest uppercase py-2 -my-2 transition-colors hover:text-[#FF6B35]" style={{ color: T.muted }}>
      Supprimer
    </button>
  );
}
