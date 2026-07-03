"use client";

// Dialog de confirmation modal du back-office (actions destructives).
import { useEffect, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { T, TONE, btnGhostClass, btnGhostStyle } from "./ui";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              backgroundColor: TONE.danger.bg,
              border: `1px solid ${TONE.danger.bd}`,
              color: TONE.danger.fg,
            }}
          >
            <AlertTriangle size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium" style={{ color: T.text }}>
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-1.5" style={{ color: T.muted }}>
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} disabled={busy} autoFocus className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-5 py-3 transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: T.danger, color: T.bg }}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
