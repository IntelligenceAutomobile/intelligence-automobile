"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/format";
import {
  computeTotals,
  formatEuro,
  kindDefaults,
  PRESTATION_PRESETS,
  type QuoteData,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
  type QuoteStatus,
  type LogoAlign,
  type QuoteKind,
} from "@/lib/devis";
import DevisDocument from "./DevisDocument";
import {
  T,
  SectionCard,
  fieldClass,
  fieldStyle,
  labelClass,
  btnPrimaryClass,
  btnPrimaryStyle,
  btnGhostClass,
  btnGhostStyle,
} from "../ui";

export type VehicleLite = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  transmission: string;
  power: number | null;
};

const A4_W = 793.7; // 210 mm @ 96 dpi

let _seq = 0;
const newId = () => `it_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

const parseAmount = (s: string) => {
  const cleaned = s.replace(/[^\d.,]/g, "").replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

export default function DevisEditor({
  initial,
  vehicles,
  isEdit,
}: {
  initial: QuoteData;
  vehicles: VehicleLite[];
  isEdit: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState<QuoteData>(initial);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(initial.items.map((it) => [it.id, it.unitPrice ? String(it.unitPrice) : ""]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(isEdit ? (initial.id ?? null) : null);
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [prestaOpen, setPrestaOpen] = useState(false);
  const [search, setSearch] = useState("");

  const totals = useMemo(() => computeTotals(q), [q]);

  function update(patch: Partial<QuoteData>) {
    setQ((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }
  function updateBranding(patch: Partial<QuoteData["branding"]>) {
    setQ((prev) => ({ ...prev, branding: { ...prev.branding, ...patch } }));
    setDirty(true);
  }
  // Bascule le type de devis et applique les défauts (TVA + conditions) correspondants.
  function setKind(kind: QuoteKind) {
    const d = kindDefaults(kind);
    setQ((prev) => ({ ...prev, kind, tvaMode: d.tvaMode, paymentTerms: d.paymentTerms }));
    setDirty(true);
  }
  function addPreset(p: { designation: string; detail: string }) {
    const it: QuoteItem = { id: newId(), designation: p.designation, detail: p.detail, qty: 1, unitPrice: 0 };
    setPriceInputs((x) => ({ ...x, [it.id]: "" }));
    setQ((prev) => ({ ...prev, items: [...prev.items, it] }));
    setDirty(true);
    setPrestaOpen(false);
  }
  function updateItem(id: string, patch: Partial<QuoteItem>) {
    setQ((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
    setDirty(true);
  }
  function removeItem(id: string) {
    setQ((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
    setDirty(true);
  }
  function moveItem(id: string, dir: -1 | 1) {
    setQ((prev) => {
      const i = prev.items.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.items.length) return prev;
      const items = [...prev.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...prev, items };
    });
    setDirty(true);
  }
  function addFreeLine() {
    const it: QuoteItem = { id: newId(), designation: "", detail: "", qty: 1, unitPrice: 0 };
    setQ((prev) => ({ ...prev, items: [...prev.items, it] }));
    setDirty(true);
  }
  function addVehicle(v: VehicleLite) {
    const detail = [
      v.year ? `${v.year}` : null,
      v.mileage ? `${formatNumber(v.mileage)} km` : null,
      v.fuel,
      v.transmission,
      v.power ? `${v.power} ch` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const it: QuoteItem = {
      id: newId(),
      designation: `${v.make} ${v.model}`,
      detail,
      qty: 1,
      unitPrice: v.price || 0,
      vehicleId: v.id,
    };
    setPriceInputs((p) => ({ ...p, [it.id]: v.price ? String(v.price) : "" }));
    setQ((prev) => ({
      ...prev,
      items: [...prev.items, it],
      vehicleId: prev.vehicleId ?? v.id,
    }));
    setDirty(true);
    setPickerOpen(false);
    setSearch("");
  }

  async function save(): Promise<string | null> {
    setSaving(true);
    setError("");
    const body = { ...q };
    const url = isEdit ? `/api/admin/devis/${q.id}` : "/api/admin/devis";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur lors de l'enregistrement.");
        setSaving(false);
        return null;
      }
      const saved = await res.json();
      setDirty(false);
      setSaving(false);
      setSavedId(saved.id);
      if (!isEdit) {
        router.push(`/admin/devis/${saved.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
      return saved.id as string;
    } catch {
      setError("Erreur réseau.");
      setSaving(false);
      return null;
    }
  }

  async function saveAndPrint() {
    const id = isEdit ? q.id ?? savedId : await save();
    if (isEdit && dirty) await save();
    const target = isEdit ? q.id : savedId;
    const finalId = target ?? id;
    if (finalId) window.open(`/admin/devis/${finalId}/imprimer`, "_blank");
  }

  // ── Aperçu live mis à l'échelle ──
  const wrapRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [docH, setDocH] = useState(1122);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, wrap.clientWidth / A4_W)));
    ro.observe(wrap);
    setScale(Math.min(1, wrap.clientWidth / A4_W));
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const ro = new ResizeObserver(() => setDocH(doc.scrollHeight));
    ro.observe(doc);
    setDocH(doc.scrollHeight);
    return () => ro.disconnect();
  }, []);

  const filteredVehicles = vehicles.filter((v) => `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(360px,46%)] gap-6 items-start">
      {/* ─────────── Colonne formulaire ─────────── */}
      <div className="space-y-5">
        {/* Type de devis */}
        <SectionCard title="Type de devis">
          <div className="flex gap-2">
            {([
              ["vehicule", "Vente de véhicule", "Prix TTC, TVA sur marge, depuis le stock"],
              ["prestation", "Prestation (site web / IA)", "HT + TVA 20 %, bibliothèque de prestations"],
            ] as [QuoteKind, string, string][]).map(([val, lab, hint]) => {
              const active = q.kind === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setKind(val)}
                  className="flex-1 text-left p-3 border transition-colors"
                  style={{
                    borderColor: active ? T.accent : T.border,
                    backgroundColor: active ? "rgba(107,159,238,0.12)" : "transparent",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: active ? T.text : T.textDim }}>{lab}</div>
                  <div className="text-[11px] mt-1" style={{ color: T.muted }}>{hint}</div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Client */}
        <SectionCard title="Client">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Société (optionnel)">
              <input className={fieldClass} style={fieldStyle} value={q.clientCompany} onChange={(e) => update({ clientCompany: e.target.value })} placeholder="TransakAuto Bruxelles" />
            </Field>
            <Field label="Nom du client">
              <input className={fieldClass} style={fieldStyle} value={q.clientName} onChange={(e) => update({ clientName: e.target.value })} placeholder="M. Dupont" />
            </Field>
          </div>
          <Field label="Adresse">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={2} value={q.clientAddress} onChange={(e) => update({ clientAddress: e.target.value })} placeholder="12 rue de la Paix&#10;75002 Paris" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input className={fieldClass} style={fieldStyle} value={q.clientEmail} onChange={(e) => update({ clientEmail: e.target.value })} placeholder="client@email.com" />
            </Field>
            <Field label="Téléphone">
              <input className={fieldClass} style={fieldStyle} value={q.clientPhone} onChange={(e) => update({ clientPhone: e.target.value })} placeholder="+33 6 00 00 00 00" />
            </Field>
          </div>
        </SectionCard>

        {/* Lignes */}
        <SectionCard title="Lignes du devis">
          <div className="flex flex-wrap gap-2 relative">
            <button
              type="button"
              className={q.kind === "vehicule" ? btnPrimaryClass : btnGhostClass}
              style={q.kind === "vehicule" ? btnPrimaryStyle : btnGhostStyle}
              onClick={() => { setPickerOpen((o) => !o); setPrestaOpen(false); }}
            >
              + Depuis le stock
            </button>
            <button
              type="button"
              className={q.kind === "prestation" ? btnPrimaryClass : btnGhostClass}
              style={q.kind === "prestation" ? btnPrimaryStyle : btnGhostStyle}
              onClick={() => { setPrestaOpen((o) => !o); setPickerOpen(false); }}
            >
              + Prestation
            </button>
            <button type="button" className={btnGhostClass} style={btnGhostStyle} onClick={addFreeLine}>
              + Ligne libre
            </button>

            {pickerOpen && (
              <div className="absolute z-20 top-full mt-2 left-0 w-full sm:w-[420px] max-h-[360px] overflow-auto p-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
                <input autoFocus className={fieldClass} style={fieldStyle} placeholder="Rechercher un véhicule…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="mt-2">
                  {filteredVehicles.length === 0 ? (
                    <p className="text-sm py-3" style={{ color: T.muted }}>Aucun véhicule.</p>
                  ) : (
                    filteredVehicles.map((v) => (
                      <button key={v.id} type="button" onClick={() => addVehicle(v)} className="w-full text-left px-3 py-2 transition-colors hover:bg-[#112240] flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="text-xs uppercase tracking-widest mr-2" style={{ color: T.accent }}>{v.make}</span>
                          <span className="text-sm" style={{ color: T.text }}>{v.model}</span>
                          <span className="text-xs ml-2" style={{ color: T.muted }}>{v.year}</span>
                        </span>
                        <span className="text-sm flex-shrink-0" style={{ color: T.textDim }}>{formatNumber(v.price)} €</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {prestaOpen && (
              <div className="absolute z-20 top-full mt-2 left-0 w-full sm:w-[440px] max-h-[360px] overflow-auto p-2" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
                {PRESTATION_PRESETS.map((p) => (
                  <button key={p.designation} type="button" onClick={() => addPreset(p)} className="w-full text-left px-3 py-2 transition-colors hover:bg-[#112240]">
                    <div className="text-sm" style={{ color: T.text }}>{p.designation}</div>
                    {p.detail && <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{p.detail}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {q.items.length === 0 && <p className="text-sm" style={{ color: T.muted }}>Aucune ligne pour l&apos;instant.</p>}
            {q.items.map((it, i) => (
              <div key={it.id} className="p-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2 min-w-0">
                    <input className={fieldClass} style={fieldStyle} value={it.designation} onChange={(e) => updateItem(it.id, { designation: e.target.value })} placeholder="Désignation" />
                    <input className={fieldClass} style={{ ...fieldStyle, fontSize: "0.8rem" }} value={it.detail} onChange={(e) => updateItem(it.id, { detail: e.target.value })} placeholder="Détail (année, km, options…)" />
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-xs" style={{ color: T.muted }}>
                        Qté
                        <input type="number" min={1} step={1} className="w-16 px-2 py-1.5 text-sm" style={fieldStyle} value={it.qty} onChange={(e) => updateItem(it.id, { qty: Math.max(0, parseInt(e.target.value) || 0) })} />
                      </label>
                      <label className="flex items-center gap-2 text-xs flex-1" style={{ color: T.muted }}>
                        {q.tvaMode === "tva20" ? "P.U. HT" : "Prix"}
                        <span className="flex items-center flex-1" style={{ position: "relative" }}>
                          <input
                            inputMode="decimal"
                            className="w-full px-2 py-1.5 text-sm pr-7"
                            style={fieldStyle}
                            value={priceInputs[it.id] ?? (it.unitPrice ? String(it.unitPrice) : "")}
                            onChange={(e) => {
                              setPriceInputs((p) => ({ ...p, [it.id]: e.target.value }));
                              updateItem(it.id, { unitPrice: parseAmount(e.target.value) });
                            }}
                            placeholder="0"
                          />
                          <span style={{ position: "absolute", right: 8, color: T.muted, fontSize: "0.8rem" }}>€</span>
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button type="button" onClick={() => moveItem(it.id, -1)} disabled={i === 0} className="px-2 py-1 text-xs border disabled:opacity-30" style={{ borderColor: T.border, color: T.textDim }}>↑</button>
                    <button type="button" onClick={() => moveItem(it.id, 1)} disabled={i === q.items.length - 1} className="px-2 py-1 text-xs border disabled:opacity-30" style={{ borderColor: T.border, color: T.textDim }}>↓</button>
                    <button type="button" onClick={() => removeItem(it.id)} className="px-2 py-1 text-xs border" style={{ borderColor: T.border, color: T.danger }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Fiscalité & acompte */}
        <SectionCard title="Fiscalité & acompte">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Régime de TVA">
              <select className={fieldClass} style={fieldStyle} value={q.tvaMode} onChange={(e) => update({ tvaMode: e.target.value as TvaMode })}>
                <option value="marge">TVA sur marge (occasion)</option>
                <option value="tva20">TVA 20 % (HT + TVA)</option>
                <option value="exonere">Exonéré de TVA</option>
              </select>
            </Field>
            {q.tvaMode === "tva20" && (
              <Field label="Taux de TVA (%)">
                <input type="number" min={0} step={1} className={fieldClass} style={fieldStyle} value={q.tvaRate} onChange={(e) => update({ tvaRate: parseInt(e.target.value) || 0 })} />
              </Field>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Acompte">
              <select className={fieldClass} style={fieldStyle} value={q.depositMode} onChange={(e) => update({ depositMode: e.target.value as DepositMode })}>
                <option value="none">Aucun</option>
                <option value="percent">Pourcentage</option>
                <option value="amount">Montant fixe (€)</option>
              </select>
            </Field>
            {q.depositMode !== "none" && (
              <Field label={q.depositMode === "percent" ? "Pourcentage (%)" : "Montant (€)"}>
                <input inputMode="decimal" className={fieldClass} style={fieldStyle} value={q.depositValue} onChange={(e) => update({ depositValue: parseAmount(e.target.value) })} />
              </Field>
            )}
          </div>
        </SectionCard>

        {/* Conditions */}
        <SectionCard title="Devis & conditions">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Numéro">
              <input className={fieldClass} style={fieldStyle} value={q.number} onChange={(e) => update({ number: e.target.value })} />
            </Field>
            <Field label="Date d'émission">
              <input type="date" className={fieldClass} style={fieldStyle} value={q.issueDate} onChange={(e) => update({ issueDate: e.target.value })} />
            </Field>
            <Field label="Validité (jours)">
              <input type="number" min={0} className={fieldClass} style={fieldStyle} value={q.validityDays} onChange={(e) => update({ validityDays: parseInt(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label="Conditions de règlement">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={2} value={q.paymentTerms} onChange={(e) => update({ paymentTerms: e.target.value })} />
          </Field>
          <Field label="Notes (optionnel)">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={2} value={q.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Mentions complémentaires, garantie, reprise…" />
          </Field>
          <Field label="Statut">
            <select className={fieldClass} style={fieldStyle} value={q.status} onChange={(e) => update({ status: e.target.value as QuoteStatus })}>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
            </select>
          </Field>
        </SectionCard>

        {/* Émetteur & logo */}
        <SectionCard title="Émetteur & logo">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: T.textDim }}>
            <input type="checkbox" checked={q.branding.logoVisible} onChange={(e) => updateBranding({ logoVisible: e.target.checked })} style={{ accentColor: T.accent, width: 16, height: 16 }} />
            Afficher le logo sur le devis
          </label>
          {q.branding.logoVisible && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Position du logo">
                <div className="flex gap-1">
                  {(["left", "center", "right"] as LogoAlign[]).map((val) => {
                    const lab = val === "left" ? "Gauche" : val === "center" ? "Centre" : "Droite";
                    const active = q.branding.logoAlign === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateBranding({ logoAlign: val })}
                        className="flex-1 px-2 py-2.5 text-[11px] uppercase tracking-widest border transition-colors"
                        style={{
                          borderColor: active ? T.accent : T.border,
                          color: active ? T.text : T.muted,
                          backgroundColor: active ? "rgba(107,159,238,0.12)" : "transparent",
                        }}
                      >
                        {lab}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label={`Taille du logo — ${q.branding.logoSize} mm`}>
                <input type="range" min={8} max={32} step={1} value={q.branding.logoSize} onChange={(e) => updateBranding({ logoSize: parseInt(e.target.value) })} className="w-full" style={{ accentColor: T.accent }} />
              </Field>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom de l'émetteur">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterName} onChange={(e) => updateBranding({ emitterName: e.target.value })} placeholder="SASU Intelligence Automobile" />
            </Field>
            <Field label="Représentant">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterRepresentative} onChange={(e) => updateBranding({ emitterRepresentative: e.target.value })} placeholder="César Vachon" />
            </Field>
          </div>
          <Field label="Adresse de l'émetteur">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={3} value={q.branding.emitterAddress} onChange={(e) => updateBranding({ emitterAddress: e.target.value })} placeholder="30 rue Pouchet&#10;75017 Paris&#10;France" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterEmail} onChange={(e) => updateBranding({ emitterEmail: e.target.value })} placeholder="contact@…" />
            </Field>
            <Field label="Téléphone">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterPhone} onChange={(e) => updateBranding({ emitterPhone: e.target.value })} placeholder="+33 …" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="SIRET">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterSiret} onChange={(e) => updateBranding({ emitterSiret: e.target.value })} placeholder="(à compléter)" />
            </Field>
            <Field label="N° TVA intracom.">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterTva} onChange={(e) => updateBranding({ emitterTva: e.target.value })} placeholder="(à compléter)" />
            </Field>
          </div>
        </SectionCard>

        {error && <p className="text-sm" style={{ color: T.danger }}>{error}</p>}

        <div className="flex flex-wrap gap-3 pb-4">
          <button type="button" onClick={save} disabled={saving} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le devis"}
          </button>
          <button type="button" onClick={saveAndPrint} disabled={saving} className={btnGhostClass} style={btnGhostStyle}>
            Enregistrer & imprimer / PDF
          </button>
          <button type="button" onClick={() => router.push("/admin/devis")} className={btnGhostClass} style={btnGhostStyle}>
            Retour
          </button>
        </div>
      </div>

      {/* ─────────── Colonne aperçu live ─────────── */}
      <div className="hidden lg:block sticky top-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>Aperçu en direct</span>
          <span className="text-[11px]" style={{ color: T.muted }}>{totals.lineCount} ligne{totals.lineCount > 1 ? "s" : ""} · {formatEuro(totals.totalTTC)}</span>
        </div>
        <div ref={wrapRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, backgroundColor: "#5b6472", overflow: "hidden" }}>
          <div style={{ height: docH * scale }} />
          <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <div ref={docRef} style={{ width: A4_W }}>
              <DevisDocument quote={q} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass} style={{ color: T.muted }}>{label}</span>
      {children}
    </label>
  );
}
