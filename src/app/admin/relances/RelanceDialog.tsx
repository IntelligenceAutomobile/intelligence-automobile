"use client";

// Aperçu de relance, partagé par le centre de relances et la liste des devis :
// aucun email ne part sans que l'utilisateur ait lu ce que reçoit le client.
//
// Le cadre, l'aperçu en direct et le champ de message personnel vivent
// désormais dans la coquille partagée (../EnvoiDialog), que la demande d'avis
// réutilise. Ce fichier garde ce qui appartient à la relance : le palier, la
// validité dépassée, le rappel du téléphone, et l'appel à la route.
import { useState } from "react";
import { Tag } from "../ui";
import { ApiError, EnvoiDialog, EnvoiNote } from "../EnvoiDialog";

export { ApiError };

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
  const isFacture = target.kind === "facture";
  const suggestPhone = preview.relanceCount >= 2 && preview.phone;

  return (
    <EnvoiDialog
      ariaLabel="Relire la relance avant envoi"
      title="Relire avant d'envoyer"
      subtitle={`${isFacture ? "Facture" : "Devis"} ${target.number}${target.client ? ` · ${target.client}` : ""}`}
      badge={
        preview.palierLabel ? (
          <Tag tone={PALIER_TONE[preview.palier] ?? "warning"}>{preview.palierLabel}</Tag>
        ) : undefined
      }
      to={preview.to}
      subject={preview.subject}
      notes={
        <>
          {preview.expired && (
            <EnvoiNote tone="warning">
              La validité de ce devis est dépassée : l&apos;email propose au client une version à jour plutôt
              qu&apos;une acceptation en ligne.
            </EnvoiNote>
          )}
          {suggestPhone && (
            <EnvoiNote>
              Déjà {isFacture ? "relancée" : "relancé"} ×{preview.relanceCount}. Un appel vaut parfois mieux :{" "}
              {preview.phone}.
            </EnvoiNote>
          )}
        </>
      }
      html={preview.html}
      previewTitle="Aperçu de l'email de relance"
      placeholder="Ex. : suite à notre échange d'hier, voici le récapitulatif…"
      sendLabel="Envoyer la relance"
      sending={sending}
      onSend={onSend}
      onCancel={onCancel}
    />
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
