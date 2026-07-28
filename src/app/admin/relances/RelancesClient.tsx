"use client";

// Centre de relances : le système liste ce qui doit être relancé (devis en
// attente de réponse, factures échues) ; l'utilisateur relit l'email dans un
// aperçu avant de l'envoyer, reporte pour la durée de son choix, ou note une
// relance faite au téléphone. Chaque ligne traitée reste affichée, grisée, le
// temps de la session : interrompu au milieu de ses relances, on retrouve ce
// qui est déjà fait.
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Clock, FileText, ReceiptText, CheckCircle2, MailPlus, Loader2, Phone, ChevronDown, History, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import { formatEuro, formatDateFr } from "@/lib/devis";
import { DEVIS_RELANCE_DAYS, FACTURE_RELANCE_DAYS } from "@/lib/relances";
import { T, Tag, AdminPage, PageHeader } from "../ui";
import { ConfirmDialog } from "../confirm";
import { useToast } from "../toast";
import { ApiError, RelanceDialog, relanceApi, type RelancePreview } from "./RelanceDialog";

export type RelanceItem = {
  id: string;
  number: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  amount: number;
  kind: "devis" | "facture";
  // Jours sans réponse (devis) ou jours de retard après échéance (facture).
  sinceDays: number;
  relanceCount: number;
  lastRelanceDate: string;
  // Date affichée comme point de départ : envoi réel du devis, émission de la facture.
  startDate: string;
  // Validité du devis dépassée : un renvoi vaut mieux qu'une relance.
  expired: boolean;
};

// Une ligne du journal des actions, telle qu'elle vient du serveur.
export type HistoryEntry = {
  id: string;
  quoteId: string;
  number: string;
  client: string;
  action: string;
  detail: string;
  author: string;
  at: string;
};

type TreatedAction = "relance" | "manual" | "snooze" | "mute";
type Treated = { item: RelanceItem; action: TreatedAction; at: string; until?: string };
type BusyKind = "preview" | "send" | "snooze" | "mute" | "manual" | "undo";
type RowBusy = BusyKind | null;

type Preview = { it: RelanceItem; data: RelancePreview };

const ghostBorder = "rgba(159,179,212,0.45)";

/* ── Menu du bouton « Reporter » : durées, arrêt, relance téléphonique ── */
function ReportMenu({
  withPhone,
  feminin,
  onPick,
  onClose,
}: {
  withPhone: boolean;
  feminin: boolean;
  onPick: (choice: "7" | "30" | "mute" | "manual") => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const itemClass = "adm-nav-item w-full text-left px-3.5 py-2.5 text-[12px] whitespace-nowrap";

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div
        role="menu"
        className="absolute right-0 top-full mt-1 z-30 min-w-[220px] py-1"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 14px 34px rgba(0,0,0,0.45)" }}
      >
        <button type="button" role="menuitem" className={itemClass} style={{ color: T.textDim }} onClick={() => onPick("7")}>
          Reporter d&apos;une semaine
        </button>
        <button type="button" role="menuitem" className={itemClass} style={{ color: T.textDim }} onClick={() => onPick("30")}>
          Reporter d&apos;un mois
        </button>
        {withPhone && (
          <button type="button" role="menuitem" className={itemClass} style={{ color: T.textDim }} onClick={() => onPick("manual")}>
            {feminin ? "Relancée" : "Relancé"} par téléphone
          </button>
        )}
        <div className="my-1" style={{ borderTop: `1px solid ${T.border}` }} />
        <button type="button" role="menuitem" className={itemClass} style={{ color: T.danger }} onClick={() => onPick("mute")}>
          Ne plus relancer
        </button>
      </div>
    </>
  );
}

/* ── Une ligne du centre ── */
function Row({
  it,
  first,
  busy,
  menuOpen,
  treated,
  onRelance,
  onMenuToggle,
  onMenuPick,
  onManual,
  onUndo,
}: {
  it: RelanceItem;
  first: boolean;
  busy: RowBusy;
  menuOpen: boolean;
  treated: Treated | undefined;
  onRelance: (it: RelanceItem) => void;
  onMenuToggle: (id: string | null) => void;
  onMenuPick: (it: RelanceItem, choice: "7" | "30" | "mute" | "manual") => void;
  onManual: (it: RelanceItem) => void;
  onUndo: (t: Treated) => void;
}) {
  const isFacture = it.kind === "facture";
  const tone = isFacture
    ? it.sinceDays >= FACTURE_RELANCE_DAYS ? "danger" : "warning"
    : it.sinceDays >= DEVIS_RELANCE_DAYS * 2 ? "danger" : "warning";
  const ageText = isFacture ? `retard ${it.sinceDays} j` : `${it.sinceDays} j`;
  const ageTitle = isFacture
    ? `Échéance dépassée depuis ${it.sinceDays} jour${it.sinceDays > 1 ? "s" : ""}`
    : `Sans réponse depuis ${it.sinceDays} jour${it.sinceDays > 1 ? "s" : ""}`;

  const montant = (
    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
      {formatEuro(it.amount)}
    </span>
  );

  const ghostBtnClass =
    "adm-btn-focus inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 border transition-colors hover:border-[#6B9FEE] disabled:opacity-50";

  return (
    <div
      className="group relative grid items-center px-4 py-3 gap-x-3 gap-y-2
                 grid-cols-[1fr_auto]
                 @[800px]:grid-cols-[96px_minmax(120px,1fr)_110px_118px_auto]"
      style={{ borderTop: first ? "none" : `1px solid ${T.border}`, opacity: treated ? 0.55 : 1 }}
    >
      {/* Lien de couverture : toute la ligne ouvre la fiche, sauf les actions */}
      <Link
        href={`/admin/devis/${it.id}`}
        className="absolute inset-0 adm-btn-focus"
        aria-label={`Ouvrir ${isFacture ? "la facture" : "le devis"} ${it.number}`}
        style={{ zIndex: 0 }}
      />

      <span className="text-xs tracking-widest uppercase whitespace-nowrap" style={{ color: T.accent }}>
        {it.number}
      </span>

      {/* Ancienneté, calée à droite sur téléphone */}
      <span className="@[800px]:hidden justify-self-end" title={ageTitle}>
        <Tag tone={tone}>{ageText}</Tag>
      </span>

      <div className="min-w-0 col-span-2 @[800px]:col-span-1">
        <div className="text-sm truncate" style={{ color: it.client ? T.text : T.muted }}>
          {it.client || "Sans client"}
        </div>
        <div className="text-[11px] flex items-center gap-2 min-w-0" style={{ color: T.muted }}>
          <span className="whitespace-nowrap">{isFacture ? "Émise" : "Envoyé"} le {formatDateFr(it.startDate)}</span>
          {it.clientEmail ? (
            <span className="truncate">{it.clientEmail}</span>
          ) : (
            <Link
              href={`/admin/devis/${it.id}`}
              className="adm-act relative z-10 inline-flex items-center gap-1 whitespace-nowrap"
              style={{ color: T.warning }}
            >
              <MailPlus size={11} />
              Ajouter un email
            </Link>
          )}
          {it.expired && (
            <span className="whitespace-nowrap" style={{ color: T.danger }}>Validité dépassée</span>
          )}
          {it.relanceCount > 0 && (
            <span className="whitespace-nowrap" style={{ color: T.warning }}>
              {isFacture ? "Relancée" : "Relancé"} ×{it.relanceCount}
              {it.lastRelanceDate ? ` le ${formatDateFr(it.lastRelanceDate)}` : ""}
            </span>
          )}
        </div>
      </div>

      <span className="hidden @[800px]:block text-right">{montant}</span>

      <span className="hidden @[800px]:block" title={ageTitle}>
        <Tag tone={tone}>{ageText}</Tag>
      </span>

      {/* Barre d'actions : à part sur téléphone (montant inclus), en fin de ligne ensuite */}
      <div
        className="flex flex-wrap @[800px]:flex-nowrap items-center gap-x-3 gap-y-2 col-span-2 @[800px]:col-span-1 justify-between @[800px]:justify-end
                   border-t @[800px]:border-t-0 pt-2 @[800px]:pt-0"
        style={{ borderColor: T.border }}
      >
        <span className="@[800px]:hidden">{montant}</span>
        {treated ? (
          <span
            id={`relance-done-${it.id}`}
            tabIndex={-1}
            className="relative z-10 inline-flex items-center gap-1.5 text-[11px] outline-none"
            style={{ color: treated.action === "relance" || treated.action === "manual" ? T.success : T.muted }}
          >
            {treated.action === "relance" && <><CheckCircle2 size={13} /> Relance envoyée à {treated.at}</>}
            {treated.action === "manual" && <><Phone size={13} /> Relance notée (téléphone) à {treated.at}</>}
            {treated.action === "snooze" && <><Clock size={13} /> {isFacture ? "Reportée" : "Reporté"} · reviendra le {treated.until ? formatDateFr(treated.until) : "bientôt"}</>}
            {treated.action === "mute" && <><Clock size={13} /> Relances arrêtées</>}
            {(treated.action === "snooze" || treated.action === "mute") && (
              <button
                type="button"
                className="adm-act underline disabled:opacity-50"
                style={{ color: T.textDim }}
                disabled={busy !== null}
                onClick={() => onUndo(treated)}
              >
                {busy === "undo" ? <Loader2 size={11} className="animate-spin inline" /> : null} Annuler
              </button>
            )}
          </span>
        ) : (
          <div className="relative z-10 flex items-center gap-2">
            {it.clientEmail ? (
              <button
                type="button"
                onClick={() => onRelance(it)}
                disabled={busy !== null}
                aria-label={`Relancer ${it.number} (${it.client || "sans client"}) par email`}
                className="adm-btn-focus inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: T.accent, color: T.bg }}
              >
                {busy === "preview" || busy === "send" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Relancer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onManual(it)}
                disabled={busy !== null}
                aria-label={`Noter ${it.number} comme ${isFacture ? "relancée" : "relancé"} par téléphone`}
                className={ghostBtnClass}
                style={{ borderColor: ghostBorder, color: T.textDim }}
              >
                {busy === "manual" ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />}
                {isFacture ? "Relancée" : "Relancé"} par tél.
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => onMenuToggle(menuOpen ? null : it.id)}
                disabled={busy !== null}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Reporter ou arrêter les relances de ${it.number}`}
                className={ghostBtnClass}
                style={{ borderColor: ghostBorder, color: T.textDim }}
              >
                {busy === "snooze" || busy === "mute" ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
                Reporter
                <ChevronDown size={12} />
              </button>
              {menuOpen && (
                <ReportMenu
                  withPhone={Boolean(it.clientEmail)}
                  feminin={isFacture}
                  onPick={(choice) => onMenuPick(it, choice)}
                  onClose={() => onMenuToggle(null)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  icon: Icon,
  items,
  treated,
  treatedMap,
  busy,
  menuId,
  onRelance,
  onMenuToggle,
  onMenuPick,
  onManual,
  onUndo,
}: {
  title: string;
  hint: string;
  icon: typeof FileText;
  items: RelanceItem[];
  treated: Treated[];
  treatedMap: Map<string, Treated>;
  busy: { id: string; kind: BusyKind } | null;
  menuId: string | null;
  onRelance: (it: RelanceItem) => void;
  onMenuToggle: (id: string | null) => void;
  onMenuPick: (it: RelanceItem, choice: "7" | "30" | "mute" | "manual") => void;
  onManual: (it: RelanceItem) => void;
  onUndo: (t: Treated) => void;
}) {
  const remaining = items.filter((it) => !treatedMap.has(it.id));
  const sum = remaining.reduce((s, it) => s + it.amount, 0);
  // Lignes traitées pendant la session et déjà sorties de la liste serveur :
  // elles restent affichées en fin de section, grisées.
  const itemIds = new Set(items.map((i) => i.id));
  const appended = treated.filter((t) => !itemIds.has(t.item.id));

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</h2>
        <span className="text-xs" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          · {remaining.length}
          {remaining.length > 0 && ` · ${formatEuro(sum)}`}
        </span>
      </div>
      {items.length === 0 && appended.length === 0 ? (
        <div className="p-6 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={15} style={{ color: T.success }} />
          {hint}
        </div>
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          {items.map((it, i) => (
            <Row
              key={it.id}
              it={it}
              first={i === 0}
              treated={treatedMap.get(it.id)}
              busy={busy && busy.id === it.id ? busy.kind : null}
              menuOpen={menuId === it.id}
              onRelance={onRelance}
              onMenuToggle={onMenuToggle}
              onMenuPick={onMenuPick}
              onManual={onManual}
              onUndo={onUndo}
            />
          ))}
          {appended.map((t, i) => (
            <Row
              key={t.item.id}
              it={t.item}
              first={items.length === 0 && i === 0}
              treated={t}
              busy={busy && busy.id === t.item.id ? busy.kind : null}
              menuOpen={false}
              onRelance={onRelance}
              onMenuToggle={onMenuToggle}
              onMenuPick={onMenuPick}
              onManual={onManual}
              onUndo={onUndo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Journal des actions : ce qui est parti, quand, et à qui ── */
const HISTORY_STYLE: Record<string, { icon: typeof Send; label: string; color: string }> = {
  email: { icon: Send, label: "Relance envoyée", color: T.success },
  telephone: { icon: Phone, label: "Relance par téléphone", color: T.success },
  report: { icon: Clock, label: "Report", color: T.muted },
  arret: { icon: XCircle, label: "Relances arrêtées", color: T.muted },
  annulation: { icon: RotateCcw, label: "Report annulé", color: T.muted },
  echec: { icon: AlertTriangle, label: "Envoi en échec", color: T.danger },
};

function HistorySection({ entries }: { entries: HistoryEntry[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? entries : entries.slice(0, 6);

  const stamp = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <History size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Historique des actions</h2>
        <span className="text-xs" style={{ color: T.muted }}>· {entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <div className="p-6 text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Vos relances, reports et appels s&apos;inscriront ici, avec la date, l&apos;heure et le destinataire.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {shown.map((e, i) => {
            const s = HISTORY_STYLE[e.action] ?? { icon: History, label: e.action, color: T.muted };
            const Icon = s.icon;
            return (
              <div
                key={e.id}
                className="relative flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <Link href={`/admin/devis/${e.quoteId}`} className="absolute inset-0 adm-btn-focus" aria-label={`Ouvrir ${e.number}`} style={{ zIndex: 0 }} />
                <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                  {stamp(e.at)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap" style={{ color: s.color }}>
                  <Icon size={12} />
                  {s.label}
                </span>
                <span className="text-[12px] whitespace-nowrap" style={{ color: T.accent }}>{e.number}</span>
                {e.client && <span className="text-[12px] truncate min-w-0" style={{ color: T.textDim }}>{e.client}</span>}
                {e.detail && <span className="text-[11px] truncate min-w-0" style={{ color: T.muted }}>{e.detail}</span>}
                {e.author && <span className="text-[11px] ml-auto whitespace-nowrap" style={{ color: T.muted }}>{e.author}</span>}
              </div>
            );
          })}
          {entries.length > 6 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="adm-btn-focus w-full px-4 py-2.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
              style={{ borderTop: `1px solid ${T.border}`, color: T.textDim }}
            >
              {open ? "Réduire" : `Afficher les ${entries.length - 6} actions précédentes`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RelancesClient({
  devis,
  factures,
  history,
}: {
  devis: RelanceItem[];
  factures: RelanceItem[];
  history: HistoryEntry[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<{ id: string; kind: BusyKind } | null>(null);
  const [treated, setTreated] = useState<Treated[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [sending, setSending] = useState(false);
  const [muteAsk, setMuteAsk] = useState<RelanceItem | null>(null);

  const treatedMap = useMemo(() => new Map(treated.map((t) => [t.item.id, t])), [treated]);

  const api = relanceApi;

  // Libère l'état occupé seulement si on en est encore propriétaire : une action
  // terminée sur une ligne effaçait le spinner d'une autre encore en cours.
  function release(id: string) {
    setBusy((cur) => (cur && cur.id === id ? null : cur));
  }

  function markTreated(it: RelanceItem, action: TreatedAction, until?: string) {
    const at = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setTreated((prev) => [...prev.filter((t) => t.item.id !== it.id), { item: it, action, at, until }]);
    // Le clavier suit : le focus passe sur l'état « fait » de la ligne.
    requestAnimationFrame(() => document.getElementById(`relance-done-${it.id}`)?.focus());
    startTransition(() => router.refresh());
  }

  function fail(e: unknown) {
    toast.error(e instanceof Error && e.message ? e.message : "L'action a échoué.");
    // La liste affichée peut dater (devis accepté, facture réglée entre-temps) :
    // un refus du serveur remet la page au courant.
    startTransition(() => router.refresh());
  }

  // Ouvre l'aperçu de l'email : rien ne part avant « Envoyer la relance ».
  async function openPreview(it: RelanceItem) {
    if (busy) return;
    setBusy({ id: it.id, kind: "preview" });
    try {
      const res = await fetch(`/api/admin/relances/${it.id}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(typeof j.error === "string" ? j.error : "", res.status);
      setPreview({ it, data: j as RelancePreview });
    } catch (e) {
      fail(e);
    } finally {
      release(it.id);
    }
  }

  async function sendRelance(message: string) {
    if (!preview) return;
    const it = preview.it;
    setSending(true);
    setBusy({ id: it.id, kind: "send" });
    try {
      const j = await api(it.id, { action: "relance", message });
      setPreview(null);
      markTreated(it, "relance");
      if (j.warning) toast.info(j.warning);
      else toast.success("Relance envoyée par email.");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 502 || e.status === 503)) {
        // Panne d'envoi passagère : le dialogue reste ouvert, message intact,
        // un nouvel essai suffit.
        toast.error(e.message || "L'envoi a échoué.");
      } else {
        setPreview(null);
        fail(e);
      }
    } finally {
      setSending(false);
      release(it.id);
    }
  }

  async function snooze(it: RelanceItem, days: 7 | 30) {
    if (busy) return;
    setBusy({ id: it.id, kind: "snooze" });
    try {
      const j = await api(it.id, { action: "snooze", days });
      markTreated(it, "snooze", j.until);
    } catch (e) {
      fail(e);
    } finally {
      release(it.id);
    }
  }

  async function mute(it: RelanceItem) {
    if (busy) return;
    setBusy({ id: it.id, kind: "mute" });
    try {
      await api(it.id, { action: "mute" });
      markTreated(it, "mute");
      toast.info("Relances arrêtées pour ce document.");
    } catch (e) {
      fail(e);
    } finally {
      release(it.id);
    }
  }

  async function manual(it: RelanceItem) {
    if (busy) return;
    setBusy({ id: it.id, kind: "manual" });
    try {
      await api(it.id, { action: "manual" });
      markTreated(it, "manual");
      toast.success("Relance notée : le document se met en sommeil pour le délai habituel.");
    } catch (e) {
      fail(e);
    } finally {
      release(it.id);
    }
  }

  // Annule un report (ou un arrêt) : la ligne redevient active après rechargement.
  async function undo(t: Treated) {
    if (busy) return;
    setBusy({ id: t.item.id, kind: "undo" });
    try {
      await api(t.item.id, { action: "unsnooze" });
      setTreated((prev) => prev.filter((x) => x.item.id !== t.item.id));
      toast.info("Report annulé, le document est de retour dans la liste.");
      startTransition(() => router.refresh());
    } catch (e) {
      fail(e);
    } finally {
      release(t.item.id);
    }
  }

  function onMenuPick(it: RelanceItem, choice: "7" | "30" | "mute" | "manual") {
    setMenuId(null);
    if (choice === "7") snooze(it, 7);
    else if (choice === "30") snooze(it, 30);
    else if (choice === "manual") manual(it);
    else setMuteAsk(it);
  }

  const remainingList = [...devis, ...factures].filter((it) => !treatedMap.has(it.id));
  const remainingCount = remainingList.length;
  const remainingSum = remainingList.reduce((s, it) => s + it.amount, 0);
  const empty = devis.length + factures.length + treated.length === 0;

  const sectionShared = {
    treatedMap,
    busy,
    menuId,
    onRelance: openPreview,
    onMenuToggle: setMenuId,
    onMenuPick,
    onManual: manual,
    onUndo: undo,
  };

  return (
    <AdminPage>
      <PageHeader
        title="Relances"
        subtitle={
          remainingCount === 0
            ? "Tout est à jour."
            : `${remainingCount} relance${remainingCount > 1 ? "s" : ""} à faire · ${formatEuro(remainingSum)} en attente.`
        }
      />

      {empty ? (
        <div className="p-10 text-center text-sm inline-flex items-center gap-2 w-full justify-center mb-8" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={16} style={{ color: T.success }} />
          Tout est à jour. Le centre se remplit tout seul dès qu&apos;un devis attend une réponse ou qu&apos;une facture dépasse son échéance.
        </div>
      ) : (
        <>
          <Section
            title="Devis en attente de réponse"
            hint="Tous vos devis ont reçu une réponse ou une relance récente."
            icon={FileText}
            items={devis}
            treated={treated.filter((t) => t.item.kind === "devis")}
            {...sectionShared}
          />
          <Section
            title="Factures impayées"
            hint="Toutes vos factures sont réglées ou relancées récemment."
            icon={ReceiptText}
            items={factures}
            treated={treated.filter((t) => t.item.kind === "facture")}
            {...sectionShared}
          />
        </>
      )}

      <HistorySection entries={history} />

      {preview && (
        <RelanceDialog
          target={{ id: preview.it.id, number: preview.it.number, client: preview.it.client, kind: preview.it.kind }}
          preview={preview.data}
          sending={sending}
          onSend={sendRelance}
          onCancel={() => setPreview(null)}
        />
      )}

      <ConfirmDialog
        open={muteAsk !== null}
        title="Arrêter les relances ?"
        description={
          muteAsk
            ? `${muteAsk.number} sortira du centre de relances. Le bouton Annuler de la ligne, ou un nouvel envoi du document, le réactiveront.`
            : undefined
        }
        confirmLabel="Arrêter"
        onConfirm={() => {
          if (muteAsk) mute(muteAsk);
          setMuteAsk(null);
        }}
        onCancel={() => setMuteAsk(null)}
      />
    </AdminPage>
  );
}
