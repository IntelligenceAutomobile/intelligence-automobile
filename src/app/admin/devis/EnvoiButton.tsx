"use client";

// Bouton d'envoi du devis dans l'en-tête de la fiche, avec le suivi de lecture.
// La fenêtre elle-même vit dans EnvoiDialog, partagée avec l'éditeur.
import { useState } from "react";
import { Send, Eye } from "lucide-react";
import { T, TONE, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import EnvoiDialog from "./EnvoiDialog";

export default function EnvoiButton({
  quoteId,
  number,
  clientEmail,
  clientName,
  sentAt,
  viewCount,
  publicToken,
}: {
  quoteId: string;
  number: string;
  clientEmail: string;
  clientName: string;
  sentAt: string;
  viewCount: number;
  publicToken: string | null;
}) {
  const [open, setOpen] = useState(false);
  const dejaEnvoye = !!sentAt;

  return (
    <>
      <div className="flex items-center gap-2">
        {dejaEnvoye && (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase px-2.5 py-1.5 whitespace-nowrap"
            style={{ backgroundColor: TONE.accent.bg, border: `1px solid ${TONE.accent.bd}`, color: T.accent }}
          >
            <Eye size={11} />
            {viewCount > 0 ? `Ouvert ${viewCount} fois` : "En attente de lecture"}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={dejaEnvoye ? btnGhostClass : btnPrimaryClass}
          style={dejaEnvoye ? btnGhostStyle : btnPrimaryStyle}
        >
          <Send size={13} />
          {dejaEnvoye ? "Renvoyer" : "Envoyer au client"}
        </button>
      </div>

      <EnvoiDialog
        open={open}
        quoteId={quoteId}
        number={number}
        clientEmail={clientEmail}
        clientName={clientName}
        publicToken={publicToken}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
