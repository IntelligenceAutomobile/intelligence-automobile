// Démonstration /demoprooo — Fiche client (CRM).
// Réplique EN LECTURE SEULE de la fiche client du back-office : coordonnées, devis
// liés et timeline d'interactions par opportunité. Alimentée par des données
// d'exemple figées (src/lib/demo-data.ts) : aucun accès base, aucun fetch.
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft, ChevronRight, FileText, Mail, Phone, Building2, Pencil, Trash2, Plus,
} from "lucide-react";
import {
  PIPELINE_STAGES, type Stage,
} from "@/lib/crm";
import { STATUS_LABEL, formatDateFr, type QuoteStatus } from "@/lib/devis";
import { T, Tag, AdminPage, PageHeader, SectionCard, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { getDemoClient, getDemoVehicles, getDemoQuotes } from "@/lib/demo-data";
import { DEMO_BASE } from "../../demo";
import { DemoAction } from "../../DemoAction";
import LeadBlock, { type LeadLite } from "./LeadBlock";

const QUOTE_TONE: Record<string, "muted" | "accent" | "success" | "danger"> = {
  brouillon: "muted",
  envoye: "accent",
  accepte: "success",
  refuse: "danger",
};

export default async function DemoClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getDemoClient(id);
  if (!client) notFound();

  const vehicles = getDemoVehicles();
  const vehicleLabel = new Map<string, string>();
  vehicles.forEach((v) => vehicleLabel.set(v.id, `${v.make} ${v.model} (${v.year})`));

  const quotes = getDemoQuotes()
    .filter((q) => q.clientId === client.id)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Leads triés anti-chronologiquement, événements idem, sérialisés pour le client.
  const leads: LeadLite[] = [...client.leads]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((l) => ({
      id: l.id,
      title: l.title,
      stage: l.stage,
      source: l.source,
      vehicleId: l.vehicleId,
      vehicleLabel: l.vehicleId ? vehicleLabel.get(l.vehicleId) ?? null : null,
      budget: l.budget,
      events: [...l.events]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((e) => ({ id: e.id, type: e.type, content: e.content, author: e.author, createdAt: e.createdAt.toISOString() })),
    }));

  const activeLeads = client.leads.filter((l) => PIPELINE_STAGES.includes(l.stage as Stage)).length;

  return (
    <AdminPage>
      <Link
        href={`${DEMO_BASE}/clients`}
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        <ChevronLeft size={13} />
        Clients & leads
      </Link>

      <PageHeader
        title={client.company || client.name}
        subtitle={client.company ? client.name : `Client depuis le ${client.createdAt.toLocaleDateString("fr-FR")}`}
        action={
          <div className="flex items-center gap-3">
            <DemoAction className={btnGhostClass} style={btnGhostStyle}>
              <Plus size={13} />
              Lead
            </DemoAction>
            <DemoAction className={btnPrimaryClass} style={btnPrimaryStyle}>
              <FileText size={13} />
              Créer un devis
            </DemoAction>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Colonne coordonnées */}
        <div className="space-y-4">
          <SectionCard title="Coordonnées">
            <ul className="space-y-2.5 text-sm" style={{ color: T.textDim }}>
              {client.company && (
                <li className="flex items-center gap-2.5">
                  <Building2 size={14} style={{ color: T.muted, flexShrink: 0 }} />
                  {client.company}
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Mail size={14} style={{ color: T.muted, flexShrink: 0 }} />
                {client.email || <span style={{ color: T.muted }}>Pas d&apos;email</span>}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} style={{ color: T.muted, flexShrink: 0 }} />
                {client.phone || <span style={{ color: T.muted }}>Pas de téléphone</span>}
              </li>
            </ul>
            {activeLeads > 0 && (
              <div className="pt-1">
                <Tag tone="accent">{activeLeads} lead{activeLeads > 1 ? "s" : ""} actif{activeLeads > 1 ? "s" : ""}</Tag>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <DemoAction
                className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
                style={{ color: T.accent }}
              >
                <Pencil size={12} />
                Modifier
              </DemoAction>
              <DemoAction
                className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
                style={{ color: T.muted }}
              >
                <Trash2 size={12} />
                Supprimer
              </DemoAction>
            </div>
          </SectionCard>

          <SectionCard title={`Devis (${quotes.length})`}>
            {quotes.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>Aucun devis lié.</p>
            ) : (
              <ul>
                {quotes.map((q, i) => (
                  <li key={q.id}>
                    <Link
                      href={`${DEMO_BASE}/devis/${q.id}`}
                      className="flex items-center gap-3 py-2 transition-colors hover:text-[#F0F5FF]"
                      style={{ color: T.textDim, borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}
                    >
                      <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>{q.number}</span>
                      <span className="text-xs hidden sm:inline" style={{ color: T.muted }}>{formatDateFr(q.issueDate)}</span>
                      <span className="ml-auto">
                        <Tag tone={QUOTE_TONE[q.status] ?? "muted"}>
                          {STATUS_LABEL[q.status as QuoteStatus] ?? q.status}
                        </Tag>
                      </span>
                      <ChevronRight size={13} style={{ color: T.muted }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Colonne leads + timeline */}
        <div className="lg:col-span-2 space-y-4">
          {leads.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
              Aucune opportunité pour ce client.
            </div>
          ) : (
            leads.map((lead) => <LeadBlock key={lead.id} lead={lead} />)
          )}
        </div>
      </div>
    </AdminPage>
  );
}
