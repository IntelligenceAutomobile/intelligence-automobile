"use client";

// Fiche dossier d'immatriculation : qualification fiscale, checklist de pièces,
// échéances légales, suivi SIV et versement au coffre-fort.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, AlertTriangle, Archive, Calculator, ListChecks, CalendarClock, Send, Printer, FileDown } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import {
  REG_TYPES, REG_TYPE_LABEL, REG_STATUSES, REG_STATUS_LABEL, REG_STATUS_TONE,
  VAT_REGIME_LABEL, assessVat, checklistFor, checklistProgress, deadlines,
  ARCHIVE_RETENTION_YEARS, type RegStatus, type RegType, type VatRegime,
} from "@/lib/immatriculation";
import { T, TONE, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../../ui";
import { useToast } from "../../toast";

export type Dossier = {
  id: string;
  reference: string;
  type: RegType;
  status: RegStatus;
  vehicleLabel: string;
  vin: string;
  plateForeign: string;
  plateFinal: string;
  countryOrigin: string;
  firstRegDate: string;
  mileageKm: number;
  holderName: string;
  holderAddress: string;
  acquiredOn: string;
  deliveredOn: string;
  registeredOn: string;
  vatRegime: VatRegime;
  purchaseCents: number;
  quitusRef: string;
  quitusDate: string;
  sivRef: string;
  archiveRef: string;
  archivedAt: string;
  documents: string[];
  notes: string;
};

const TVA_RATE = 0.2;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      {children}
    </div>
  );
}

export default function DossierClient({ dossier, today }: { dossier: Dossier; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(dossier);

  const set = <K extends keyof Dossier>(key: K, value: Dossier[K]) => setF((x) => ({ ...x, [key]: value }));

  // Qualification fiscale : recalculée à chaque frappe, sans écraser un choix manuel.
  const vat = useMemo(
    () => (f.firstRegDate && f.acquiredOn ? assessVat(f.firstRegDate, f.mileageKm, f.acquiredOn) : null),
    [f.firstRegDate, f.mileageKm, f.acquiredOn],
  );
  const regime: VatRegime = vat ? vat.regime : f.vatRegime;

  const specs = useMemo(() => checklistFor(f.type, regime), [f.type, regime]);
  const progress = useMemo(() => checklistProgress(specs, f.documents), [specs, f.documents]);
  const dls = useMemo(
    () => deadlines(
      { type: f.type, deliveredOn: f.deliveredOn, acquiredOn: f.acquiredOn, registeredOn: f.registeredOn, quitusDate: f.quitusDate },
      today,
    ),
    [f.type, f.deliveredOn, f.acquiredOn, f.registeredOn, f.quitusDate, today],
  );

  function toggleDoc(key: string) {
    setF((x) => ({
      ...x,
      documents: x.documents.includes(key) ? x.documents.filter((k) => k !== key) : [...x.documents, key],
    }));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/immatriculations/${dossier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, vatRegime: regime }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Dossier enregistré.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué.");
    } finally {
      setBusy(false);
    }
  }

  // Panneau de recopie : les champs tels que le portail SIV les attend.
  const antsFields: { label: string; value: string }[] = [
    { label: "VIN", value: f.vin },
    { label: "Immatriculation d'origine", value: f.plateForeign },
    { label: "1re mise en circulation", value: f.firstRegDate ? formatDateFr(f.firstRegDate) : "" },
    { label: "Kilométrage", value: f.mileageKm > 0 ? `${formatNumber(f.mileageKm)} km` : "" },
    { label: "Titulaire", value: f.holderName },
    { label: "Adresse", value: f.holderAddress },
    { label: "Date d'acquisition", value: f.acquiredOn ? formatDateFr(f.acquiredOn) : "" },
    { label: "Référence quitus", value: f.quitusRef },
  ].filter((x) => x.value);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copié.`);
    } catch {
      toast.error("La copie a échoué.");
    }
  }

  async function copyAll() {
    await copy(antsFields.map((x) => `${x.label} : ${x.value}`).join("\n"), "Dossier");
  }

  const statusTone = TONE[REG_STATUS_TONE[f.status]];

  return (
    <AdminPage>
      <PageHeader
        title={f.vehicleLabel || f.reference}
        subtitle={`${f.reference} · ${REG_TYPE_LABEL[f.type]}${f.countryOrigin ? ` · ${f.countryOrigin}` : ""}`}
        action={
          <span className="flex items-center gap-3">
            <Link href="/admin/immatriculations" className={btnGhostClass} style={btnGhostStyle}>
              <ArrowLeft size={14} />
              Retour
            </Link>
            <a href={`/api/admin/immatriculations/${dossier.id}/mandat`} target="_blank" rel="noreferrer" className={btnGhostClass} style={btnGhostStyle}>
              <FileDown size={14} />
              Cerfa 13757
            </a>
            <a href={`/api/admin/immatriculations/${dossier.id}/cerfa-13750`} target="_blank" rel="noreferrer" className={btnGhostClass} style={btnGhostStyle}>
              <FileDown size={14} />
              Cerfa 13750
            </a>
            <Link href={`/admin/immatriculations/${dossier.id}/imprimer`} className={btnGhostClass} style={btnGhostStyle}>
              <Printer size={14} />
              Récapitulatif
            </Link>
            <button type="button" onClick={save} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : "Enregistrer"}
            </button>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Qualification fiscale">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="1re mise en circulation">
                <input type="date" value={f.firstRegDate} onChange={(e) => set("firstRegDate", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
              <Field label="Kilométrage à l'acquisition">
                <input type="number" min={0} value={f.mileageKm} onChange={(e) => set("mileageKm", parseInt(e.target.value, 10) || 0)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
              <Field label="Prix d'achat (€)">
                <input
                  type="number"
                  min={0}
                  value={Math.round(f.purchaseCents / 100)}
                  onChange={(e) => set("purchaseCents", (parseInt(e.target.value, 10) || 0) * 100)}
                  className="px-4 py-3 text-sm outline-none w-full"
                  style={fieldStyle}
                />
              </Field>
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
                      TVA due en France : <strong style={{ color: T.text }}>{formatEuroCents(Math.round(f.purchaseCents * TVA_RATE))}</strong>{" "}
                      à régler au service des impôts avant la délivrance du quitus.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: T.muted }}>
                Renseignez la 1re mise en circulation et la date d&apos;acquisition pour obtenir le régime fiscal.
              </p>
            )}
          </SectionCard>

          <SectionCard title={`Pièces du dossier · ${progress.done}/${progress.total}`}>
            <div style={{ border: `1px solid ${T.border}` }}>
              {specs.map((s, i) => {
                const checked = f.documents.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleDoc(s.key)}
                    className="flex items-start gap-3 w-full text-left px-4 py-3 transition-colors hover:bg-[rgba(107,159,238,0.05)]"
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
                  </button>
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
              <Field label="Référence quitus fiscal">
                <input value={f.quitusRef} onChange={(e) => set("quitusRef", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
              <Field label="Date du quitus">
                <input type="date" value={f.quitusDate} onChange={(e) => set("quitusDate", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
              <Field label="Numéro de dossier SIV">
                <input value={f.sivRef} onChange={(e) => set("sivRef", e.target.value)} className="px-4 py-3 text-sm outline-none w-full font-mono" style={fieldStyle} />
              </Field>
              <Field label="Immatriculation française obtenue">
                <input value={f.plateFinal} onChange={(e) => set("plateFinal", e.target.value.toUpperCase())} placeholder="AB-123-CD" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
              <Field label="Date d'immatriculation">
                <input type="date" value={f.registeredOn} onChange={(e) => set("registeredOn", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
              <Field label="Titulaire">
                <input value={f.holderName} onChange={(e) => set("holderName", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
            </div>
            <Field label="Adresse du titulaire">
              <input value={f.holderAddress} onChange={(e) => set("holderAddress", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </Field>
            <Field label="Notes">
              <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="px-4 py-3 text-sm outline-none w-full resize-y" style={fieldStyle} />
            </Field>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="État du dossier">
            <Field label="Statut">
              <select value={f.status} onChange={(e) => set("status", e.target.value as RegStatus)} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {REG_STATUSES.map((s) => <option key={s} value={s}>{REG_STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
            <span
              className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
              style={{ backgroundColor: statusTone.bg, border: `1px solid ${statusTone.bd}`, color: statusTone.fg }}
            >
              {REG_STATUS_LABEL[f.status]}
            </span>
            <Field label="Type de dossier">
              <select value={f.type} onChange={(e) => set("type", e.target.value as RegType)} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {REG_TYPES.map((t) => <option key={t} value={t}>{REG_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
          </SectionCard>

          <SectionCard title="Échéances">
            {dls.length === 0 ? (
              <p className="text-[12px]" style={{ color: T.muted }}>
                Renseignez les dates d&apos;acquisition et de livraison pour suivre les délais.
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
                      <button type="button" onClick={() => copy(x.value, x.label)} aria-label={`Copier ${x.label}`} className="p-1 transition-colors hover:text-[#6B9FEE]" style={{ color: T.muted }}>
                        <Copy size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={copyAll} className={btnGhostClass} style={btnGhostStyle}>
                  <Send size={13} />
                  Copier tout le dossier
                </button>
              </>
            )}
          </SectionCard>

          <SectionCard title="Coffre-fort numérique">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Référence de versement">
                <input value={f.archiveRef} onChange={(e) => set("archiveRef", e.target.value)} className="px-4 py-3 text-sm outline-none w-full font-mono" style={fieldStyle} />
              </Field>
              <Field label="Date de versement">
                <input type="date" value={f.archivedAt} onChange={(e) => set("archivedAt", e.target.value)} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
              </Field>
            </div>
            <div className="flex items-start gap-2.5 px-3 py-2.5" style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}` }}>
              {f.archiveRef ? (
                <Archive size={13} style={{ color: TONE.warning.fg, flexShrink: 0, marginTop: 2 }} />
              ) : (
                <AlertTriangle size={13} style={{ color: TONE.warning.fg, flexShrink: 0, marginTop: 2 }} />
              )}
              <p className="text-[11px] leading-relaxed" style={{ color: T.textDim }}>
                {f.archiveRef
                  ? `Dossier versé au coffre-fort certifié, conservé ${ARCHIVE_RETENTION_YEARS} ans à compter de l'immatriculation.`
                  : `Une fois l'immatriculation obtenue, versez le dossier complet au coffre-fort certifié NF Z 42-020 et notez ici la référence. C'est elle qui fait foi en cas de contrôle, la conservation légale étant de ${ARCHIVE_RETENTION_YEARS} ans.`}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPage>
  );
}
