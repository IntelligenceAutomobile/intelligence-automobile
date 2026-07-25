// Liste des dossiers d'immatriculation (SIV) de la démonstration /demoprooo.
// Reproduit la liste du back-office en lecture seule, alimentée par des données
// d'exemple figées (src/lib/demo-data.ts). Aucun accès base, aucune action réelle.
import Link from "next/link";
import { Plus, Car, AlertTriangle, ChevronRight, FileBadge } from "lucide-react";
import {
  REG_TYPE_LABEL, REG_STATUS_LABEL, REG_STATUS_TONE, VAT_REGIME_LABEL,
  checklistFor, checklistProgress, deadlines, type RegStatus,
} from "@/lib/immatriculation";
import { T, TONE, Tag, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoRegistrations } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import DemoActionButton from "@/app/demoprooo/DemoActionButton";

export default function DemoImmatriculationsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const rows = getDemoRegistrations().map((r) => {
    // Avancement des pièces et échéance la plus urgente, comme sur la vraie page.
    const progress = checklistProgress(checklistFor(r.type, r.vatRegime), r.documents);
    const open = deadlines(
      { type: r.type, deliveredOn: r.deliveredOn, acquiredOn: r.acquiredOn, registeredOn: r.registeredOn, quitusDate: r.quitusDate },
      today,
    ).filter((d) => d.key !== "archivage" && d.tone !== "success");
    const nextDeadline = open.length > 0 ? [...open].sort((a, b) => a.daysLeft - b.daysLeft)[0] : null;
    return { ...r, status: r.status as RegStatus, done: progress.done, total: progress.total, nextDeadline };
  });

  const late = rows.filter((r) => r.nextDeadline && r.nextDeadline.daysLeft < 0).length;

  return (
    <AdminPage>
      <PageHeader
        title="Immatriculations"
        subtitle={`${rows.length} dossier${rows.length > 1 ? "s" : ""}${late > 0 ? ` · ${late} hors délai` : ""}.`}
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau dossier
          </DemoActionButton>
        }
      />

      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <FileBadge size={15} />
            Ouvrez un dossier dès l&apos;achat du véhicule : les délais courent à partir de l&apos;acquisition.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {rows.map((r, i) => {
            const tone = TONE[REG_STATUS_TONE[r.status]];
            const dl = r.nextDeadline;
            const dlTone = dl ? TONE[dl.tone] : null;
            return (
              <Link
                key={r.id}
                href={`${DEMO_BASE}/immatriculations/${r.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[rgba(107,159,238,0.05)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <span className="min-w-0 sm:w-56">
                  <span className="text-sm font-medium block truncate" style={{ color: T.text }}>{r.vehicleLabel}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] truncate" style={{ color: T.muted }}>
                    <Car size={11} />
                    {r.reference}
                    {r.plateFinal ? ` · ${r.plateFinal}` : ` · ${r.countryOrigin}`}
                    {r.holderName ? ` · ${r.holderName}` : ""}
                  </span>
                </span>

                <Tag tone="muted">{REG_TYPE_LABEL[r.type]}</Tag>
                <Tag tone={r.vatRegime === "neuf" ? "warning" : "muted"}>{VAT_REGIME_LABEL[r.vatRegime]}</Tag>

                <span className="text-[12px]" style={{ color: r.done === r.total ? T.textDim : T.muted }}>
                  Pièces {r.done}/{r.total}
                </span>

                {dl && dlTone && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5"
                    style={{ backgroundColor: dlTone.bg, border: `1px solid ${dlTone.bd}`, color: dlTone.fg }}
                  >
                    {dl.daysLeft < 0 && <AlertTriangle size={11} />}
                    {dl.label} · {dl.daysLeft < 0 ? `${-dl.daysLeft} j de retard` : `${dl.daysLeft} j`}
                  </span>
                )}

                <span className="flex items-center gap-3 ml-auto flex-shrink-0">
                  <span className="text-[10px] tracking-[0.15em] uppercase px-2.5 py-1" style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}>
                    {REG_STATUS_LABEL[r.status]}
                  </span>
                  <ChevronRight size={14} style={{ color: T.muted }} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
