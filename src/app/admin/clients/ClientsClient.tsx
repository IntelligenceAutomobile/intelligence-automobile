"use client";

// CRM : pipeline kanban des leads + carnet clients + création client/lead.
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, ChevronLeft, ChevronRight, Check, X, Users,
  Car, Banknote, Building2, Mail, Phone, Undo2, CalendarClock,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/vehicules";
import {
  PIPELINE_STAGES, STAGE_LABEL, STAGE_TONE, SOURCE_LABEL, SOURCES,
  LOST_REASONS, LOST_REASON_LABEL,
  type Stage, type Source, type LostReason,
} from "@/lib/crm";
import { T, TONE, Tag, AdminPage, PageHeader, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";

export type LeadRow = {
  id: string;
  title: string;
  stage: string;
  source: string;
  vehicleId: string | null;
  budget: number | null;
  updatedAt: string;
  /** Ancienneté du dernier échange, écrite côté serveur (voir timeAgo). */
  lastExchangeAgo: string;
  joursSansEchange: number;
  /** Jours depuis la dernière écriture, calculés côté serveur. */
  joursDepuisMaj: number;
  /** Prochaine action prévue : jour YYYY-MM-DD, vide si rien de prévu. */
  nextActionAt: string;
  nextActionLabel: string;
  closedAt: string;
  lostReason: string;
};

export type ClientRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  /** Ancienneté de la fiche, écrite côté serveur (voir timeAgo). */
  ago: string;
  leads: LeadRow[];
};

type VehicleLite = { id: string; make: string; model: string; year: number };

// Au-delà de ce délai sans le moindre échange, une affaire du pipeline est
// signalée comme à relancer. Sept jours : une semaine de silence sur un dossier
// ouvert est le seuil au-delà duquel on oublie de rappeler.
const JOURS_AVANT_RELANCE = 7;

// Identité stable : sert de valeur de repli aux étapes posées à l'écran, pour
// que les mémos qui en dépendent ne se recalculent pas à chaque rendu.
const AUCUNE_ETAPE_POSEE: Record<string, Stage> = {};

/** Écart en jours entre deux jours YYYY-MM-DD. Négatif = dans le passé. */
function joursJusquA(jour: string, aujourdhui: string): number {
  return Math.round((Date.parse(`${jour}T00:00:00Z`) - Date.parse(`${aujourdhui}T00:00:00Z`)) / 86_400_000);
}

/** « aujourd'hui », « demain », « en retard de 3 j », « dans 5 j ». */
function quand(jour: string, aujourdhui: string): string {
  const d = joursJusquA(jour, aujourdhui);
  if (d < -1) return `en retard de ${-d} j`;
  if (d === -1) return "en retard d'un jour";
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "demain";
  if (d <= 14) return `dans ${d} j`;
  return new Date(`${jour}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* ── Carte lead du kanban ── */
function LeadCard({
  lead, client, vehicleLabel, onMove, onOutcome, busy, aujourdhui,
}: {
  lead: LeadRow;
  client: ClientRow;
  vehicleLabel?: string;
  onMove: (dir: -1 | 1) => void;
  onOutcome: (stage: "gagne" | "perdu") => void;
  busy: boolean;
  aujourdhui: string;
}) {
  const idx = PIPELINE_STAGES.indexOf(lead.stage as Stage);
  const echeance = lead.nextActionAt ? joursJusquA(lead.nextActionAt, aujourdhui) : null;
  const enRetard = echeance !== null && echeance < 0;
  const pourAujourdhui = echeance === 0;
  // Ce qui appelle l'œil, dans l'ordre : une action en retard, puis une action
  // du jour, puis une affaire qui refroidit sans que rien soit prévu.
  const froide = !lead.nextActionAt && lead.joursSansEchange >= JOURS_AVANT_RELANCE;
  const glacee = !lead.nextActionAt && lead.joursSansEchange >= JOURS_AVANT_RELANCE * 2;
  const liseré = enRetard ? T.danger : pourAujourdhui || froide ? T.warning : glacee ? T.danger : null;
  return (
    <div
      className="adm-card p-3.5"
      style={{
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        borderLeft: liseré ? `2px solid ${liseré}` : `1px solid ${T.border}`,
        opacity: busy ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <Link href={`/admin/clients/${client.id}`} className="block min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>
          {client.company || client.name}
        </div>
        <div className="text-[11px] truncate mt-0.5" style={{ color: T.muted }}>
          {lead.title || <span style={{ color: T.border }}>Objet à préciser</span>}
        </div>
        {/* La prochaine action, juste sous le titre : c'est elle qui dit quoi
            faire, là où la carte ne disait jusqu'ici que d'où venait l'affaire. */}
        <div
          className="flex items-center gap-1.5 mt-2 text-[11px]"
          style={{ color: enRetard ? T.danger : pourAujourdhui ? T.warning : lead.nextActionAt ? T.textDim : T.muted }}
        >
          <CalendarClock size={11} style={{ flexShrink: 0 }} />
          {lead.nextActionAt ? (
            <span className="truncate">
              {lead.nextActionLabel || "À faire"} · {quand(lead.nextActionAt, aujourdhui)}
            </span>
          ) : (
            <span className="truncate" style={{ fontStyle: "italic" }}>Action à programmer</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]" style={{ color: T.textDim }}>
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
        <div className="flex items-center justify-between gap-2 mt-2.5">
          {/* L'étiquette annonçait l'origine avec la couleur de l'étape : deux
              affaires du même formulaire changeaient de couleur selon la colonne,
              et cette couleur ne faisait que répéter la colonne. Elle est neutre. */}
          <Tag tone="muted">{SOURCE_LABEL[lead.source as Source] ?? lead.source}</Tag>
          <span
            className="text-[10px] text-right"
            style={{ color: glacee ? T.danger : froide ? T.warning : T.muted }}
          >
            {froide ? `${lead.joursSansEchange} j sans échange` : lead.lastExchangeAgo}
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-1 mt-3 pt-2.5" style={{ borderTop: `1px solid ${T.surfaceAlt}` }}>
        <button
          type="button"
          disabled={busy || idx <= 0}
          onClick={() => onMove(-1)}
          aria-label="Étape précédente"
          className="p-1.5 transition-colors hover:text-[#F0F5FF] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          disabled={busy || idx >= PIPELINE_STAGES.length - 1}
          onClick={() => onMove(1)}
          aria-label="Étape suivante"
          className="p-1.5 transition-colors hover:text-[#F0F5FF] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onOutcome("gagne")}
          className="ml-auto inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-1.5 transition-colors hover:text-[#4ED1A1] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <Check size={12} />
          Gagné
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onOutcome("perdu")}
          className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-1.5 transition-colors hover:text-[#FF6B35] disabled:opacity-30"
          style={{ color: T.muted }}
        >
          <X size={12} />
          Perdu
        </button>
      </div>
    </div>
  );
}

/* ── Modale nouveau client ── */
function NewClientModal({ vehicles, onClose }: { vehicles: VehicleLite[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "" });
  const [withLead, setWithLead] = useState(true);
  const [lead, setLead] = useState({ title: "", source: "manuel" as Source, budget: "", vehicleId: "" });
  const [doublon, setDoublon] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);

  // La fenêtre se comportait autrement que celle de confirmation : Échap restait
  // sans effet, le curseur ne descendait pas dans le premier champ, et un clic
  // deux pixels à côté jetait la saisie sans rien demander.
  const saisieCommencee =
    Object.values(form).some((v) => v.trim() !== "") || lead.title.trim() !== "" || lead.budget.trim() !== "";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function fermerDepuisLeFond() {
    if (busy) return;
    // Rien de saisi : le clic à côté ferme, comme partout. Dès qu'un champ est
    // rempli, la fermeture passe par « Annuler » ou par Échap.
    if (!saisieCommencee) onClose();
  }

  async function submit(force = false) {
    if (!form.name.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          force,
          lead: withLead
            ? {
                title: lead.title,
                source: lead.source,
                budget: lead.budget ? parseInt(lead.budget.replace(/\s/g, ""), 10) : null,
                vehicleId: lead.vehicleId || null,
              }
            : undefined,
        }),
      });
      // Une fiche proche existe : on montre laquelle plutôt que de créer un
      // second exemplaire de la même personne en silence.
      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        setDoublon(j.doublon ?? null);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Client créé.");
      onClose();
      router.refresh();
    } catch {
      toast.error("La création a échoué.");
      setBusy(false);
    }
  }

  const input = (key: keyof typeof form, label: string, type = "text", autoFocus = false) => (
    <div>
      <label className={labelClass} style={{ color: T.textDim }} htmlFor={`nc-${key}`}>{label}</label>
      <input
        id={`nc-${key}`}
        type={type}
        autoFocus={autoFocus}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
        style={fieldStyle}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-6 py-10 overflow-y-auto"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={fermerDepuisLeFond}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-nouveau-client"
    >
      <div
        className="w-full max-w-lg p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titre-nouveau-client" className="text-base font-medium mb-5" style={{ color: T.text }}>Nouveau client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {input("name", "Nom *", "text", true)}
          {input("company", "Société")}
          {input("email", "Email", "email")}
          {input("phone", "Téléphone")}
        </div>
        <div className="mt-4">
          <label className={labelClass} style={{ color: T.textDim }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full resize-y"
            style={fieldStyle}
          />
        </div>

        <label className="flex items-center gap-2.5 mt-5 cursor-pointer text-sm" style={{ color: T.textDim }}>
          <input type="checkbox" checked={withLead} onChange={(e) => setWithLead(e.target.checked)} />
          Créer une opportunité (lead) pour ce client
        </label>

        {withLead && (
          <div className="mt-4 p-4 space-y-4" style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Objet</label>
              <input
                value={lead.title}
                onChange={(e) => setLead((l) => ({ ...l, title: e.target.value }))}
                placeholder="Ex : Recherche SUV hybride"
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                style={fieldStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Source</label>
                <select
                  value={lead.source}
                  onChange={(e) => setLead((l) => ({ ...l, source: e.target.value as Source }))}
                  className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
                  style={fieldStyle}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Budget (€)</label>
                <input
                  inputMode="numeric"
                  value={lead.budget}
                  onChange={(e) => setLead((l) => ({ ...l, budget: e.target.value }))}
                  className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                  style={fieldStyle}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Véhicule concerné</label>
              <select
                value={lead.vehicleId}
                onChange={(e) => setLead((l) => ({ ...l, vehicleId: e.target.value }))}
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
                style={fieldStyle}
              >
                <option value="">— Aucun —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} · {v.year}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {doublon && (
          <div
            className="mt-5 px-4 py-3 text-[13px]"
            style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}`, color: T.textDim }}
          >
            <p style={{ color: T.warning }}>Une fiche proche existe déjà.</p>
            <p className="mt-1">
              {doublon.name}
              {doublon.email ? ` · ${doublon.email}` : ""}
              {doublon.phone ? ` · ${doublon.phone}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2.5">
              <Link
                href={`/admin/clients/${doublon.id}`}
                className="text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
                style={{ color: T.accent }}
              >
                Ouvrir cette fiche
              </Link>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={busy}
                className="text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.muted }}
              >
                Créer quand même
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
          <button type="button" onClick={() => submit()} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {busy ? "…" : "Créer le client"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Motif de perte ──
   « Perdu » était un bouton sec : on savait qu'une affaire échouait, jamais
   pourquoi. Un seul geste, six motifs, et la possibilité de passer outre. */
function MotifPerteDialog({
  onChoisir, onAnnuler, busy,
}: {
  onChoisir: (motif: LostReason | null) => void;
  onAnnuler: () => void;
  busy: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onAnnuler();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnnuler]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onAnnuler}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-motif-perte"
    >
      <div
        className="w-full max-w-md p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titre-motif-perte" className="text-base font-medium" style={{ color: T.text }}>
          Pourquoi cette affaire est-elle perdue ?
        </h2>
        <p className="text-[12px] mt-1.5" style={{ color: T.muted }}>
          Le motif se retrouve dans les affaires conclues, et dit au bout d&apos;un an sur quoi vous perdez.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-5">
          {LOST_REASONS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={busy}
              onClick={() => onChoisir(m)}
              className="px-3 py-2.5 text-xs tracking-wide border transition-colors hover:border-[#6B9FEE] hover:text-[#F0F5FF] disabled:opacity-50"
              style={{ borderColor: T.border, color: T.textDim, backgroundColor: T.float }}
            >
              {LOST_REASON_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => onChoisir(null)}
            className="text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
            style={{ color: T.muted }}
          >
            Sans préciser
          </button>
          <button type="button" onClick={onAnnuler} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ClientsClient({
  clients, vehicles, total, aujourdhui,
}: {
  clients: ClientRow[];
  vehicles: VehicleLite[];
  /** Nombre total de fiches en base, la page n'en affichant qu'une tranche. */
  total: number;
  /** Jour de Paris, calculé côté serveur (l'heure lue au rendu est instable). */
  aujourdhui: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [concluesOuvertes, setConcluesOuvertes] = useState(false);
  // Opportunité dont on vient de cliquer « Perdu » : on demande le motif avant
  // d'écrire quoi que ce soit.
  const [perteEnCours, setPerteEnCours] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const vehicleLabel = useMemo(() => {
    const m = new Map<string, string>();
    vehicles.forEach((v) => m.set(v.id, `${v.make} ${v.model}`));
    return m;
  }, [vehicles]);

  // Étape posée à l'écran avant que le serveur réponde. La carte changeait de
  // colonne seulement après un rechargement complet de la page : pendant ce
  // temps elle restait en place, ses boutons redevenaient actifs, et le clic
  // suivant recalculait l'étape depuis l'ANCIENNE colonne, donc se perdait.
  //
  // L'affichage posé retient les données auxquelles il se rapporte. Dès que le
  // serveur en renvoie de nouvelles, il cesse simplement d'être lu : les
  // données reçues font foi, sans effet de bord ni rendu en cascade.
  const [pose, setPose] = useState<{ pour: ClientRow[]; etapes: Record<string, Stage> }>({
    pour: clients,
    etapes: {},
  });
  const etapesPosees = pose.pour === clients ? pose.etapes : AUCUNE_ETAPE_POSEE;
  const etapeDe = useCallback(
    (l: LeadRow) => (etapesPosees[l.id] ?? l.stage) as Stage,
    [etapesPosees],
  );

  const correspond = useCallback(
    (c: ClientRow, l?: LeadRow) =>
      matchesSearch(`${c.name} ${c.company} ${c.email} ${c.phone} ${l?.title ?? ""}`, query),
    [query],
  );

  // Leads aplatis avec leur client, par étape du pipeline.
  const byStage = useMemo(() => {
    const map = new Map<Stage, { lead: LeadRow; client: ClientRow }[]>();
    PIPELINE_STAGES.forEach((s) => map.set(s, []));
    for (const c of clients) {
      for (const l of c.leads) {
        if (!correspond(c, l)) continue;
        const s = etapeDe(l);
        if (map.has(s)) map.get(s)!.push({ lead: l, client: c });
      }
    }
    return map;
  }, [clients, correspond, etapeDe]);

  // Affaires conclues, gardées 90 jours à l'écran : « gagné » et « perdu » les
  // faisaient jusqu'ici disparaître de la page, sans aucun moyen d'y revenir.
  const conclues = useMemo(() => {
    const out: { lead: LeadRow; client: ClientRow; stage: Stage }[] = [];
    for (const c of clients) {
      for (const l of c.leads) {
        const s = etapeDe(l);
        if ((s === "gagne" || s === "perdu") && l.joursDepuisMaj <= 90 && correspond(c, l)) {
          out.push({ lead: l, client: c, stage: s });
        }
      }
    }
    return out.sort((a, b) => b.lead.updatedAt.localeCompare(a.lead.updatedAt));
  }, [clients, correspond, etapeDe]);

  // Chiffres de pilotage : la page annonçait « 16 clients » et jamais un euro.
  const chiffres = useMemo(() => {
    let valeur = 0, enCours = 0, aRelancer = 0, enRetard = 0, sansRappel = 0, gagnes = 0, valeurGagnee = 0;
    for (const c of clients) {
      for (const l of c.leads) {
        const s = etapeDe(l);
        if (PIPELINE_STAGES.includes(s)) {
          enCours++;
          valeur += l.budget ?? 0;
          // Deux façons de mériter une relance : une action dont le jour est
          // venu, ou aucune action prévue sur un dossier qui refroidit.
          if (l.nextActionAt) {
            const d = joursJusquA(l.nextActionAt, aujourdhui);
            if (d <= 0) {
              aRelancer++;
              if (d < 0) enRetard++;
            }
          } else if (l.joursSansEchange >= JOURS_AVANT_RELANCE) {
            aRelancer++;
            sansRappel++;
          }
        } else if (s === "gagne" && l.joursDepuisMaj <= 30) {
          gagnes++;
          valeurGagnee += l.budget ?? 0;
        }
      }
    }
    return { valeur, enCours, aRelancer, enRetard, sansRappel, gagnes, valeurGagnee };
  }, [clients, etapeDe, aujourdhui]);

  async function setStage(leadId: string, stage: Stage, lostReason?: LostReason | null) {
    const precedente = etapesPosees[leadId];
    setPose({ pour: clients, etapes: { ...etapesPosees, [leadId]: stage } });
    setBusyLead(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lostReason ? { stage, lostReason } : { stage }),
      });
      if (!res.ok) throw new Error();
      if (stage === "gagne") toast.success("Opportunité gagnée. Elle passe dans « Conclues ».");
      else if (stage === "perdu") toast.info("Opportunité perdue. Elle passe dans « Conclues ».");
      startTransition(() => router.refresh());
    } catch {
      // La carte revient d'où elle vient : l'affichage suit l'échec.
      setPose((p) => {
        const etapes = { ...(p.pour === clients ? p.etapes : {}) };
        if (precedente) etapes[leadId] = precedente;
        else delete etapes[leadId];
        return { pour: clients, etapes };
      });
      toast.error("Le changement d'étape a échoué.");
    } finally {
      setBusyLead(null);
    }
  }

  // Une fiche reste au carnet si elle correspond elle-même, ou si l'une de ses
  // opportunités correspond : chercher « SUV hybride » montrait deux cartes au
  // pipeline et annonçait « 0 fiche » juste en dessous.
  const filteredClients = useMemo(
    () => clients.filter((c) => correspond(c) || c.leads.some((l) => correspond(c, l))),
    [clients, correspond],
  );

  return (
    <AdminPage>
      <PageHeader
        title="Clients & leads"
        subtitle={`${clients.length} client${clients.length > 1 ? "s" : ""} · pipeline de vente.`}
        action={
          <button type="button" onClick={() => setModalOpen(true)} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau client
          </button>
        }
      />

      {/* ── Chiffres de pilotage, au format des autres modules ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="px-4 py-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Pipeline en cours</div>
          <div className="text-2xl font-light mt-1" style={{ color: T.accent, fontVariantNumeric: "tabular-nums" }}>
            {formatNumber(chiffres.valeur)} €
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>
            {chiffres.enCours} opportunité{chiffres.enCours > 1 ? "s" : ""} ouverte{chiffres.enCours > 1 ? "s" : ""}
          </div>
        </div>
        <div className="px-4 py-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>À relancer</div>
          <div
            className="text-2xl font-light mt-1"
            style={{ color: chiffres.aRelancer > 0 ? T.warning : T.textDim, fontVariantNumeric: "tabular-nums" }}
          >
            {chiffres.aRelancer}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>
            {chiffres.enRetard > 0 ? `${chiffres.enRetard} en retard · ` : ""}
            {chiffres.sansRappel} sans rappel prévu
          </div>
        </div>
        <div className="px-4 py-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Gagné sur 30 jours</div>
          <div className="text-2xl font-light mt-1" style={{ color: T.success, fontVariantNumeric: "tabular-nums" }}>
            {formatNumber(chiffres.valeurGagnee)} €
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>
            {chiffres.gagnes} opportunité{chiffres.gagnes > 1 ? "s" : ""} conclue{chiffres.gagnes > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* ── Recherche, en tête de page : elle gouverne le pipeline ET le carnet.
             Placée dans le titre du carnet, elle laissait le pipeline afficher
             tout le monde au-dessus, donnant deux réponses à la même question. ── */}
      <div className="relative mb-6 max-w-md">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un client ou une opportunité"
          placeholder="Rechercher un client, une société, un objet…"
          className="pl-11 pr-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
          style={fieldStyle}
        />
      </div>

      {/* ── Pipeline ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Pipeline</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PIPELINE_STAGES.map((stage) => {
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
                    {query ? "Rien ici pour cette recherche" : "Étape vide"}
                  </div>
                ) : (
                  items.map(({ lead, client }) => {
                    const idx = PIPELINE_STAGES.indexOf(stage);
                    return (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        client={client}
                        vehicleLabel={lead.vehicleId ? vehicleLabel.get(lead.vehicleId) : undefined}
                        busy={busyLead === lead.id}
                        onMove={(dir) => {
                          const next = PIPELINE_STAGES[idx + dir];
                          if (next) setStage(lead.id, next);
                        }}
                        aujourdhui={aujourdhui}
                        onOutcome={(s) =>
                          s === "perdu" ? setPerteEnCours(lead.id) : setStage(lead.id, s)
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Affaires conclues ──
             Marquer « gagné » ou « perdu » faisait sortir la carte de l'écran
             sans retour possible : un clic de travers coûtait une fouille dans
             le carnet pour retrouver de qui il s'agissait. Elles restent ici
             90 jours, et repartent au pipeline d'un clic. */}
      {conclues.length > 0 && (
        <div className="mb-10">
          <button
            type="button"
            onClick={() => setConcluesOuvertes((v) => !v)}
            aria-expanded={concluesOuvertes}
            className="flex items-center gap-2 w-full mb-3 text-left"
          >
            <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>
              Conclues, 90 derniers jours
            </h2>
            <span className="text-[11px]" style={{ color: T.muted }}>({conclues.length})</span>
            <ChevronRight
              size={13}
              style={{
                color: T.muted,
                marginLeft: "auto",
                transform: concluesOuvertes ? "rotate(90deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
          </button>
          {concluesOuvertes && (
            <div style={{ border: `1px solid ${T.border}` }}>
              {conclues.map(({ lead, client, stage }, i) => (
                <div
                  key={lead.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}`, opacity: busyLead === lead.id ? 0.6 : 1 }}
                >
                  <Tag tone={stage === "gagne" ? "success" : "muted"}>{STAGE_LABEL[stage]}</Tag>
                  <Link href={`/admin/clients/${client.id}`} className="min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]">
                    <span className="text-sm block truncate" style={{ color: T.textDim }}>
                      {client.company || client.name}
                    </span>
                    <span className="text-[11px] block truncate" style={{ color: T.muted }}>
                      {lead.title || SOURCE_LABEL[lead.source as Source] || lead.source}
                    </span>
                  </Link>
                  {lead.budget != null && (
                    <span className="text-[12px]" style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>
                      {formatNumber(lead.budget)} €
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={busyLead === lead.id}
                    onClick={() => setStage(lead.id, "devis_envoye")}
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase transition-colors hover:opacity-80 disabled:opacity-40"
                    style={{ color: T.accent }}
                  >
                    <Undo2 size={12} />
                    Remettre au pipeline
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Carnet clients ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Carnet clients</h2>
        {/* La page n'affiche qu'une tranche : elle le dit, plutôt que de laisser
            croire que le carnet est complet. */}
        <span className="text-[11px]" style={{ color: T.muted }}>
          {filteredClients.length} fiche{filteredClients.length > 1 ? "s" : ""}
          {total > clients.length && ` · les ${clients.length} plus actives sur ${total}`}
        </span>
      </div>

      {filteredClients.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          {clients.length === 0 ? (
            <span className="inline-flex items-center gap-2">
              <Users size={15} />
              Aucun client pour l&apos;instant. Les formulaires du site en créeront automatiquement.
            </span>
          ) : (
            "Aucun résultat pour cette recherche."
          )}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {filteredClients.map((c, i) => {
            const active = c.leads.filter((l) => PIPELINE_STAGES.includes(etapeDe(l))).length;
            return (
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3.5 transition-colors hover:bg-[#0A1628]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <div className="min-w-0 sm:w-64">
                  <span className="text-sm font-medium block truncate" style={{ color: T.text }}>{c.name}</span>
                  {c.company && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] truncate" style={{ color: T.muted }}>
                      <Building2 size={11} />
                      {c.company}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] min-w-0" style={{ color: T.textDim }}>
                  {c.email && (
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Mail size={12} style={{ color: T.muted }} />
                      <span className="truncate">{c.email}</span>
                    </span>
                  )}
                  {c.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={12} style={{ color: T.muted }} />
                      {c.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:ml-auto flex-shrink-0">
                  {active > 0 && (
                    <Tag tone="accent">
                      {active} opportunité{active > 1 ? "s" : ""}
                    </Tag>
                  )}
                  <span className="text-[10px]" style={{ color: T.muted }}>{c.ago}</span>
                  <ChevronRight size={14} style={{ color: T.muted }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {modalOpen && <NewClientModal vehicles={vehicles} onClose={() => setModalOpen(false)} />}

      {perteEnCours && (
        <MotifPerteDialog
          busy={busyLead === perteEnCours}
          onAnnuler={() => setPerteEnCours(null)}
          onChoisir={(motif) => {
            const id = perteEnCours;
            setPerteEnCours(null);
            setStage(id, "perdu", motif);
          }}
        />
      )}
    </AdminPage>
  );
}
