"use client";

// Journal des actions du centre de relances : ce qui est parti, quand, et à qui.
// Seul morceau interactif de l'habillage (le dépliage), donc seul fichier
// « client » : le reste de src/app/admin/relances/presentation.tsx se rend aussi
// bien depuis une page serveur, ce qu'est la démonstration publique.
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Ban, Clock, History, Phone, RotateCcw, Send, XCircle, type LucideIcon } from "lucide-react";
import { T } from "../ui";
import { type HistoryView } from "./presentation";

/* ── Journal des actions : ce qui est parti, quand, et à qui ── */
const HISTORY_STYLE: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  email: { icon: Send, label: "Relance envoyée", color: T.success },
  telephone: { icon: Phone, label: "Relance par téléphone", color: T.success },
  report: { icon: Clock, label: "Report", color: T.muted },
  arret: { icon: XCircle, label: "Relances arrêtées", color: T.muted },
  annulation: { icon: RotateCcw, label: "Report annulé", color: T.muted },
  echec: { icon: AlertTriangle, label: "Envoi en échec", color: T.danger },
  bloque: { icon: Ban, label: "Envoi bloqué", color: T.danger },
};

function stamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function HistorySection({ entries }: { entries: HistoryView[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? entries : entries.slice(0, 6);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <History size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Historique des actions</h2>
        <span className="text-xs" style={{ color: T.muted }}>· {entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <div className="p-6 text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Vos relances, reports et appels s&apos;inscriront ici, avec la date, l&apos;heure et le destinataire.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {shown.map((e, i) => {
            const s = HISTORY_STYLE[e.action] ?? { icon: History, label: e.action, color: T.muted };
            const Icon = s.icon;
            return (
              <div
                key={e.id}
                className="relative flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <Link href={e.href} className="absolute inset-0 adm-btn-focus" aria-label={`Ouvrir ${e.number}`} style={{ zIndex: 0 }} />
                <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                  {stamp(e.at)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap" style={{ color: s.color }}>
                  <Icon size={12} />
                  {s.label}
                </span>
                <span className="text-[12px] whitespace-nowrap" style={{ color: T.accent }}>{e.number}</span>
                {e.client && <span className="text-[12px] truncate min-w-0" style={{ color: T.textDim }}>{e.client}</span>}
                {e.detail && <span className="text-[11px] truncate min-w-0" style={{ color: T.muted }}>{e.detail}</span>}
                {e.author && <span className="text-[11px] ml-auto whitespace-nowrap" style={{ color: T.muted }}>{e.author}</span>}
              </div>
            );
          })}
          {entries.length > 6 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="adm-btn-focus w-full px-4 py-2.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
              style={{ borderTop: `1px solid ${T.border}`, color: T.textDim }}
            >
              {open
                ? "Réduire"
                : entries.length - 6 === 1
                  ? "Afficher l'action précédente"
                  : `Afficher les ${entries.length - 6} actions précédentes`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
