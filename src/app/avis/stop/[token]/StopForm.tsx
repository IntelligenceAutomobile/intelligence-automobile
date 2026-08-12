"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export default function StopForm({
  token,
  adresse,
  dejaFait,
}: {
  token: string;
  adresse: string;
  /** L'opposition est déjà enregistrée : la page le dit et s'arrête là. */
  dejaFait: boolean;
}) {
  const [fait, setFait] = useState(dejaFait);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  async function confirmer() {
    setBusy(true);
    setErreur("");
    try {
      const res = await fetch("/api/avis/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error();
      setFait(true);
    } catch {
      setErreur("L'enregistrement a échoué. Réessayez dans un instant, ou répondez simplement à notre message.");
    } finally {
      setBusy(false);
    }
  }

  if (fait) {
    return (
      <div className="flex items-start gap-3">
        <Check size={20} style={{ color: "#4ED1A1", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-base mb-2" style={{ color: "#E7EFFC" }}>
            C&apos;est enregistré. Nos messages s&apos;arrêtent ici pour {adresse}.
          </p>
          <p className="text-sm" style={{ color: "#9FB3D4" }}>
            Votre dossier et vos documents restent inchangés. Pour reprendre contact, écrivez-nous quand vous le
            souhaitez.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-base mb-3" style={{ color: "#E7EFFC" }}>
        Vous pouvez cesser de recevoir nos invitations à laisser un avis, envoyées à {adresse}.
      </p>
      <p className="text-sm mb-8" style={{ color: "#9FB3D4" }}>
        Ce choix vaut pour tous nos messages commerciaux. Vos documents (devis, factures, garanties) continuent de
        vous parvenir normalement.
      </p>
      {erreur && (
        <p className="text-sm mb-4" style={{ color: "#FF6B35" }}>
          {erreur}
        </p>
      )}
      <button
        type="button"
        onClick={confirmer}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-6 py-3.5 transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
      >
        {busy && <Loader2 size={14} className="animate-spin" />}
        Confirmer mon choix
      </button>
    </>
  );
}
