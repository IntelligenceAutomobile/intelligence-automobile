"use client";

// ────────────────────────────────────────────────────────────────────────────
// Coquille d'aperçu avant envoi, partagée par le centre de relances et la
// demande d'avis : aucun email ne part sans que l'utilisateur ait lu ce que
// reçoit le client.
//
// Elle porte le cadre, l'en-tête, le rappel du destinataire et de l'objet,
// l'aperçu en direct et le champ de message personnel. Ce qui distingue un
// écran de l'autre passe en propriétés : le titre, les mentions posées
// au-dessus de l'aperçu, le libellé du bouton.
//
// Le message personnel s'insère dans le conteneur marqué data-perso, à la même
// place que côté serveur et échappé pareil : ce qui s'affiche est ce qui part.
// ────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Send, Loader2 } from "lucide-react";
import { escapeHtml } from "@/lib/html";
import { T, btnGhostClass, btnGhostStyle } from "./ui";

// L'erreur porte le statut HTTP : un 502 (email pas parti) garde le dialogue
// ouvert avec le message tapé, un 409 (document plus éligible) le ferme.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function EnvoiDialog({
  ariaLabel,
  title,
  subtitle,
  badge,
  to,
  subject,
  notes,
  html,
  previewTitle,
  placeholder,
  sendLabel,
  sending,
  onSend,
  onCancel,
}: {
  ariaLabel: string;
  title: string;
  subtitle: string;
  /** Étiquette calée à droite de l'en-tête (palier de relance, par exemple). */
  badge?: ReactNode;
  to: string;
  subject: string;
  /** Mentions posées entre l'en-tête et l'aperçu. */
  notes?: ReactNode;
  /** Corps de l'email, tel que le serveur le construira. */
  html: string;
  previewTitle: string;
  placeholder: string;
  sendLabel: string;
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

  // L'aperçu reflète la saisie en direct : le message personnel s'insère au
  // même endroit que côté serveur (conteneur data-perso), échappé pareil.
  const liveHtml = useMemo(() => {
    const perso = message
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `<p>${escapeHtml(l)}</p>`)
      .join("");
    return html.replace("<div data-perso></div>", `<div data-perso>${perso}</div>`);
  }, [html, message]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={sending ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
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
              {title}
            </h2>
            <p className="text-sm mt-0.5 truncate" style={{ color: T.muted }}>
              {subtitle}
            </p>
          </div>
          {badge && <span className="ml-auto flex-shrink-0">{badge}</span>}
        </div>

        <div className="text-[12px] mb-3 space-y-1" style={{ color: T.textDim }}>
          <div className="truncate">
            <span style={{ color: T.muted }}>Destinataire</span> {to}
          </div>
          <div className="truncate">
            <span style={{ color: T.muted }}>Objet</span> {subject}
          </div>
        </div>

        {notes}

        <iframe
          sandbox=""
          srcDoc={liveHtml}
          title={previewTitle}
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
            placeholder={placeholder}
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
            {sendLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mention encadrée au-dessus de l'aperçu, en avertissement ou en simple note. */
export function EnvoiNote({ tone = "muted", children }: { tone?: "warning" | "muted"; children: ReactNode }) {
  const style =
    tone === "warning"
      ? { backgroundColor: "rgba(240,180,90,0.10)", border: "1px solid rgba(240,180,90,0.38)", color: T.warning }
      : { border: `1px solid ${T.border}`, color: T.muted };
  return (
    <div className="text-[12px] px-3 py-2 mb-3" style={style}>
      {children}
    </div>
  );
}
