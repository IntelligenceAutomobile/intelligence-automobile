// SAV & garanties de la démonstration /demopro (lecture seule).
// Reproduit la liste des garanties vendues du back-office, triée par échéance
// et alimentée par des données d'exemple figées (src/lib/demo-data.ts).
// Le bouton « Nouvelle garantie » affiche un simple toast. Aucun accès base.
import { Plus, ShieldCheck, Car, AlertTriangle } from "lucide-react";
import { formatDateFr } from "@/lib/devis";
import {
  warrantyStatus, daysUntil, STATUS_LABEL, STATUS_TONE, WARRANTY_TYPE_LABEL,
  type WarrantyType,
} from "@/lib/warranties";
import { T, TONE, Tag, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoWarranties } from "@/lib/demo-data";
import DemoActionButton from "../DemoActionButton";

export default function DemoGarantiesPage() {
  const today = new Date().toISOString().slice(0, 10);

  const warranties = getDemoWarranties()
    .map((w) => ({
      ...w,
      status: warrantyStatus(w.endDate, today),
      daysUntil: daysUntil(w.endDate, today),
    }))
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  const expiring = warranties.filter((w) => w.status === "expiring").length;

  return (
    <AdminPage>
      <PageHeader
        title="Garanties"
        subtitle={`${warranties.length} garantie${warranties.length > 1 ? "s" : ""}${expiring > 0 ? ` · ${expiring} à échéance` : ""}.`}
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle garantie
          </DemoActionButton>
        }
      />

      {/* Bandeau garanties à échéance sous 60 jours */}
      {expiring > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-3 mb-5"
          style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}
        >
          <ShieldCheck size={16} style={{ color: T.warning }} />
          <span className="text-sm" style={{ color: T.textDim }}>
            <span className="font-semibold" style={{ color: T.warning }}>
              {expiring} garantie{expiring > 1 ? "s" : ""} à échéance
            </span>
            {" sous 60 jours · pensez à recontacter le client"}
          </span>
        </div>
      )}

      {warranties.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} />
            Ajoutez une garantie à chaque vente pour suivre les échéances.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {warranties.map((w, i) => {
            const tone = TONE[STATUS_TONE[w.status]];
            return (
              <div
                key={w.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <span className="min-w-0 sm:w-52">
                  <span className="text-sm font-medium block truncate" style={{ color: T.text }}>{w.clientName}</span>
                  {w.vehicleLabel && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] truncate" style={{ color: T.muted }}>
                      <Car size={11} />
                      {w.vehicleLabel}
                    </span>
                  )}
                </span>
                <Tag tone="muted">{WARRANTY_TYPE_LABEL[w.type as WarrantyType] ?? w.type}</Tag>
                <span className="text-[12px]" style={{ color: T.textDim }}>
                  {formatDateFr(w.startDate)} → {formatDateFr(w.endDate)}
                </span>
                <span className="flex items-center gap-3 ml-auto flex-shrink-0">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
                    style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}
                  >
                    {w.status === "expiring" && <AlertTriangle size={11} />}
                    {STATUS_LABEL[w.status]}
                    {w.status === "expiring" && ` · ${w.daysUntil} j`}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
