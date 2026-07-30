"use client";

// Surveillance des emails : qui a le droit de recevoir, et ce qui est
// réellement parti. La liste rouge arrête un message avant l'envoi, en
// production comme ailleurs ; le journal montre chaque tentative.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Loader2, Lock, MailWarning, Send, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { T, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, btnPrimaryClass, btnPrimaryStyle, type Tone } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type BlockEntry = { id: string; value: string; reason: string; author: string; at: string };
export type LogEntry = {
  id: string;
  recipients: string;
  subject: string;
  outcome: string;
  reason: string;
  origin: string;
  mode: string;
  at: string;
};

const OUTCOME: Record<string, { label: string; tone: Tone; icon: typeof Send }> = {
  envoye: { label: "Envoyé", tone: "success", icon: CheckCircle2 },
  retenu: { label: "Retenu", tone: "warning", icon: Ban },
  refuse: { label: "Refusé", tone: "danger", icon: XCircle },
};

function stamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function EmailsClient({
  mode,
  hasKey,
  fixedEntries,
  envEntries,
  blocks,
  logs,
  canEdit,
}: {
  mode: string;
  hasKey: boolean;
  fixedEntries: string[];
  envEntries: string[];
  blocks: BlockEntry[];
  logs: LogEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<BlockEntry | null>(null);
  const [filter, setFilter] = useState<"tous" | "envoye" | "retenu" | "refuse">("tous");

  async function add() {
    if (busy || !value.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/emails/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`${j.value} est désormais bloqué : aucun message ne partira vers cette adresse.`);
      setValue("");
      setReason("");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'ajout a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: BlockEntry) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/emails/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.info(`${entry.value} peut de nouveau recevoir des messages.`);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Le retrait a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const shown = filter === "tous" ? logs : logs.filter((l) => l.outcome === filter);
  const counts = {
    envoye: logs.filter((l) => l.outcome === "envoye").length,
    retenu: logs.filter((l) => l.outcome === "retenu").length,
    refuse: logs.filter((l) => l.outcome === "refuse").length,
  };
  const totalBloque = fixedEntries.length + envEntries.length + blocks.length;

  const chip = (k: typeof filter, label: string, n?: number) => (
    <button
      key={k}
      type="button"
      onClick={() => setFilter(k)}
      aria-pressed={filter === k}
      className="adm-chip text-[11px] tracking-widest uppercase px-3 py-1.5 transition-colors"
      style={
        filter === k
          ? { backgroundColor: T.accent, color: T.bg, border: `1px solid ${T.accent}` }
          : { border: `1px solid ${T.border}`, color: T.textDim }
      }
    >
      {label}
      {n !== undefined && ` · ${n}`}
    </button>
  );

  return (
    <AdminPage>
      <PageHeader
        title="Emails"
        subtitle={`${totalBloque} destinataire${totalBloque > 1 ? "s" : ""} bloqué${totalBloque > 1 ? "s" : ""} · ${logs.length} envoi${logs.length > 1 ? "s" : ""} au journal.`}
      />

      {/* État de l'envoi */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        {mode === "live" ? (
          <>
            <Send size={16} style={{ color: T.accent }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              Les emails partent réellement depuis ce serveur.
            </span>
          </>
        ) : (
          <>
            <ShieldCheck size={16} style={{ color: T.success }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              Mode atelier : tout message qui pourrait atteindre une vraie personne est retenu.
            </span>
          </>
        )}
        {!hasKey && (
          <span className="ml-auto">
            <Tag tone="warning">Aucun service d&apos;envoi configuré</Tag>
          </span>
        )}
      </div>

      {/* Liste rouge */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Ban size={15} style={{ color: T.danger }} />
          <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Liste rouge</h2>
          <span className="text-xs" style={{ color: T.muted }}>· {totalBloque}</span>
        </div>
        <p className="text-[12px] mb-3" style={{ color: T.muted }}>
          Aucun message ne part vers ces adresses ni ces domaines, y compris depuis le site en ligne.
          Une entrée de domaine couvre toutes ses adresses.
        </p>

        <div style={{ border: `1px solid ${T.border}` }}>
          {fixedEntries.map((v, i) => (
            <div
              key={`fixe-${v}`}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <Lock size={13} style={{ color: T.muted }} />
              <span className="text-sm" style={{ color: T.text }}>{v}</span>
              <Tag tone="danger">Permanent</Tag>
              <span className="text-[11px]" style={{ color: T.muted }}>
                Inscrit dans le code du site : reste bloqué même en cas de panne.
              </span>
            </div>
          ))}
          {envEntries.map((v) => (
            <div key={`env-${v}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
              <Lock size={13} style={{ color: T.muted }} />
              <span className="text-sm" style={{ color: T.text }}>{v}</span>
              <Tag tone="muted">Réglage serveur</Tag>
            </div>
          ))}
          {blocks.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
              <Ban size={13} style={{ color: T.danger }} />
              <span className="text-sm" style={{ color: T.text }}>{b.value}</span>
              {b.reason && <span className="text-[11px] truncate min-w-0" style={{ color: T.muted }}>{b.reason}</span>}
              <span className="text-[11px] ml-auto whitespace-nowrap" style={{ color: T.muted }}>
                {stamp(b.at)}
                {b.author ? ` · ${b.author}` : ""}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setRemoving(b)}
                  disabled={busy}
                  title="Retirer de la liste rouge"
                  aria-label={`Retirer ${b.value} de la liste rouge`}
                  className="adm-act-danger inline-flex items-center justify-center w-8 h-8 disabled:opacity-40"
                  style={{ color: T.muted }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <div className="mt-4">
            <SectionCard title="Bloquer un destinataire">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex-1 min-w-[220px]">
                  <span className="block text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color: T.muted }}>
                    Adresse ou domaine
                  </span>
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                    placeholder="exemple.fr ou contact@exemple.fr"
                    className="w-full text-sm px-3 py-2.5"
                    style={fieldStyle}
                  />
                </label>
                <label className="flex-1 min-w-[220px]">
                  <span className="block text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color: T.muted }}>
                    Motif (optionnel)
                  </span>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                    placeholder="Ex. : prospect à ne plus contacter"
                    className="w-full text-sm px-3 py-2.5"
                    style={fieldStyle}
                  />
                </label>
                <button type="button" onClick={add} disabled={busy || !value.trim()} className={btnPrimaryClass} style={btnPrimaryStyle}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                  Bloquer
                </button>
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      {/* Journal */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <MailWarning size={15} style={{ color: T.accent }} />
          <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Journal des envois</h2>
          <span className="text-xs" style={{ color: T.muted }}>· {shown.length}</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {chip("tous", "Tous", logs.length)}
            {chip("envoye", "Envoyés", counts.envoye)}
            {chip("retenu", "Retenus", counts.retenu)}
            {chip("refuse", "Refusés", counts.refuse)}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="p-6 text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
            {logs.length === 0
              ? "Chaque email du site s'inscrira ici : destinataire, objet, et ce qu'il est devenu."
              : "Aucun envoi de cette sorte pour l'instant."}
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.border}` }}>
            {shown.map((l, i) => {
              const o = OUTCOME[l.outcome] ?? { label: l.outcome, tone: "muted" as Tone, icon: Send };
              const Icon = o.icon;
              return (
                <div
                  key={l.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
                >
                  <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                    {stamp(l.at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                    <Icon size={12} style={{ color: o.tone === "success" ? T.success : o.tone === "danger" ? T.danger : T.warning }} />
                    <Tag tone={o.tone}>{o.label}</Tag>
                  </span>
                  <span className="text-[12px] truncate min-w-0" style={{ color: T.text }}>{l.recipients}</span>
                  <span className="text-[12px] truncate min-w-0" style={{ color: T.textDim }}>{l.subject}</span>
                  {l.reason && <span className="text-[11px] truncate min-w-0" style={{ color: T.muted }}>{l.reason}</span>}
                  {l.origin && <span className="text-[11px] ml-auto whitespace-nowrap" style={{ color: T.muted }}>{l.origin}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Débloquer ${removing.value} ?` : ""}
        description="Les messages du site pourront de nouveau partir vers ce destinataire."
        confirmLabel="Débloquer"
        busy={busy}
        onConfirm={() => {
          if (removing) remove(removing);
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </AdminPage>
  );
}
