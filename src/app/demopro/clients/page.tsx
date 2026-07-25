// Démonstration /demopro — Clients & leads (CRM).
// Réplique EN LECTURE SEULE du pipeline kanban + carnet clients du back-office.
// Alimentée par des données d'exemple figées (src/lib/demo-data.ts) : aucun accès
// base, aucun fetch. Les boutons d'action affichent un toast au lieu d'agir.
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Check, X, Car, Banknote } from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  PIPELINE_STAGES, STAGE_LABEL, STAGE_TONE, SOURCE_LABEL,
  type Stage, type Source,
} from "@/lib/crm";
import { T, TONE, Tag, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoVehicles, getDemoClients, getDemoLeads, type DemoLead, type DemoClient } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import { DemoAction } from "../DemoAction";
import ClientsCarnet, { type CarnetRow } from "./ClientsCarnet";

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return `il y a ${Math.floor(s / 86400)} j`;
}

// Dernière activité d'un lead = date la plus récente entre sa création et ses événements.
function lastActivity(lead: DemoLead): Date {
  let t = lead.createdAt.getTime();
  for (const e of lead.events) t = Math.max(t, e.createdAt.getTime());
  return new Date(t);
}

/* ── Carte lead du kanban (lecture seule) ── */
function LeadCard({
  lead, client, vehicleLabel, atStart, atEnd,
}: {
  lead: DemoLead;
  client: DemoClient;
  vehicleLabel?: string;
  atStart: boolean;
  atEnd: boolean;
}) {
  return (
    <div className="adm-card p-3.5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      <Link href={`${DEMO_BASE}/clients/${client.id}`} className="block min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>
          {client.company || client.name}
        </div>
        <div className="text-[11px] truncate mt-0.5" style={{ color: T.muted }}>
          {lead.title || SOURCE_LABEL[lead.source as Source] || lead.source}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px]" style={{ color: T.textDim }}>
          {vehicleLabel && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Car size={11} style={{ color: T.muted, flexShrink: 0 }} />
              <span className="truncate">{vehicleLabel}</span>
            </span>
          )}
          {lead.budget != null && (
            <span className="inline-flex items-center gap-1">
              <Banknote size={11} style={{ color: T.muted }} />
              {formatNumber(lead.budget)} €
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <Tag tone={STAGE_TONE[lead.stage as Stage] ?? "muted"}>{SOURCE_LABEL[lead.source as Source] ?? lead.source}</Tag>
          <span className="text-[10px]" style={{ color: T.muted }}>{timeAgo(lastActivity(lead))}</span>
        </div>
      </Link>
      <div className="flex items-center gap-1 mt-3 pt-2.5" style={{ borderTop: `1px solid ${T.surfaceAlt}` }}>
        <DemoAction
          ariaLabel="Étape précédente"
          disabled={atStart}
          className="p-1.5 transition-colors hover:text-[#F0F5FF] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <ChevronLeft size={14} />
        </DemoAction>
        <DemoAction
          ariaLabel="Étape suivante"
          disabled={atEnd}
          className="p-1.5 transition-colors hover:text-[#F0F5FF] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <ChevronRight size={14} />
        </DemoAction>
        <DemoAction
          className="ml-auto inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-1.5 transition-colors hover:text-[#4ED1A1]"
          style={{ color: T.muted }}
        >
          <Check size={12} />
          Gagné
        </DemoAction>
        <DemoAction
          className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-1.5 transition-colors hover:text-[#FF6B35]"
          style={{ color: T.muted }}
        >
          <X size={12} />
          Perdu
        </DemoAction>
      </div>
    </div>
  );
}

export default function DemoClientsPage() {
  const clients = getDemoClients();
  const leads = getDemoLeads();
  const vehicles = getDemoVehicles();

  const vehicleLabel = new Map<string, string>();
  vehicles.forEach((v) => vehicleLabel.set(v.id, `${v.make} ${v.model}`));

  // Leads groupés par étape du pipeline.
  const byStage = new Map<Stage, typeof leads>();
  PIPELINE_STAGES.forEach((s) => byStage.set(s, []));
  for (const l of leads) {
    const s = l.stage as Stage;
    if (byStage.has(s)) byStage.get(s)!.push(l);
  }

  const gagne = leads.filter((l) => l.stage === "gagne").length;
  const perdu = leads.filter((l) => l.stage === "perdu").length;

  // Lignes du carnet, sérialisées pour la recherche côté client.
  const carnet: CarnetRow[] = [...clients]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      activeLeads: c.leads.filter((l) => PIPELINE_STAGES.includes(l.stage as Stage)).length,
      ago: timeAgo(c.createdAt),
    }));

  return (
    <AdminPage>
      <PageHeader
        title="Clients & leads"
        subtitle={`${clients.length} client${clients.length > 1 ? "s" : ""} · pipeline de vente.`}
        action={
          <DemoAction className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau client
          </DemoAction>
        }
      />

      {/* ── Pipeline ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Pipeline</h2>
        <div className="flex items-center gap-2">
          <Tag tone="success">{gagne} gagné{gagne > 1 ? "s" : ""}</Tag>
          <Tag tone="muted">{perdu} perdu{perdu > 1 ? "s" : ""}</Tag>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {PIPELINE_STAGES.map((stage, stageIdx) => {
          const items = byStage.get(stage) ?? [];
          const tone = TONE[STAGE_TONE[stage]];
          return (
            <div key={stage} className="min-w-0">
              <div
                className="flex items-center gap-2 px-3 py-2.5 mb-3"
                style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}
              >
                <span style={{ width: 8, height: 8, backgroundColor: tone.fg, flexShrink: 0 }} />
                <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.textDim }}>
                  {STAGE_LABEL[stage]}
                </span>
                <span className="text-[11px] ml-auto" style={{ color: T.muted }}>{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div
                    className="p-4 text-center text-[11px]"
                    style={{ border: `1px dashed ${T.border}`, color: T.muted }}
                  >
                    Aucun lead
                  </div>
                ) : (
                  items.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      client={lead.client}
                      vehicleLabel={lead.vehicleId ? vehicleLabel.get(lead.vehicleId) : undefined}
                      atStart={stageIdx <= 0}
                      atEnd={stageIdx >= PIPELINE_STAGES.length - 1}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Carnet clients ── */}
      <ClientsCarnet clients={carnet} />
    </AdminPage>
  );
}
