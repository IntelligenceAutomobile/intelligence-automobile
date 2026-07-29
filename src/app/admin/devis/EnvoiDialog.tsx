"use client";

// Fenêtre d'envoi d'un devis au client : destinataire, objet, message, et le
// lien de consultation copiable. Vit à part du bouton d'en-tête pour que
// l'éditeur puisse la proposer juste après un enregistrement.
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Copy } from "lucide-react";
import { T, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle, fieldClass, fieldStyle, labelClass } from "../ui";
import { useToast } from "../toast";

// L'adresse du site ne change jamais en cours de session : rien à surveiller.
const subscribeOrigin = () => () => {};

export default function EnvoiDialog({
  open,
  quoteId,
  number,
  clientEmail,
  clientName,
  publicToken,
  onClose,
  onSent,
}: {
  open: boolean;
  quoteId: string;
  number: string;
  clientEmail: string;
  clientName: string;
  publicToken: string | null;
  onClose: () => void;
  onSent?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [to, setTo] = useState(clientEmail);
  const [subject, setSubject] = useState(`Votre devis ${number}`);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // L'adresse du site vient du navigateur. Lue pendant le rendu, elle différait
  // entre le serveur et le client et cassait l'hydratation : le serveur rend une
  // chaîne vide, le client complète après montage.
  const origin = useSyncExternalStore(subscribeOrigin, () => window.location.origin, () => "");
  const lien = publicToken && origin ? `${origin}/devis/${publicToken}` : "";

  async function envoyer() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/devis/${quoteId}/envoi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(j.sent ? `Devis ${number} envoyé à ${to}.` : `Lien du devis ${number} prêt. L'envoi d'email attend sa clé.`);
      onClose();
      onSent?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Envoyer le devis au client"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg p-6 space-y-4"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }}
      >
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: T.accent }}>Envoyer le devis {number}</p>
          <p className="text-[13px]" style={{ color: T.muted }}>
            Le client reçoit un lien vers son devis, qu&apos;il peut accepter en ligne.
          </p>
        </div>

        <label className="block">
          <span className={labelClass} style={{ color: T.muted }}>Destinataire</span>
          <input className={fieldClass} style={fieldStyle} value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@email.com" />
        </label>
        <label className="block">
          <span className={labelClass} style={{ color: T.muted }}>Objet</span>
          <input className={fieldClass} style={fieldStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass} style={{ color: T.muted }}>Message (optionnel)</span>
          <textarea
            className={fieldClass}
            style={{ ...fieldStyle, resize: "vertical" }}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Bonjour ${clientName || ""}, voici le devis dont nous avons parlé.`.trim()}
          />
        </label>

        {lien && (
          <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
            <span className="text-[11px] truncate flex-1" style={{ color: T.muted }}>{lien}</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(lien); toast.success("Lien copié."); }}
              className="adm-act inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase"
              style={{ color: T.accent }}
            >
              <Copy size={12} />
              Copier
            </button>
          </div>
        )}

        {error && <p className="text-sm" style={{ color: T.danger }}>{error}</p>}

        <div className="flex flex-wrap gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
          <button type="button" onClick={envoyer} disabled={busy || !to.trim()} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {busy ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
