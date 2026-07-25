"use client";

// Bloc « opportunité » de la fiche client (démonstration, lecture seule).
// Reproduit la timeline d'interactions du back-office. Le sélecteur d'étape et le
// bouton « Ajouter » n'écrivent rien : ils affichent un toast rappelant que la
// démo n'enregistre pas. Aucun fetch.
import { useState } from "react";
import Link from "next/link";
import {
  Mail, MessageSquare, PhoneCall, CalendarClock, ArrowRightLeft, Sparkles, Send,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  STAGES, STAGE_LABEL, STAGE_TONE, SOURCE_LABEL, EVENT_LABEL,
  type Stage, type Source, type EventType,
} from "@/lib/crm";
import { T, Tag, SectionCard, fieldStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { useToast } from "@/app/admin/toast";
import { DEMO_BASE, DEMO_MSG } from "../../demo";

export type LeadEventLite = { id: string; type: string; content: string; author: string; createdAt: string };
export type LeadLite = {
  id: string;
  title: string;
  stage: string;
  source: string;
  vehicleId: string | null;
  vehicleLabel: string | null;
  budget: number | null;
  events: LeadEventLite[];
};

const EVENT_ICON: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  appel: PhoneCall,
  email: Mail,
  rdv: CalendarClock,
  etape: ArrowRightLeft,
  creation: Sparkles,
};

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function LeadBlock({ lead }: { lead: LeadLite }) {
  const toast = useToast();
  const [content, setContent] = useState("");

  return (
    <SectionCard>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate" style={{ color: T.text }}>
            {lead.title || SOURCE_LABEL[lead.source as Source] || "Opportunité"}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]" style={{ color: T.muted }}>
            <span>{SOURCE_LABEL[lead.source as Source] ?? lead.source}</span>
            {lead.vehicleLabel && (
              lead.vehicleId ? (
                <Link
                  href={`${DEMO_BASE}/vehicules/${lead.vehicleId}`}
                  className="transition-colors hover:text-[#F0F5FF]"
                  style={{ color: T.accent }}
                >
                  · {lead.vehicleLabel}
                </Link>
              ) : (
                <span>· {lead.vehicleLabel}</span>
              )
            )}
            {lead.budget != null && <span>· Budget {formatNumber(lead.budget)} €</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tag tone={STAGE_TONE[lead.stage as Stage] ?? "muted"}>{STAGE_LABEL[lead.stage as Stage] ?? lead.stage}</Tag>
          <select
            value={lead.stage}
            onChange={() => toast.info(DEMO_MSG)}
            className="text-xs px-3 py-2 outline-none focus:border-[#6B9FEE] cursor-pointer"
            style={{ ...fieldStyle, width: undefined }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <ul className="space-y-0.5">
        {lead.events.map((e, i) => {
          const Icon = EVENT_ICON[e.type] ?? MessageSquare;
          return (
            <li key={e.id} className="flex items-start gap-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
              <span
                className="flex items-center justify-center w-6 h-6 flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}` }}
              >
                <Icon size={12} style={{ color: e.type === "creation" ? T.accent : T.textDim }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] whitespace-pre-wrap break-words" style={{ color: T.textDim }}>{e.content}</div>
                <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                  {EVENT_LABEL[e.type as EventType] ?? e.type}
                  {e.author ? ` · ${e.author}` : ""} · {timeAgo(e.createdAt)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Ajout d'interaction (inerte en démo) */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          defaultValue="note"
          className="text-xs px-3 py-2.5 outline-none focus:border-[#6B9FEE] cursor-pointer flex-shrink-0"
          style={{ ...fieldStyle, width: undefined }}
        >
          <option value="note">Note</option>
          <option value="appel">Appel</option>
          <option value="email">Email</option>
          <option value="rdv">RDV</option>
        </select>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") toast.info(DEMO_MSG); }}
          placeholder="Ajouter une interaction… (Entrée pour valider)"
          className="px-4 py-2.5 text-sm outline-none focus:border-[#6B9FEE] flex-1"
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={() => toast.info(DEMO_MSG)}
          className={btnGhostClass + " flex-shrink-0"}
          style={btnGhostStyle}
        >
          <Send size={13} />
          Ajouter
        </button>
      </div>
    </SectionCard>
  );
}
