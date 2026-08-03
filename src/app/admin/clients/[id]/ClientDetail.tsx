"use client";

// Fiche client CRM : coordonnées, leads avec timeline d'interactions, devis liés.
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, FileText, Mail, Phone, Building2, Pencil, Trash2,
  Plus, MessageSquare, PhoneCall, CalendarClock, ArrowRightLeft, Sparkles, Send,
  Download, ShieldOff, Copy,
} from "lucide-react";
import { formatNumber, lireMontantEuros } from "@/lib/format";
import {
  STAGES, STAGE_LABEL, STAGE_TONE, SOURCE_LABEL, SOURCES, EVENT_LABEL,
  LOST_REASON_LABEL,
  type Stage, type Source, type EventType, type LostReason,
} from "@/lib/crm";
import { STATUS_LABEL, formatDateFr, type QuoteStatus } from "@/lib/devis";
import { T, TONE, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../../ui";
import { useToast } from "../../toast";
import { ConfirmDialog } from "../../confirm";

export type LeadEventRow = { id: string; type: string; content: string; author: string; createdAt: string };
export type LeadFull = {
  id: string;
  title: string;
  stage: string;
  source: string;
  vehicleId: string | null;
  budget: number | null;
  updatedAt: string;
  nextActionAt: string;
  nextActionLabel: string;
  closedAt: string;
  lostReason: string;
  events: LeadEventRow[];
};
export type ClientFull = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  leads: LeadFull[];
};

type VehicleLite = { id: string; make: string; model: string; year: number };
type QuoteLite = { id: string; number: string; status: string; issueDate: string };

const EVENT_ICON: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  appel: PhoneCall,
  email: Mail,
  rdv: CalendarClock,
  etape: ArrowRightLeft,
  creation: Sparkles,
};

const QUOTE_TONE: Record<string, "muted" | "accent" | "success" | "danger"> = {
  brouillon: "muted",
  envoye: "accent",
  accepte: "success",
  refuse: "danger",
};

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Copie d'une coordonnée dans le presse-papier ── */
function CopyButton({ value, label }: { value: string; label: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      aria-label={`Copier : ${value}`}
      title="Copier"
      className="p-1 flex-shrink-0 transition-colors hover:text-[#F0F5FF]"
      style={{ color: T.muted }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(label);
        } catch {
          toast.error("La copie a échoué.");
        }
      }}
    >
      <Copy size={12} />
    </button>
  );
}

/* ── Timeline, modification et ajout d'interaction d'une opportunité ── */
function LeadBlock({ lead, vehicles, canDelete }: { lead: LeadFull; vehicles: VehicleLite[]; canDelete: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [eventType, setEventType] = useState<EventType>("note");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: "", source: "manuel" as Source, budget: "", vehicleId: "",
    nextActionAt: "", nextActionLabel: "",
  });
  // `busy` ne devient vrai qu'au rendu suivant : trois Entrée d'affilée passaient
  // toutes les trois avant que le bouton se désactive, et créaient trois notes
  // identiques. Ce verrou-ci se ferme dans le même tour d'exécution.
  const envoiEnCours = useRef(false);

  const vehicle = lead.vehicleId ? vehicles.find((v) => v.id === lead.vehicleId) : null;
  const tonalite = TONE[STAGE_TONE[lead.stage as Stage] ?? "muted"];

  function ouvrirModification() {
    setForm({
      title: lead.title,
      source: (lead.source as Source) ?? "manuel",
      budget: lead.budget == null ? "" : String(lead.budget),
      vehicleId: lead.vehicleId ?? "",
      nextActionAt: lead.nextActionAt,
      nextActionLabel: lead.nextActionLabel,
    });
    setEditing(true);
  }

  async function changeStage(stage: Stage) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Étape : ${STAGE_LABEL[stage]}`);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Le changement d'étape a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function saveLead() {
    const budget = lireMontantEuros(form.budget);
    if (budget === "invalide") {
      toast.error("Le budget se saisit en chiffres, par exemple 15 000.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          source: form.source,
          budget,
          vehicleId: form.vehicleId || null,
          nextActionAt: form.nextActionAt,
          nextActionLabel: form.nextActionLabel,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Opportunité mise à jour.");
      setEditing(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteLead() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Opportunité supprimée.");
      setConfirmDelete(false);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La suppression a échoué.");
      setBusy(false);
    }
  }

  async function addEvent() {
    if (envoiEnCours.current || !content.trim()) return;
    envoiEnCours.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: eventType, content }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      toast.success("Interaction ajoutée.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("L'ajout a échoué.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  return (
    // L'identifiant ouvre la page au bon bloc : le suivi d'un véhicule et le
    // module Reprises pointent vers l'affaire, pas vers le haut de la fiche.
    <SectionCard id={`lead-${lead.id}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium break-words" style={{ color: T.text }}>
            {lead.title || <span style={{ color: T.muted }}>Objet à préciser</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]" style={{ color: T.muted }}>
            <span>{SOURCE_LABEL[lead.source as Source] ?? lead.source}</span>
            {/* Un véhicule retiré du stock effaçait sa mention sans un mot : on ne
                savait plus sur quelle voiture portait l'opportunité. */}
            {lead.vehicleId && (
              <span>· {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Véhicule retiré du stock"}</span>
            )}
            {lead.budget != null && <span>· Budget {formatNumber(lead.budget)} €</span>}
            {lead.lostReason && (
              <span>· Perdue : {LOST_REASON_LABEL[lead.lostReason as LostReason] ?? lead.lostReason}</span>
            )}
            {lead.closedAt && <span>· Conclue le {formatDateFr(lead.closedAt)}</span>}
          </div>
          {lead.nextActionAt && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[12px]" style={{ color: T.accent }}>
              <CalendarClock size={12} style={{ flexShrink: 0 }} />
              <span>
                {lead.nextActionLabel || "À faire"} · {formatDateFr(lead.nextActionAt)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* L'étape s'écrivait deux fois côte à côte, une pastille collée à un menu
              qui disait le même mot. Le menu porte maintenant seul la couleur. */}
          <select
            value={lead.stage}
            disabled={busy}
            aria-label="Étape de l'opportunité"
            onChange={(e) => changeStage(e.target.value as Stage)}
            className="text-xs px-3 py-2 outline-none focus:border-[#6B9FEE] cursor-pointer"
            style={{ ...fieldStyle, width: undefined, borderLeft: `2px solid ${tonalite.fg}`, color: tonalite.fg }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s} style={{ color: T.text }}>{STAGE_LABEL[s]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={editing ? () => setEditing(false) : ouvrirModification}
            aria-label="Modifier l'opportunité"
            title="Modifier l'opportunité"
            className="p-2 transition-colors hover:opacity-80"
            style={{ color: editing ? T.accent : T.muted }}
          >
            <Pencil size={13} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Supprimer l'opportunité"
              title="Supprimer l'opportunité"
              className="p-2 transition-colors hover:text-[#FF6B35]"
              style={{ color: T.muted }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Modification : les mêmes quatre champs que la fenêtre de création. */}
      {editing && (
        <div className="p-4 space-y-4" style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <div>
            <label className={labelClass} style={{ color: T.textDim }} htmlFor={`objet-${lead.id}`}>Objet</label>
            <input
              id={`objet-${lead.id}`}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex : Recherche SUV hybride"
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
              style={fieldStyle}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }} htmlFor={`source-${lead.id}`}>Origine</label>
              <select
                id={`source-${lead.id}`}
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as Source }))}
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
                style={fieldStyle}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }} htmlFor={`budget-${lead.id}`}>Budget (€)</label>
              <input
                id={`budget-${lead.id}`}
                inputMode="numeric"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                style={fieldStyle}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }} htmlFor={`vehicule-${lead.id}`}>Véhicule concerné</label>
            <select
              id={`vehicule-${lead.id}`}
              value={form.vehicleId}
              onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
              className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full cursor-pointer"
              style={fieldStyle}
            >
              <option value="">— Aucun —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} · {v.year}</option>
              ))}
            </select>
          </div>
          {/* Prochaine action : la seule chose qui empêche d'oublier un
              prospect. Rien dans le module ne portait de date future. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
            <div>
              <label className={labelClass} style={{ color: T.textDim }} htmlFor={`action-${lead.id}`}>
                Prochaine action
              </label>
              <input
                id={`action-${lead.id}`}
                value={form.nextActionLabel}
                onChange={(e) => setForm((f) => ({ ...f, nextActionLabel: e.target.value }))}
                placeholder="Ex : Rappeler pour l'essai"
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                style={fieldStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }} htmlFor={`echeance-${lead.id}`}>Le</label>
              <input
                id={`echeance-${lead.id}`}
                type="date"
                value={form.nextActionAt}
                onChange={(e) => setForm((f) => ({ ...f, nextActionAt: e.target.value }))}
                className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={saveLead} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Ajout d'interaction, placé AVANT le journal : celui-ci se lit du plus
          récent au plus ancien, donc une note écrite en bas apparaissait en haut,
          souvent hors de l'écran. Elle se pose maintenant juste sous le champ. */}
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <select
          value={eventType}
          aria-label="Type d'interaction"
          onChange={(e) => setEventType(e.target.value as EventType)}
          className="text-xs px-3 py-2.5 outline-none focus:border-[#6B9FEE] cursor-pointer flex-shrink-0"
          style={{ ...fieldStyle, width: undefined }}
        >
          <option value="note">Note</option>
          <option value="appel">Appel</option>
          <option value="email">Email</option>
          <option value="rdv">RDV</option>
        </select>
        <textarea
          value={content}
          rows={2}
          aria-label="Nouvelle interaction"
          onChange={(e) => setContent(e.target.value)}
          // Entrée sert au retour à la ligne : un compte rendu d'appel tient
          // rarement sur une ligne. L'envoi passe par Ctrl (ou ⌘) + Entrée.
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              addEvent();
            }
          }}
          placeholder="Ajouter une interaction… (Ctrl + Entrée pour valider)"
          className="px-4 py-2.5 text-sm outline-none focus:border-[#6B9FEE] flex-1 resize-y"
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={addEvent}
          disabled={busy || !content.trim()}
          className={btnGhostClass + " flex-shrink-0"}
          style={btnGhostStyle}
        >
          <Send size={13} />
          Ajouter
        </button>
      </div>

      {/* Journal */}
      <ul className="space-y-0.5">
        {lead.events.map((e, i) => {
          const Icon = EVENT_ICON[e.type] ?? MessageSquare;
          return (
            <li key={e.id} className="flex items-start gap-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
              <span
                className="flex items-center justify-center w-6 h-6 flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}` }}
              >
                <Icon size={12} style={{ color: e.type === "creation" ? T.accent : T.textDim }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] whitespace-pre-wrap break-words" style={{ color: T.textDim }}>{e.content}</div>
                <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>
                  {EVENT_LABEL[e.type as EventType] ?? e.type}
                  {e.author ? ` · ${e.author}` : ""} · {timeAgo(e.createdAt)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette opportunité ?"
        description="Son journal d'interactions sera supprimé avec elle. Les devis liés au client sont conservés."
        busy={busy}
        onConfirm={deleteLead}
        onCancel={() => setConfirmDelete(false)}
      />
    </SectionCard>
  );
}

/* ── Page ── */
export default function ClientDetail({
  client, vehicles, quotes, efface, canDelete,
}: {
  client: ClientFull;
  vehicles: VehicleLite[];
  quotes: QuoteLite[];
  /** Fiche déjà effacée à la demande de la personne (verdict rendu côté serveur). */
  efface: boolean;
  /** Le compte a le droit de supprimer : sans lui, les routes répondent 403. */
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: client.name, company: client.company, email: client.email, phone: client.phone, notes: client.notes });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [bilan, setBilan] = useState<{ devisAnonymises: number; facturesConservees: number; pistesSupprimees: number } | null>(null);

  // `form` était semé une seule fois, au premier affichage de la page, et gardait
  // ensuite ce qu'on y avait tapé. Deux conséquences, toutes deux constatées :
  // « Annuler » puis rouvrir « Modifier » ramenait la saisie abandonnée, qui
  // repartait en base à l'enregistrement suivant ; et après un effacement RGPD,
  // le formulaire contenait encore le nom, l'email et le téléphone effacés, qu'un
  // simple « Enregistrer » réinscrivait. Le formulaire se sème donc à l'ouverture
  // de la modification, jamais avant, et se repose à la fermeture.
  const valeursEnregistrees = () => ({
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
  });
  function ouvrirModification() {
    setForm(valeursEnregistrees());
    setEditing(true);
  }
  function fermerModification() {
    setForm(valeursEnregistrees());
    setEditing(false);
  }

  async function effacerDonnees() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/effacer`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setBilan(j.bilan);
      setConfirmErase(false);
      toast.success("Données effacées.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'effacement a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function saveClient() {
    if (!form.name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Client mis à jour.");
      setEditing(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteClient() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Client supprimé.");
      router.push("/admin/clients");
      router.refresh();
    } catch {
      toast.error("La suppression a échoué.");
      setBusy(false);
    }
  }

  async function newLead() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, source: "manuel" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead créé.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("La création a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const input = (key: keyof typeof form, label: string) => (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full"
        style={fieldStyle}
      />
    </div>
  );

  return (
    <AdminPage>
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        <ChevronLeft size={13} />
        Clients & leads
      </Link>

      <PageHeader
        title={client.company || client.name}
        subtitle={client.company ? client.name : `Client depuis le ${new Date(client.createdAt).toLocaleDateString("fr-FR")}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={newLead} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
              <Plus size={13} />
              Lead
            </button>
            <Link href={`/admin/devis/nouveau?client=${client.id}`} className={btnPrimaryClass} style={btnPrimaryStyle}>
              <FileText size={13} />
              Créer un devis
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Colonne coordonnées */}
        <div className="space-y-4">
          <SectionCard title="Coordonnées">
            {editing ? (
              <>
                {input("name", "Nom *")}
                {input("company", "Société")}
                {input("email", "Email")}
                {input("phone", "Téléphone")}
                <div>
                  <label className={labelClass} style={{ color: T.textDim }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="px-4 py-3 text-sm outline-none focus:border-[#6B9FEE] w-full resize-y"
                    style={fieldStyle}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={saveClient} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
                    {busy ? "…" : "Enregistrer"}
                  </button>
                  <button type="button" onClick={fermerModification} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Écrire ou appeler était le geste le plus fréquent de la fiche,
                    et le plus lent : il fallait sélectionner à la souris, copier,
                    puis changer de logiciel. Un clic suffit désormais, et le bouton
                    de copie sert aux postes où la messagerie reste débranchée. */}
                <ul className="space-y-2.5 text-sm" style={{ color: T.textDim }}>
                  {client.company && (
                    <li className="flex items-center gap-2.5">
                      <Building2 size={14} style={{ color: T.muted, flexShrink: 0 }} />
                      {client.company}
                    </li>
                  )}
                  <li className="flex items-center gap-2.5 min-w-0">
                    <Mail size={14} style={{ color: T.muted, flexShrink: 0 }} />
                    {client.email ? (
                      <>
                        <a href={`mailto:${client.email}`} className="truncate transition-colors hover:text-[#F0F5FF]">
                          {client.email}
                        </a>
                        <CopyButton value={client.email} label="Email copié." />
                      </>
                    ) : (
                      <span style={{ color: T.muted }}>Pas d&apos;email</span>
                    )}
                  </li>
                  <li className="flex items-center gap-2.5 min-w-0">
                    <Phone size={14} style={{ color: T.muted, flexShrink: 0 }} />
                    {client.phone ? (
                      <>
                        <a href={`tel:${client.phone.replace(/[^+0-9]/g, "")}`} className="truncate transition-colors hover:text-[#F0F5FF]">
                          {client.phone}
                        </a>
                        <CopyButton value={client.phone} label="Numéro copié." />
                      </>
                    ) : (
                      <span style={{ color: T.muted }}>Pas de téléphone</span>
                    )}
                  </li>
                </ul>
                {client.notes && (
                  <p className="text-[13px] whitespace-pre-wrap pt-3" style={{ color: T.muted, borderTop: `1px solid ${T.border}` }}>
                    {client.notes}
                  </p>
                )}
                {/* Sur une fiche effacée, modifier revient à réinscrire ce que la
                    personne a demandé de retirer : les deux actions disparaissent.
                    « Supprimer » suit le droit du compte, comme partout ailleurs. */}
                {efface ? null : (
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={ouvrirModification}
                      className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
                      style={{ color: T.accent }}
                    >
                      <Pencil size={12} />
                      Modifier
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
                        style={{ color: T.muted }}
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {/* ── Données personnelles ──
              Une personne peut demander ce que vous détenez sur elle, et son
              effacement. Le délai de réponse est d'un mois. Répondre à la main
              suppose de fouiller six écrans, et supprimer la fiche laissait son
              nom, son adresse et son email sur chaque devis. */}
          <SectionCard title="Données personnelles">
            {/* Le bilan reste affiché après l'effacement : placé dans la branche
                « pas encore effacée », il disparaissait à la seconde même où la
                fiche basculait, avant d'avoir pu être lu. */}
            {bilan && (
              <div className="px-3 py-2.5 text-[12px]" style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.textDim }}>
                Effacement fait. Devis anonymisés : {bilan.devisAnonymises}. Pièces comptables conservées :{" "}
                {bilan.facturesConservees}. Pistes supprimées : {bilan.pistesSupprimees}. Rendez-vous,
                garanties et dossiers d&apos;immatriculation détachés.
              </div>
            )}
            {efface ? (
              <p className="text-sm" style={{ color: T.muted }}>
                Cette fiche a été effacée à la demande de la personne. Le détail de l&apos;opération figure
                dans les notes ci-dessus.
              </p>
            ) : (
              <>
                <p className="text-[12px]" style={{ color: T.muted }}>
                  Cette personne peut demander la copie de ses données, et leur effacement. Le délai légal
                  de réponse est d&apos;un mois.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={`/api/admin/clients/${client.id}/donnees`}
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:opacity-80"
                    style={{ color: T.accent }}
                  >
                    <Download size={12} />
                    Copie de ses données
                  </a>
                  {/* La remise de la copie reste ouverte à tous : sa route ne
                      filtre pas. L'effacement exige le droit de suppression. */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmErase(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
                      style={{ color: T.muted }}
                    >
                      <ShieldOff size={12} />
                      Effacer ses données
                    </button>
                  )}
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title={`Devis (${quotes.length})`}>
            {quotes.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>Aucun devis lié.</p>
            ) : (
              <ul>
                {quotes.map((q, i) => (
                  <li key={q.id}>
                    <Link
                      href={`/admin/devis/${q.id}`}
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
          {client.leads.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
              Aucune opportunité pour ce client.{" "}
              <button type="button" onClick={newLead} className="underline-offset-2 hover:underline" style={{ color: T.accent }}>
                Créer un lead.
              </button>
            </div>
          ) : (
            client.leads.map((lead) => (
              <LeadBlock key={lead.id} lead={lead} vehicles={vehicles} canDelete={canDelete} />
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce client ?"
        description="Ses leads et son historique d'interactions seront définitivement supprimés. Les devis liés sont conservés, avec les coordonnées qu'ils portent. Pour retirer aussi ces coordonnées, utilisez « Effacer ses données »."
        busy={busy}
        onConfirm={deleteClient}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* L'effacement est irréversible et touche des pièces comptables : ce que
          la loi oblige à conserver est annoncé AVANT de valider. */}
      <ConfirmDialog
        open={confirmErase}
        title="Effacer les données de cette personne ?"
        confirmLabel="Effacer"
        description={
          <>
            <span className="block">
              <strong style={{ color: T.textDim }}>Effacés</strong> : la fiche, les pistes commerciales et
              leur journal, les rendez-vous, les garanties, les dossiers d&apos;immatriculation, et les devis
              jamais facturés.
            </span>
            <span className="block mt-2">
              <strong style={{ color: T.textDim }}>Conservés</strong> : les factures et avoirs, avec le nom
              et l&apos;adresse. Le Code de commerce impose de garder les pièces comptables dix ans, et ces
              deux mentions sont obligatoires sur une facture. L&apos;email et le téléphone en sont retirés.
            </span>
            <span className="block mt-2">
              Une trace de la demande reste attachée à la fiche. L&apos;opération est irréversible.
            </span>
          </>
        }
        busy={busy}
        onConfirm={effacerDonnees}
        onCancel={() => setConfirmErase(false)}
      />
    </AdminPage>
  );
}
