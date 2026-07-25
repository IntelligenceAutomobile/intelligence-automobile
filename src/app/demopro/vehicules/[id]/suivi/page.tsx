// Suivi du véhicule de la démonstration publique /demopro (lecture seule).
// Reproduit le suivi du back-office alimenté par les données d'exemple figées :
// résumé de marge (prix de vente − total des frais), frais listés par catégorie
// et journal d'enquête (problèmes, solutions, observations, administratif).
// Aucun accès base. Les boutons d'ajout et de suppression affichent un toast.
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Plus, Trash2, Send, Check, AlertTriangle, Wrench, Banknote,
  TrendingUp, TrendingDown, Pencil,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import {
  COST_CATEGORIES, COST_LABEL, NOTE_TYPES, NOTE_LABEL, NOTE_TONE,
  computeMargin, type CostCategory, type NoteType,
} from "@/lib/vehicle-tracking";
import {
  T, TONE, Tag, Thumb, StatusBadge, AdminPage, SectionCard, firstImage,
  fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle,
} from "@/app/admin/ui";
import { getDemoVehicle, getDemoVehicleCosts, getDemoVehicleNotes } from "@/lib/demo-data";
import { DEMO_BASE } from "../../../demo";
import DemoActionButton from "../../../DemoActionButton";

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default async function DemoSuiviPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = getDemoVehicle(id);
  if (!vehicle) notFound();

  const costs = getDemoVehicleCosts(id).slice().sort((a, b) => b.date.localeCompare(a.date));
  const notes = getDemoVehicleNotes(id).slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = costs.reduce((s, c) => s + c.amountCents, 0);
  const margin = computeMargin(vehicle.price, total);
  const marginPositive = margin.marginCents >= 0;
  const openProblems = notes.filter((n) => n.type === "probleme" && !n.resolved).length;

  return (
    <AdminPage>
      <Link
        href={`${DEMO_BASE}/vehicules/${vehicle.id}`}
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        <ChevronLeft size={13} />
        Fiche du véhicule
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <Thumb src={firstImage(vehicle.images)} alt={`${vehicle.make} ${vehicle.model}`} w={88} h={66} />
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
        {/* Résumé marge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Frais engagés */}
        <SectionCard title="Frais engagés">
          {/* Formulaire d'ajout (démo : le bouton affiche un toast) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-3">
              <label className={labelClass} style={{ color: T.textDim }}>Catégorie</label>
              <select defaultValue="achat" className="px-3 py-2.5 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
                {COST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{COST_LABEL[c]}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className={labelClass} style={{ color: T.textDim }}>Détail (optionnel)</label>
              <input placeholder="Ex : convoyage depuis l'Allemagne" className="px-3 py-2.5 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ color: T.textDim }}>Montant €</label>
              <input inputMode="decimal" className="px-3 py-2.5 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ color: T.textDim }}>Date</label>
              <input type="date" className="px-3 py-2.5 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div className="sm:col-span-1">
              <DemoActionButton className={btnPrimaryClass + " w-full"} style={btnPrimaryStyle} ariaLabel="Ajouter">
                <Plus size={15} />
              </DemoActionButton>
            </div>
          </div>

          {/* Liste des frais */}
          {costs.length === 0 ? (
            <p className="text-sm" style={{ color: T.muted }}>Les frais engagés apparaissent ici, à commencer par le prix d&apos;achat.</p>
          ) : (
            <div style={{ border: `1px solid ${T.border}` }}>
              {costs.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
                  <Tag tone="muted">{COST_LABEL[c.category as CostCategory] ?? c.category}</Tag>
                  <span className="text-[13px] truncate min-w-0" style={{ color: T.textDim }}>{c.label || "—"}</span>
                  <span className="text-[11px] hidden sm:inline flex-shrink-0" style={{ color: T.muted }}>{fmtDate(c.date)}</span>
                  <span className="text-sm font-semibold ml-auto flex-shrink-0" style={{ color: T.text }}>{formatEuroCents(c.amountCents)}</span>
                  <DemoActionButton ariaLabel="Supprimer" className="p-1 transition-colors hover:text-[#FF6B35] flex-shrink-0" style={{ color: T.muted }}>
                    <Trash2 size={13} />
                  </DemoActionButton>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Journal d'enquête */}
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

          {/* Ajout (démo : le bouton affiche un toast) */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select defaultValue="probleme" className="text-sm px-3 py-2.5 outline-none cursor-pointer flex-shrink-0" style={fieldStyle}>
              {NOTE_TYPES.map((t) => (
                <option key={t} value={t}>{NOTE_LABEL[t]}</option>
              ))}
            </select>
            <input placeholder="Ex : petit problème de boîte de vitesses à faire vérifier…" className="px-4 py-2.5 text-sm outline-none flex-1" style={fieldStyle} />
            <DemoActionButton className={btnGhostClass + " flex-shrink-0"} style={btnGhostStyle}>
              <Send size={13} />
              Ajouter
            </DemoActionButton>
          </div>

          {/* Timeline */}
          {notes.length === 0 ? (
            <p className="text-sm" style={{ color: T.muted }}>
              Le journal regroupe ici l&apos;état du dossier : problèmes constatés, solutions apportées et démarches administratives.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {notes.map((n, i) => {
                const tone = TONE[NOTE_TONE[n.type as NoteType] ?? "accent"];
                const isProblem = n.type === "probleme";
                const done = isProblem && n.resolved;
                const open = isProblem && !n.resolved;
                return (
                  <li key={n.id} className="flex items-start gap-3 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
                    <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 mt-0.5" style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}>
                      {isProblem ? <AlertTriangle size={13} /> : n.type === "solution" ? <Check size={13} /> : n.type === "admin" ? <Pencil size={13} /> : <Wrench size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag tone={NOTE_TONE[n.type as NoteType] ?? "accent"}>{NOTE_LABEL[n.type as NoteType] ?? n.type}</Tag>
                        {open && (
                          <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-0.5" style={{ backgroundColor: TONE.danger.bg, border: `1px solid ${TONE.danger.bd}`, color: TONE.danger.fg }}>
                            <AlertTriangle size={10} />
                            Problème ouvert
                          </span>
                        )}
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
                        <DemoActionButton title={n.resolved ? "Rouvrir" : "Marquer réglé"} className="p-1.5 transition-colors" style={{ color: n.resolved ? T.muted : T.success }}>
                          <Check size={14} />
                        </DemoActionButton>
                      )}
                      <DemoActionButton ariaLabel="Supprimer" className="p-1.5 transition-colors hover:text-[#FF6B35]" style={{ color: T.muted }}>
                        <Trash2 size={13} />
                      </DemoActionButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </AdminPage>
  );
}
