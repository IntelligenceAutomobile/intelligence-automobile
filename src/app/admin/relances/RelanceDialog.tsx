"use client";

// Aperçu de relance, partagé par le centre de relances et la liste des devis :
// aucun email ne part sans que l'utilisateur ait lu ce que reçoit le client.
// Le corps affiché vient du serveur (même gabarit que l'envoi) et le message
// personnel s'y insère en direct, au même endroit qu'à l'arrivée.
import { useEffect, useMemo, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { escapeHtml } from "@/lib/html";
import { T, Tag, btnGhostClass, btnGhostStyle } from "../ui";

export type RelanceTarget = { id: string; number: string; client: string; kind: "devis" | "facture" };

export type RelancePreview = {
  to: string;
  subject: string;
  html: string;
  palier: number;
  palierLabel: string;
  expired: boolean;
  phone: string;
  relanceCount: number;
};

// L'erreur porte le statut HTTP : un 502 (email pas parti) garde le dialogue
// ouvert avec le message tapé, un 409 (document plus éligible) le ferme.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function relanceApi(id: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/admin/relances/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(typeof j.error === "string" ? j.error : "", res.status);
  return j as { until?: string; warning?: string };
}

const PALIER_TONE = ["accent", "warning", "danger"] as const;

export function RelanceDialog({
  target,
  preview,
  sending,
  onSend,
  onCancel,
}: {
  target: RelanceTarget;
  preview: RelancePreview;
  sending: boolean;
  onSend: (message: string) => void;
  onCancel: () => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !sending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sending, onCancel]);

  const isFacture = target.kind === "facture";
  const suggestPhone = preview.relanceCount >= 2 && preview.phone;

  // L'aperçu reflète la saisie en direct : le message personnel s'insère au
  // même endroit que côté serveur (conteneur data-perso), échappé pareil.
  const liveHtml = useMemo(() => {
    const perso = message
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `<p>${escapeHtml(l)}</p>`)
      .join("");
    return preview.html.replace("<div data-perso></div>", `<div data-perso>${perso}</div>`);
  }, [preview.html, message]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={sending ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Relire la relance avant envoi"
    >
      <div
        className="w-full max-w-xl max-h-full overflow-y-auto p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 36, height: 36, backgroundColor: "var(--adm-accent-soft)", border: "1px solid var(--adm-accent-border)", color: T.accent }}
          >
            <Send size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium" style={{ color: T.text }}>
              Relire avant d&apos;envoyer
            </h2>
            <p className="text-sm mt-0.5 truncate" style={{ color: T.muted }}>
              {isFacture ? "Facture" : "Devis"} {target.number}
              {target.client ? ` · ${target.client}` : ""}
            </p>
          </div>
          {preview.palierLabel && (
            <span className="ml-auto flex-shrink-0">
              <Tag tone={PALIER_TONE[preview.palier] ?? "warning"}>{preview.palierLabel}</Tag>
            </span>
          )}
        </div>

        <div className="text-[12px] mb-3 space-y-1" style={{ color: T.textDim }}>
          <div className="truncate">
            <span style={{ color: T.muted }}>Destinataire</span> {preview.to}
          </div>
          <div className="truncate">
            <span style={{ color: T.muted }}>Objet</span> {preview.subject}
          </div>
        </div>

        {preview.expired && (
          <div className="text-[12px] px-3 py-2 mb-3" style={{ backgroundColor: "rgba(240,180,90,0.10)", border: "1px solid rgba(240,180,90,0.38)", color: T.warning }}>
            La validité de ce devis est dépassée : l&apos;email propose au client une version à jour plutôt qu&apos;une acceptation en ligne.
          </div>
        )}
        {suggestPhone && (
          <div className="text-[12px] px-3 py-2 mb-3" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
            Déjà {isFacture ? "relancée" : "relancé"} ×{preview.relanceCount}. Un appel vaut parfois mieux : {preview.phone}.
          </div>
        )}

        <iframe
          sandbox=""
          srcDoc={liveHtml}
          title="Aperçu de l'email de relance"
          className="w-full"
          style={{ height: 320, border: `1px solid ${T.border}`, backgroundColor: "#070F1E" }}
        />

        <label className="block mt-4">
          <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
            Message personnel (optionnel)
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Ex. : suite à notre échange d'hier, voici le récapitulatif…"
            className="mt-1.5 w-full text-sm p-2.5 outline-none"
            style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.text }}
          />
        </label>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button type="button" onClick={onCancel} disabled={sending} className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSend(message)}
            disabled={sending}
            autoFocus
            className="adm-btn-focus inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-5 py-3 transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: T.accent, color: T.bg }}
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Envoyer la relance
          </button>
        </div>
      </div>
    </div>
  );
}

// Ouverture de l'aperçu puis envoi, pour les écrans qui veulent juste « un
// bouton Relancer sûr » (liste des devis).
export function useRelanceSender(opts: {
  onSent: (target: RelanceTarget, warning?: string) => void;
  onError: (e: unknown) => void;
}) {
  const [state, setState] = useState<{ target: RelanceTarget; preview: RelancePreview } | null>(null);
  const [sending, setSending] = useState(false);
  const { onSent, onError } = opts;

  async function open(target: RelanceTarget): Promise<void> {
    try {
      const res = await fetch(`/api/admin/relances/${target.id}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(typeof j.error === "string" ? j.error : "", res.status);
      setState({ target, preview: j as RelancePreview });
    } catch (e) {
      onError(e);
    }
  }

  async function send(message: string) {
    if (!state) return;
    const target = state.target;
    setSending(true);
    try {
      const j = await relanceApi(target.id, { action: "relance", message });
      setState(null);
      onSent(target, j.warning);
    } catch (e) {
      // Panne d'envoi passagère : le dialogue reste ouvert, message intact.
      if (e instanceof ApiError && (e.status === 502 || e.status === 503)) onError(e);
      else {
        setState(null);
        onError(e);
      }
    } finally {
      setSending(false);
    }
  }

  const dialog = state ? (
    <RelanceDialog
      target={state.target}
      preview={state.preview}
      sending={sending}
      onSend={send}
      onCancel={() => setState(null)}
    />
  ) : null;

  return { open, dialog };
}
