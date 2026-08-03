"use client";

// Suivi d'un véhicule : frais engagés (→ marge) + journal d'enquête
// (problèmes constatés, solutions, observations, administratif).
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Send, Check, AlertTriangle, Wrench, Banknote,
  TrendingUp, TrendingDown, Pencil, HandCoins,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import {
  COST_CATEGORIES, COST_LABEL, NOTE_TYPES, NOTE_LABEL, NOTE_TONE,
  computeMargin, type CostCategory, type NoteType,
} from "@/lib/vehicle-tracking";
import { T, TONE, Tag, Thumb, StatusBadge, AdminPage, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../../../ui";
import { useToast } from "../../../toast";

export type CostRow = { id: string; category: string; label: string; amountCents: number; date: string };
export type NoteRow = { id: string; type: string; content: string; resolved: boolean; author: string; createdAt: string };
type Vehicle = { id: string; make: string; model: string; year: number; price: number; status: string; image: string | null };

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

/* ── Bloc frais & marge ── */
function CostsSection({ vehicle, costs }: { vehicle: Vehicle; costs: CostRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category: "achat" as CostCategory, label: "", amount: "", date: new Date().toISOString().slice(0, 10) });

  const total = useMemo(() => costs.reduce((s, c) => s + c.amountCents, 0), [costs]);
  const margin = computeMargin(vehicle.price, total);
  const marginPositive = margin.marginCents >= 0;

  async function addCost() {
    if (!form.amount.trim()) {
      toast.error("Indiquez un montant.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/vehicules/${vehicle.id}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm((f) => ({ ...f, label: "", amount: "" }));
      toast.success("Frais ajouté.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("L'ajout a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function removeCost(id: string) {
    try {
      const res = await fetch(`/api/admin/vehicules/${vehicle.id}/costs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      toast.error("La suppression a échoué.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Résumé marge */}
      <div className="grid grid-cols-3 gap-4">
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>Prix de vente</span>
          <div className="text-[26px] font-normal mt-2" style={{ color: T.text }}>
            {vehicle.price > 0 ? `${formatNumber(vehicle.price)} €` : "—"}
          </div>
        </div>
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>Total des frais</span>
          <div className="text-[26px] font-normal mt-2" style={{ color: T.text }}>{formatEuroCents(total)}</div>
        </div>
        <div className="adm-card p-5" style={{ backgroundColor: T.surface, border: `1px solid ${marginPositive ? "rgba(78,209,161,0.4)" : "rgba(255,107,53,0.4)"}` }}>
          <div className="adm-hairline" />
          <span className="text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color: "#C3D2EC" }}>Marge estimée</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-normal" style={{ color: marginPositive ? T.success : T.danger }}>
              {formatEuroCents(margin.marginCents)}
            </span>
            {vehicle.price > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: marginPositive ? T.success : T.danger }}>
                {marginPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.round(margin.rate * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <SectionCard title="Frais engagés">
        {/* Formulaire d'ajout */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
          <div className="sm:col-span-3">
            <label className={labelClass} style={{ color: T.textDim }}>Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CostCategory }))}
              className="px-3 py-2.5 text-sm outline-none w-full cursor-pointer"
              style={fieldStyle}
            >
              {COST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{COST_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className={labelClass} style={{ color: T.textDim }}>Détail (optionnel)</label>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ex : convoyage depuis l'Allemagne"
              className="px-3 py-2.5 text-sm outline-none w-full"
              style={fieldStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: T.textDim }}>Montant €</label>
            <input
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") addCost(); }}
              className="px-3 py-2.5 text-sm outline-none w-full"
              style={fieldStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: T.textDim }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="px-3 py-2.5 text-sm outline-none w-full"
              style={fieldStyle}
            />
          </div>
          <div className="sm:col-span-1">
            <button type="button" onClick={addCost} disabled={busy} className={btnPrimaryClass + " w-full"} style={btnPrimaryStyle} aria-label="Ajouter">
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Liste */}
        {costs.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>Aucun frais enregistré. Commencez par le prix d&apos;achat.</p>
        ) : (
          <div style={{ border: `1px solid ${T.border}` }}>
            {costs.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
                <Tag tone="muted">{COST_LABEL[c.category as CostCategory] ?? c.category}</Tag>
                <span className="text-[13px] truncate min-w-0" style={{ color: T.textDim }}>{c.label || "—"}</span>
                <span className="text-[11px] hidden sm:inline flex-shrink-0" style={{ color: T.muted }}>{fmtDate(c.date)}</span>
                <span className="text-sm font-semibold ml-auto flex-shrink-0" style={{ color: T.text }}>{formatEuroCents(c.amountCents)}</span>
                <button
                  type="button"
                  onClick={() => removeCost(c.id)}
                  aria-label="Supprimer"
                  className="p-1 transition-colors hover:text-[#FF6B35] flex-shrink-0"
                  style={{ color: T.muted }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ── Journal d'enquête ── */
function NotesSection({ vehicleId, notes }: { vehicleId: string; notes: NoteRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<NoteType>("probleme");
  const [content, setContent] = useState("");

  const openProblems = notes.filter((n) => n.type === "probleme" && !n.resolved).length;

  async function addNote() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/vehicules/${vehicleId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      toast.success("Note ajoutée.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("L'ajout a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleResolved(n: NoteRow) {
    try {
      const res = await fetch(`/api/admin/vehicules/${vehicleId}/notes/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !n.resolved }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      toast.error("La mise à jour a échoué.");
    }
  }

  async function removeNote(id: string) {
    try {
      const res = await fetch(`/api/admin/vehicules/${vehicleId}/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      toast.error("La suppression a échoué.");
    }
  }

  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Journal d&apos;enquête</h2>
        {openProblems > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-2.5 py-1" style={{ backgroundColor: TONE.danger.bg, border: `1px solid ${TONE.danger.bd}`, color: TONE.danger.fg }}>
            <AlertTriangle size={12} />
            {openProblems} problème{openProblems > 1 ? "s" : ""} ouvert{openProblems > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Ajout */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          className="text-sm px-3 py-2.5 outline-none cursor-pointer flex-shrink-0"
          style={fieldStyle}
        >
          {NOTE_TYPES.map((t) => (
            <option key={t} value={t}>{NOTE_LABEL[t]}</option>
          ))}
        </select>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
          placeholder="Ex : petit problème de boîte de vitesse à faire vérifier…"
          className="px-4 py-2.5 text-sm outline-none flex-1"
          style={fieldStyle}
        />
        <button type="button" onClick={addNote} disabled={busy || !content.trim()} className={btnGhostClass + " flex-shrink-0"} style={btnGhostStyle}>
          <Send size={13} />
          Ajouter
        </button>
      </div>

      {/* Timeline */}
      {notes.length === 0 ? (
        <p className="text-sm" style={{ color: T.muted }}>
          Aucune note. Consignez ici l&apos;état du dossier : problèmes constatés, solutions, démarches administratives.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {notes.map((n, i) => {
            const tone = TONE[NOTE_TONE[n.type as NoteType] ?? "accent"];
            const isProblem = n.type === "probleme";
            const done = isProblem && n.resolved;
            return (
              <li key={n.id} className="flex items-start gap-3 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
                <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 mt-0.5" style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}>
                  {isProblem ? <AlertTriangle size={13} /> : n.type === "solution" ? <Check size={13} /> : n.type === "admin" ? <Pencil size={13} /> : <Wrench size={13} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag tone={NOTE_TONE[n.type as NoteType] ?? "accent"}>{NOTE_LABEL[n.type as NoteType] ?? n.type}</Tag>
                    {done && <span className="text-[10px] tracking-widest uppercase" style={{ color: T.success }}>✓ Réglé</span>}
                  </div>
                  <p className="text-[13px] mt-1 whitespace-pre-wrap break-words" style={{ color: done ? T.muted : T.textDim, textDecoration: done ? "line-through" : "none" }}>
                    {n.content}
                  </p>
                  <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                    {n.author ? `${n.author} · ` : ""}{timeAgo(n.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isProblem && (
                    <button
                      type="button"
                      onClick={() => toggleResolved(n)}
                      title={n.resolved ? "Rouvrir" : "Marquer réglé"}
                      className="p-1.5 transition-colors"
                      style={{ color: n.resolved ? T.muted : T.success }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button type="button" onClick={() => removeNote(n.id)} aria-label="Supprimer" className="p-1.5 transition-colors hover:text-[#FF6B35]" style={{ color: T.muted }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ── Page ── */
/** D'où vient la voiture, quand elle entre au parc par une reprise client. */
export type OrigineReprise = {
  repriseId: string;
  reference: string;
  vendeur: string;
  clientId: string | null;
};

export default function SuiviClient({
  vehicle, costs, notes, origine = null,
}: {
  vehicle: Vehicle;
  costs: CostRow[];
  notes: NoteRow[];
  origine?: OrigineReprise | null;
}) {
  return (
    <AdminPage>
      <Link
        href={`/admin/vehicules/${vehicle.id}`}
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        <ChevronLeft size={13} />
        Fiche du véhicule
      </Link>

      {/* Cette voiture vient d'une reprise : l'estimation garde l'état constaté
          le jour de l'évaluation et l'identité du cédant. */}
      {origine && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 mb-6"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        >
          <span className="inline-flex items-center gap-2 text-[12.5px] min-w-0" style={{ color: T.textDim }}>
            <HandCoins size={14} style={{ color: T.accent, flexShrink: 0 }} />
            <span className="truncate">
              Issue de la reprise {origine.reference}
              {origine.vendeur ? ` · cédée par ${origine.vendeur}` : ""}
            </span>
          </span>
          <span className="flex items-center gap-4 flex-shrink-0">
            <Link
              href={`/admin/reprises/${origine.repriseId}`}
              className="text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
              style={{ color: T.accent }}
            >
              Ouvrir l&apos;estimation
            </Link>
            {origine.clientId && (
              <Link
                href={`/admin/clients/${origine.clientId}`}
                className="text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.muted }}
              >
                Fiche du vendeur
              </Link>
            )}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <Thumb src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} w={88} h={66} />
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-normal" style={{ color: T.text }}>
              <span className="text-sm tracking-widest uppercase mr-2 align-middle" style={{ color: T.accent }}>{vehicle.make}</span>
              {vehicle.model}
            </h1>
            <StatusBadge status={vehicle.status} />
          </div>
          <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: T.muted }}>
            <Banknote size={13} />
            Suivi du dossier : frais, marge et journal d&apos;enquête
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CostsSection vehicle={vehicle} costs={costs} />
        <NotesSection vehicleId={vehicle.id} notes={notes} />
      </div>
    </AdminPage>
  );
}
