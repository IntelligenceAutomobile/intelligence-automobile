"use client";

// Centre de relances : le système liste ce qui doit être relancé (devis en
// attente de réponse, factures échues) ; l'utilisateur relit l'email dans un
// aperçu avant de l'envoyer, reporte pour la durée de son choix, ou note une
// relance faite au téléphone. Chaque ligne traitée reste affichée, grisée, le
// temps de la session : interrompu au milieu de ses relances, on retrouve ce
// qui est déjà fait.
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Clock, FileText, ReceiptText, CheckCircle2, Loader2, Phone, ChevronDown, type LucideIcon } from "lucide-react";
import { formatDateFr } from "@/lib/devis";
import { T, AdminPage, PageHeader } from "../ui";
import { ConfirmDialog } from "../confirm";
import { useToast } from "../toast";
import { ApiError, RelanceDialog, relanceApi, type RelancePreview } from "./RelanceDialog";
import {
  RelanceLine,
  RelanceSection,
  HistorySection,
  relancesSubtitle,
  ghostBtnClass,
  ghostBorder,
  primaryBtnClass,
  RELANCES_VIDE,
  HINT_DEVIS,
  HINT_FACTURES,
  type RelanceView,
  type HistoryView,
} from "./presentation";

// Le back-office ajoute le téléphone du client aux valeurs affichées : il sert à
// proposer l'appel quand l'email est écarté.
export type RelanceItem = RelanceView & { clientPhone: string };
export type HistoryEntry = HistoryView;

type TreatedAction = "relance" | "manual" | "snooze" | "mute";
type Treated = { item: RelanceItem; action: TreatedAction; at: string; until?: string };
type BusyKind = "preview" | "send" | "snooze" | "mute" | "manual" | "undo";
type RowBusy = BusyKind | null;

type Preview = { it: RelanceItem; data: RelancePreview };


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

/* ── Actions d'une ligne : ce que le back-office met dans l'habillage partagé ── */
function RowActions({
  it,
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

  // Ligne déjà traitée : l'état remplace les boutons, avec l'heure de l'action.
  if (treated) {
    return (
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
    );
  }

  return (
    <div className="relative z-10 flex items-center gap-2">
      {it.blocked ? (
        // Destinataire en liste rouge : l'envoi par email est écarté, la relance
        // téléphonique reste possible. Le déblocage se fait dans Réglages → Emails.
        <button
          type="button"
          onClick={() => onManual(it)}
          disabled={busy !== null}
          aria-label={`${it.clientEmail} est en liste rouge : noter ${it.number} comme ${isFacture ? "relancée" : "relancé"} par téléphone`}
          title={`${it.clientEmail} est en liste rouge : aucun email ne part vers ce destinataire. Réglages → Emails pour le débloquer.`}
          className={ghostBtnClass}
          style={{ borderColor: "rgba(255,107,53,0.45)", color: T.danger }}
        >
          {busy === "manual" ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />}
          Par téléphone
        </button>
      ) : it.clientEmail ? (
        <button
          type="button"
          onClick={() => onRelance(it)}
          disabled={busy !== null}
          aria-label={`Relancer ${it.number} (${it.client || "sans client"}) par email`}
          className={primaryBtnClass}
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
            withPhone={Boolean(it.clientEmail) && !it.blocked}
            feminin={isFacture}
            onPick={(choice) => onMenuPick(it, choice)}
            onClose={() => onMenuToggle(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Une section du centre : l'habillage vient du module partagé ── */
function Section({
  title,
  hint,
  icon,
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
  icon: LucideIcon;
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

  const ligne = (it: RelanceItem, first: boolean, t: Treated | undefined) => (
    <RelanceLine
      key={it.id}
      it={it}
      first={first}
      href={`/admin/devis/${it.id}`}
      faded={Boolean(t)}
      actions={
        <RowActions
          it={it}
          treated={t}
          busy={busy && busy.id === it.id ? busy.kind : null}
          menuOpen={menuId === it.id}
          onRelance={onRelance}
          onMenuToggle={onMenuToggle}
          onMenuPick={onMenuPick}
          onManual={onManual}
          onUndo={onUndo}
        />
      }
    />
  );

  return (
    <RelanceSection
      title={title}
      hint={hint}
      icon={icon}
      count={remaining.length}
      sum={sum}
      empty={items.length === 0 && appended.length === 0}
    >
      {items.map((it, i) => ligne(it, i === 0, treatedMap.get(it.id)))}
      {appended.map((t, i) => ligne(t.item, items.length === 0 && i === 0, t))}
    </RelanceSection>
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
        subtitle={relancesSubtitle(remainingCount, remainingSum)}
      />

      {empty ? (
        <div className="p-10 text-center text-sm inline-flex items-center gap-2 w-full justify-center mb-8" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={16} style={{ color: T.success }} />
          {RELANCES_VIDE}
        </div>
      ) : (
        <>
          <Section
            title="Devis en attente de réponse"
            hint={HINT_DEVIS}
            icon={FileText}
            items={devis}
            treated={treated.filter((t) => t.item.kind === "devis")}
            {...sectionShared}
          />
          <Section
            title="Factures impayées"
            hint={HINT_FACTURES}
            icon={ReceiptText}
            items={factures}
            treated={treated.filter((t) => t.item.kind === "facture")}
            {...sectionShared}
          />
        </>
      )}

      <HistorySection entries={history} hrefOf={(e) => `/admin/devis/${e.quoteId}`} />

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
