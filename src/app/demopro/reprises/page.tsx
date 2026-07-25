// Reprises / estimations de la démonstration /demopro (lecture seule).
// Reproduit la liste du back-office (src/app/admin/reprises), alimentée par des
// données d'exemple figées (src/lib/demo-data.ts). Chaque reprise est un lead
// de source « reprise » : un véhicule client évalué, devenu lead dans le CRM.
// Aucun accès base, aucune action réelle.
import Link from "next/link";
import { Plus, Car, ChevronRight, Banknote } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { STAGE_LABEL, STAGE_TONE, type Stage } from "@/lib/crm";
import { T, Tag, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoLeads } from "@/lib/demo-data";
import DemoActionButton from "@/app/demopro/DemoActionButton";
import { DEMO_BASE } from "../demo";

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return `il y a ${Math.floor(s / 86400)} j`;
}

export default function DemoReprisesPage() {
  const reprises = getDemoLeads()
    .filter((l) => l.source === "reprise")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <AdminPage>
      <PageHeader
        title="Reprises"
        subtitle={`${reprises.length} estimation${reprises.length > 1 ? "s" : ""} · évaluez un véhicule client, il devient un lead.`}
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle estimation
          </DemoActionButton>
        }
      />

      {reprises.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <Car size={15} />
            Aucune reprise pour l&apos;instant. Cliquez « Nouvelle estimation » pour évaluer le véhicule d&apos;un client.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {reprises.map((r, i) => {
            const clientName = r.client.company || r.client.name;
            // Le détail de l'évaluation (véhicule, état, estimation) vit dans
            // les événements « note » du lead.
            const details = r.events
              .filter((e) => e.type === "note")
              .map((e) => e.content)
              .join("\n\n");
            return (
              <Link
                key={r.id}
                href={`${DEMO_BASE}/clients/${r.clientId}`}
                className="block px-4 py-3.5 transition-colors hover:bg-[#0A1628]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 min-w-0 flex-1">
                    <Car size={15} style={{ color: T.accent, flexShrink: 0 }} />
                    <span className="text-sm truncate" style={{ color: T.text }}>{r.title}</span>
                  </span>
                  <span className="text-xs truncate hidden sm:inline" style={{ color: T.muted, minWidth: 120 }}>{clientName}</span>
                  {r.budget != null && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold flex-shrink-0" style={{ color: T.text }}>
                      <Banknote size={13} style={{ color: T.muted }} />
                      {formatNumber(r.budget)} €
                    </span>
                  )}
                  <Tag tone={STAGE_TONE[r.stage as Stage] ?? "muted"}>{STAGE_LABEL[r.stage as Stage] ?? r.stage}</Tag>
                  <span className="text-[10px] flex-shrink-0" style={{ color: T.muted }}>{timeAgo(r.createdAt)}</span>
                  <ChevronRight size={14} style={{ color: T.muted, flexShrink: 0 }} />
                </div>

                {details && (
                  <p
                    className="text-xs whitespace-pre-line mt-2.5"
                    style={{ color: T.muted, borderLeft: `1px solid ${T.border}`, paddingLeft: 12, marginLeft: 6 }}
                  >
                    {details}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
