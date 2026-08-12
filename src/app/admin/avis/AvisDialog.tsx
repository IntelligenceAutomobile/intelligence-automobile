"use client";

// Aperçu de l'invitation à laisser un avis. Même coquille que l'aperçu des
// relances (../EnvoiDialog) : le corps affiché vient du serveur, et le message
// personnel s'y insère en direct, au même endroit qu'à l'arrivée.
import { formatDateFr } from "@/lib/devis";
import { AVIS_REGLE_GOOGLE } from "@/lib/avis";
import { EnvoiDialog, EnvoiNote } from "../EnvoiDialog";

export type AvisTarget = { id: string; name: string };

export type AvisPreview = {
  to: string;
  subject: string;
  html: string;
  /** Véhicule nommé dans le message, vide quand il reste inconnu. */
  vehicle: string;
  /** Motif d'éligibilité et sa date, rappelés au-dessus de l'aperçu. */
  reason: string;
  reasonDate: string;
  /** Deuxième envoi : le ton se choisit en connaissance. */
  rappel?: boolean;
};

export function AvisDialog({
  target,
  preview,
  sending,
  onSend,
  onCancel,
}: {
  target: AvisTarget;
  preview: AvisPreview;
  sending: boolean;
  onSend: (message: string) => void;
  onCancel: () => void;
}) {
  return (
    <EnvoiDialog
      ariaLabel="Relire l'invitation avant envoi"
      title={preview.rappel ? "Relire le rappel avant d'envoyer" : "Relire avant d'envoyer"}
      subtitle={
        preview.reasonDate
          ? `${target.name} · ${preview.reason} le ${formatDateFr(preview.reasonDate)}`
          : target.name
      }
      to={preview.to}
      subject={preview.subject}
      notes={
        <>
          {preview.rappel && (
            <EnvoiNote tone="warning">
              Deuxième message vers ce client : c&apos;est le rappel, et le dernier. Un mot personnel fait souvent la
              différence.
            </EnvoiNote>
          )}
          {preview.vehicle ? (
            <EnvoiNote>
              Le message nomme la voiture : « votre {preview.vehicle} ».
            </EnvoiNote>
          ) : (
            <EnvoiNote tone="warning">
              Le véhicule de ce client reste à rattacher : le message parle de « votre nouveau véhicule ».
            </EnvoiNote>
          )}
          <EnvoiNote>{AVIS_REGLE_GOOGLE}</EnvoiNote>
        </>
      }
      html={preview.html}
      previewTitle="Aperçu de l'invitation à laisser un avis"
      placeholder="Ex. : merci encore pour votre accueil lors de la remise des clés…"
      sendLabel={preview.rappel ? "Envoyer le rappel" : "Envoyer l'invitation"}
      sending={sending}
      onSend={onSend}
      onCancel={onCancel}
    />
  );
}
