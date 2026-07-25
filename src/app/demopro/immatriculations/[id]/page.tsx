// Fiche d'un dossier d'immatriculation (SIV) de la démonstration /demopro.
// Reproduit la fiche du back-office en lecture seule : qualification fiscale,
// checklist des pièces, échéances légales et recopie SIV. Alimentée par des
// données d'exemple figées (src/lib/demo-data.ts). Aucun accès base, aucune
// action réelle : les boutons affichent un simple toast.
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, AlertTriangle, Calculator, ListChecks, CalendarClock, Send, Printer, FileDown } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatDateFr } from "@/lib/devis";
import {
  REG_TYPE_LABEL, REG_STATUS_LABEL, REG_STATUS_TONE, VAT_REGIME_LABEL,
  assessVat, checklistFor, checklistProgress, deadlines, ARCHIVE_RETENTION_YEARS,
  type RegStatus, type VatRegime,
} from "@/lib/immatriculation";
import { T, TONE, AdminPage, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { DemoPageHeader } from "@/app/demopro/DemoPageHeader";
import { getDemoRegistrations } from "@/lib/demo-data";
import { DEMO_BASE } from "../../demo";
import DemoActionButton from "@/app/demopro/DemoActionButton";

// Champ en lecture seule, à l'aspect des champs de saisie de la vraie fiche.
function ReadField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      <div className={`px-4 py-3 text-sm ${mono ? "font-mono" : ""}`} style={{ ...fieldStyle, color: value ? T.text : T.muted }}>
        {value || "—"}
      </div>
    </div>
  );
}

export default async function DemoDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getDemoRegistrations().find((x) => x.id === id);
  if (!r) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const status = r.status as RegStatus;
  const statusTone = TONE[REG_STATUS_TONE[status]];

  // Qualification fiscale recalculée depuis la 1re mise en circulation et la date
  // d'acquisition ; à défaut, on retombe sur le régime enregistré.
  const vat = r.firstRegDate && r.acquiredOn ? assessVat(r.firstRegDate, r.mileageKm, r.acquiredOn) : null;
  const regime: VatRegime = vat ? vat.regime : r.vatRegime;

  const specs = checklistFor(r.type, regime);
  const progress = checklistProgress(specs, r.documents);
  const dls = deadlines(
    { type: r.type, deliveredOn: r.deliveredOn, acquiredOn: r.acquiredOn, registeredOn: r.registeredOn, quitusDate: r.quitusDate },
    today,
  );

  // Panneau de recopie : les champs tels que le portail SIV les attend.
  const antsFields: { label: string; value: string }[] = [
    { label: "VIN", value: r.vin },
    { label: "Immatriculation d'origine", value: r.plateForeign },
    { label: "1re mise en circulation", value: r.firstRegDate ? formatDateFr(r.firstRegDate) : "" },
    { label: "Kilométrage", value: r.mileageKm > 0 ? `${formatNumber(r.mileageKm)} km` : "" },
    { label: "Titulaire", value: r.holderName },
    { label: "Adresse", value: r.holderAddress },
    { label: "Date d'acquisition", value: r.acquiredOn ? formatDateFr(r.acquiredOn) : "" },
  ].filter((x) => x.value);

  return (
    <AdminPage>
      <DemoPageHeader
        title={r.vehicleLabel || r.reference}
        subtitle={`${r.reference} · ${REG_TYPE_LABEL[r.type]}${r.countryOrigin ? ` · ${r.countryOrigin}` : ""}`}
        action={
          <span className="flex flex-wrap items-center justify-end gap-3">
            <Link href={`${DEMO_BASE}/immatriculations`} className={btnGhostClass} style={btnGhostStyle}>
              <ArrowLeft size={14} />
              Retour
            </Link>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <FileDown size={14} />
              Cerfa 13757
            </DemoActionButton>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <FileDown size={14} />
              Cerfa 13750
            </DemoActionButton>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <Printer size={14} />
              Récapitulatif
            </DemoActionButton>
            <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
              Enregistrer
            </DemoActionButton>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Qualification fiscale">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadField label="1re mise en circulation" value={r.firstRegDate ? formatDateFr(r.firstRegDate) : ""} />
              <ReadField label="Kilométrage à l'acquisition" value={r.mileageKm > 0 ? `${formatNumber(r.mileageKm)} km` : ""} />
            </div>

            {vat ? (
              <div
                className="flex items-start gap-3 px-4 py-3.5"
                style={{
                  backgroundColor: vat.regime === "neuf" ? TONE.warning.bg : TONE.success.bg,
                  border: `1px solid ${vat.regime === "neuf" ? TONE.warning.bd : TONE.success.bd}`,
                }}
              >
                <Calculator size={15} style={{ color: vat.regime === "neuf" ? TONE.warning.fg : TONE.success.fg, flexShrink: 0, marginTop: 2 }} />
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: vat.regime === "neuf" ? TONE.warning.fg : TONE.success.fg }}>
                    {VAT_REGIME_LABEL[vat.regime]}
                  </div>
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: T.textDim }}>{vat.reason}</p>
                  {vat.vatDueInFrance && (
                    <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: T.textDim }}>
                      TVA de 20 % due en France, à régler au service des impôts avant la délivrance du quitus.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: T.muted }}>
                La 1re mise en circulation et la date d&apos;acquisition donnent le régime fiscal.
              </p>
            )}
          </SectionCard>

          <SectionCard title={`Pièces du dossier · ${progress.done}/${progress.total}`}>
            <div style={{ border: `1px solid ${T.border}` }}>
              {specs.map((s, i) => {
                const checked = r.documents.includes(s.key);
                return (
                  <div
                    key={s.key}
                    className="flex items-start gap-3 w-full text-left px-4 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
                  >
                    <span
                      className="flex items-center justify-center w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{
                        border: `1px solid ${checked ? T.accent : T.border}`,
                        backgroundColor: checked ? T.accent : "transparent",
                      }}
                    >
                      {checked && <Check size={11} style={{ color: T.bg }} />}
                    </span>
                    <span className="min-w-0">
                      <span className="text-sm block" style={{ color: checked ? T.text : T.textDim }}>{s.label}</span>
                      {s.hint && <span className="text-[11px] block mt-0.5" style={{ color: T.muted }}>{s.hint}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            {progress.complete ? (
              <p className="inline-flex items-center gap-2 text-[12px]" style={{ color: TONE.success.fg }}>
                <ListChecks size={13} />
                Dossier complet, prêt à télétransmettre.
              </p>
            ) : (
              <p className="text-[12px]" style={{ color: T.muted }}>
                {progress.total - progress.done} pièce{progress.total - progress.done > 1 ? "s" : ""} à réunir avant la télétransmission.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Suivi administratif">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadField label="Date du quitus" value={r.quitusDate ? formatDateFr(r.quitusDate) : ""} />
              <ReadField label="Immatriculation française obtenue" value={r.plateFinal} />
              <ReadField label="Date d'immatriculation" value={r.registeredOn ? formatDateFr(r.registeredOn) : ""} />
              <ReadField label="Titulaire" value={r.holderName} />
            </div>
            <ReadField label="Adresse du titulaire" value={r.holderAddress} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="État du dossier">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Statut</label>
              <span
                className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
                style={{ backgroundColor: statusTone.bg, border: `1px solid ${statusTone.bd}`, color: statusTone.fg }}
              >
                {REG_STATUS_LABEL[status]}
              </span>
            </div>
            <ReadField label="Type de dossier" value={REG_TYPE_LABEL[r.type]} />
            <ReadField label="Régime fiscal" value={VAT_REGIME_LABEL[regime]} />
          </SectionCard>

          <SectionCard title="Échéances">
            {dls.length === 0 ? (
              <p className="text-[12px]" style={{ color: T.muted }}>
                Les dates d&apos;acquisition et de livraison alimentent le suivi des délais.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {dls.map((d) => {
                  const tone = TONE[d.tone];
                  return (
                    <li key={d.key} className="flex items-start gap-2.5">
                      <CalendarClock size={13} style={{ color: tone.fg, flexShrink: 0, marginTop: 2 }} />
                      <span className="min-w-0">
                        <span className="text-[12.5px] block" style={{ color: T.textDim }}>{d.label}</span>
                        <span className="text-[11px]" style={{ color: tone.fg }}>
                          {formatDateFr(d.date)}
                          {d.key !== "archivage" && (d.daysLeft < 0 ? ` · ${-d.daysLeft} j de retard` : ` · ${d.daysLeft} j`)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recopie SIV">
            {antsFields.length === 0 ? (
              <p className="text-[12px]" style={{ color: T.muted }}>Complétez le dossier pour préparer la saisie.</p>
            ) : (
              <>
                <ul style={{ border: `1px solid ${T.border}` }}>
                  {antsFields.map((x, i) => (
                    <li key={x.label} className="flex items-center gap-2 px-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
                      <span className="min-w-0 flex-1">
                        <span className="text-[10px] tracking-widest uppercase block" style={{ color: T.muted }}>{x.label}</span>
                        <span className="text-[12.5px] block truncate" style={{ color: T.text }}>{x.value}</span>
                      </span>
                      <DemoActionButton className="p-1 transition-colors hover:text-[#6B9FEE]" style={{ color: T.muted }} ariaLabel={`Copier ${x.label}`}>
                        <Copy size={12} />
                      </DemoActionButton>
                    </li>
                  ))}
                </ul>
                <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
                  <Send size={13} />
                  Copier tout le dossier
                </DemoActionButton>
              </>
            )}
          </SectionCard>

          <SectionCard title="Coffre-fort numérique">
            <div className="flex items-start gap-2.5 px-3 py-2.5" style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}` }}>
              <AlertTriangle size={13} style={{ color: TONE.warning.fg, flexShrink: 0, marginTop: 2 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: T.textDim }}>
                Une fois l&apos;immatriculation obtenue, le dossier complet part au coffre-fort certifié NF Z 42-020 : la référence de versement fait foi en cas de contrôle, la conservation légale étant de {ARCHIVE_RETENTION_YEARS} ans.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPage>
  );
}
