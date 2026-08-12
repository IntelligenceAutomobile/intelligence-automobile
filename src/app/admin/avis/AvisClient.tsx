"use client";

// Demande d'avis Google : le système liste les clients ayant acheté ; on les
// invite à laisser un avis, après relecture du message qu'ils recevront, puis
// on suit ce que la demande devient.
//
// L'habillage des lignes et des sections vit dans presentation.tsx, partagé
// avec la démonstration publique /demopro. L'aperçu reprend la coquille des
// relances (../EnvoiDialog).
import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, Send, Check, Clock3, Loader2, Settings2, Sparkles, Mail,
  Hand, Ban, PauseCircle, Undo2, BellRing, Search, X,
} from "lucide-react";
import { AVIS_CONSEIL_MOMENT } from "@/lib/avis";
import { matchesSearch } from "@/lib/vehicules";
import { formatNumber } from "@/lib/format";
import { T, TONE, AdminPage, PageHeader, fieldStyle } from "../ui";
import { ApiError } from "../EnvoiDialog";
import { useToast } from "../toast";
import { AvisDialog, type AvisPreview, type AvisTarget } from "./AvisDialog";
import { AvisMenu, type AvisMenuItem } from "./AvisMenu";
import { Supports } from "./Supports";
import {
  AvisJournal,
  AvisLine,
  AvisRegle,
  AvisRepli,
  AvisSection,
  AvisTuiles,
  AvisVide,
  avisSubtitle,
  ghostBtnClass,
  ghostBorder,
  primaryBtnClass,
  AVIS_PREMIERE_VISITE,
  AVIS_TRAVAIL_FAIT,
  type AvisLogView,
  type AvisTuile,
  type AvisView,
} from "./presentation";

/* ── Ce que chaque état propose, hors envoi ── */
const ECARTER: AvisMenuItem = { key: "ecart", label: "Écarter", icon: Ban, ask: "Motif court, par exemple : adresse invalide", tone: "muted" };
const SUR_PLACE: AvisMenuItem = { key: "manuel", label: "Sollicité sur place", icon: Hand };
const REMETTRE: AvisMenuItem = { key: "reprise", label: "Remettre dans la liste", icon: Undo2 };
const ATTENTE_ITEMS: AvisMenuItem[] = [
  { key: "avis", label: "Avis reçu", icon: Star, tone: "success" },
  { key: "report", label: "Reporter de 7 jours", icon: PauseCircle, tone: "warning" },
  { key: "stop", label: "Laisser ce client tranquille", icon: Ban, ask: "Motif court (optionnel)", tone: "muted" },
];

/** Pastilles de filtre : chacune montre un seul bloc de la file. */
const PASTILLES = [
  { value: "pret", label: "Prêts" },
  { value: "bientot", label: "Bientôt" },
  { value: "attente", label: "En attente" },
  { value: "avis", label: "Avis obtenus" },
] as const;

/** Longueur d'une page de liste : au-delà, le bouton « Afficher de plus » prend le relais. */
const PAGE = 12;

export default function AvisClient({
  prets,
  bientot,
  anciennes,
  attente,
  avis,
  ecartes,
  journal,
  tuiles,
  supports,
  reviewLinkSet,
  canSettings,
}: {
  prets: AvisView[];
  bientot: AvisView[];
  anciennes: AvisView[];
  attente: AvisView[];
  avis: AvisView[];
  ecartes: AvisView[];
  journal: AvisLogView[];
  tuiles: AvisTuile[];
  supports: { lien: string; qr: string; sms: string };
  reviewLinkSet: boolean;
  /** Le lien Google se règle dans Réglages, page réservée au patron. */
  canSettings: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [state, setState] = useState<{ target: AvisTarget; preview: AvisPreview } | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("");
  const champ = useRef<HTMLInputElement>(null);

  function erreur(e: unknown, defaut: string) {
    toast.error(e instanceof Error && e.message ? e.message : defaut);
  }

  // Relire avant d'envoyer : le bouton ouvre l'aperçu, le serveur y met le
  // corps exact qui partira.
  async function ouvrir(r: AvisView) {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/avis/${r.id}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(typeof j.error === "string" ? j.error : "", res.status);
      setState({ target: { id: r.id, name: r.name }, preview: j as AvisPreview });
    } catch (e) {
      erreur(e, "La préparation de l'aperçu a échoué.");
      // Une ligne refusée vient d'une page qui a vieilli : la liste se remet à jour.
      if (e instanceof ApiError && e.status === 409) startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function envoyer(message: string) {
    if (!state) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/avis/${state.target.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "envoi", message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(typeof j.error === "string" ? j.error : "", res.status);
      setState(null);
      // L'email est parti. Un avertissement signale l'enregistrement manqué :
      // la ligne reviendra dans la liste alors que le client a bien reçu le mot.
      if (j.warning) toast.info(j.warning);
      else toast.success(j.message || "Invitation envoyée par email.");
      startTransition(() => router.refresh());
    } catch (e) {
      // Panne d'envoi passagère : le dialogue reste ouvert, message intact.
      if (e instanceof ApiError && (e.status === 502 || e.status === 503)) erreur(e, "L'envoi a échoué.");
      else {
        setState(null);
        erreur(e, "L'envoi a échoué.");
        startTransition(() => router.refresh());
      }
    } finally {
      setSending(false);
    }
  }

  /* ── Les gestes qui classent : aucun message ne part ── */
  async function classer(r: AvisView, action: string, note: string) {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/avis/${r.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(typeof j.error === "string" ? j.error : "", res.status);
      toast.success(j.message || "C'est noté.");
      startTransition(() => router.refresh());
    } catch (e) {
      erreur(e, "L'action a échoué.");
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  function menu(r: AvisView, items: AvisMenuItem[]) {
    return (
      <AvisMenu
        items={items}
        busy={busy === r.id}
        ariaLabel={`Autres actions pour ${r.name}`}
        onSelect={(key, note) => classer(r, key, note)}
      />
    );
  }

  function actionsAFaire(r: AvisView) {
    return (
      <>
        <BoutonEnvoi r={r} busy={busy === r.id} reviewLinkSet={reviewLinkSet} onClick={() => ouvrir(r)} />
        {menu(r, [SUR_PLACE, ECARTER])}
      </>
    );
  }

  /* ── Recherche : elle porte sur le nom, l'email, le véhicule et le motif ── */
  const cherche = (liste: AvisView[]) =>
    recherche
      ? liste.filter((r) => matchesSearch(`${r.name} ${r.email} ${r.vehicle} ${r.reason} ${r.note}`, recherche))
      : liste;

  const vus = useMemo(
    () => ({
      prets: cherche(prets),
      bientot: cherche(bientot),
      anciennes: cherche(anciennes),
      attente: cherche(attente),
      avis: cherche(avis),
      ecartes: cherche(ecartes),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prets, bientot, anciennes, attente, avis, ecartes, recherche],
  );

  const comptes: Record<string, number> = {
    pret: prets.length + anciennes.length,
    bientot: bientot.length,
    attente: attente.length,
    avis: avis.length,
  };
  const montre = (cle: string) => filtre === "" || filtre === cle;

  // Première visite (aucun acheteur) et travail terminé sont deux situations
  // différentes : féliciter un compte qui n'a rien envoyé sonnait faux.
  const total = prets.length + bientot.length + anciennes.length + attente.length + avis.length + ecartes.length;
  const jamaisRien = total === 0;
  const aFaire = prets.length + anciennes.length;
  const trouves = Object.values(vus).reduce((n, l) => n + l.length, 0);

  return (
    <AdminPage>
      <PageHeader title="Avis clients" subtitle={avisSubtitle(aFaire, attente.length, avis.length)} />

      {!reviewLinkSet &&
        (canSettings ? (
          <Link
            href="/admin/marque"
            className="adm-btn-focus flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 mb-6"
            style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}` }}
          >
            <Settings2 size={16} style={{ color: T.warning, flexShrink: 0 }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>
                Lien Google à renseigner.
              </span>
              {" Posez-le dans Réglages → Marque blanche, les invitations s'activent aussitôt."}
            </span>
            <span className="text-[11px] tracking-widest uppercase sm:ml-auto" style={{ color: T.accent }}>
              Configurer →
            </span>
          </Link>
        ) : (
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 mb-6"
            style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}` }}
          >
            <Settings2 size={16} style={{ color: T.warning, flexShrink: 0 }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>
                Lien Google à renseigner.
              </span>
              {" Votre responsable le pose dans Réglages, les invitations s'activent ensuite."}
            </span>
          </div>
        ))}

      {total > 0 && <AvisTuiles tuiles={tuiles} actif={filtre} onFiltre={(c) => setFiltre(c)} />}

      {/* Recherche et pastilles */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6">
          <div className="relative sm:max-w-xs w-full">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
            <input
              ref={champ}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, email, véhicule…"
              aria-label="Rechercher un acheteur"
              className="pl-11 pr-10 py-3 text-sm outline-none w-full focus:border-[#6B9FEE]"
              style={fieldStyle}
            />
            {recherche && (
              <button
                type="button"
                onClick={() => { setRecherche(""); champ.current?.focus(); }}
                aria-label="Effacer la recherche"
                className="adm-act absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: T.muted }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {PASTILLES.map((p) => {
              const n = comptes[p.value] ?? 0;
              if (n === 0) return null;
              const actif = filtre === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setFiltre(actif ? "" : p.value)}
                  className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
                  style={{
                    borderColor: actif ? T.accent : T.border,
                    color: actif ? T.bg : T.textDim,
                    backgroundColor: actif ? T.accent : "transparent",
                  }}
                >
                  {p.label}
                  <span style={{ opacity: 0.75 }}>{formatNumber(n)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {recherche && trouves === 0 && (
        <AvisVide icon={Search} tone={T.muted}>
          La recherche porte sur le nom, l&apos;email, le véhicule et le motif.{" "}
          <button type="button" onClick={() => setRecherche("")} className="adm-act underline underline-offset-2" style={{ color: T.accent }}>
            Revenir à la liste complète
          </button>
        </AvisVide>
      )}

      {montre("pret") && (
        <AvisSection
          title="À solliciter"
          icon={Star}
          count={vus.prets.length}
          empty={
            recherche ? null : jamaisRien ? (
              <AvisVide icon={Sparkles} tone={T.accent}>
                {AVIS_PREMIERE_VISITE}{" "}
                <Link href="/admin/clients" className="adm-act underline underline-offset-2" style={{ color: T.accent }}>
                  Ouvrir le carnet clients
                </Link>
              </AvisVide>
            ) : (
              <AvisVide icon={Check}>{AVIS_TRAVAIL_FAIT}</AvisVide>
            )
          }
        >
          <Liste rows={vus.prets} rendu={(r, first) => (
            <AvisLine key={r.id} it={r} first={first} href={`/admin/clients/${r.id}`} actions={actionsAFaire(r)} />
          )} />
        </AvisSection>
      )}

      {montre("bientot") && vus.bientot.length > 0 && (
        <AvisSection title="Bientôt" icon={Clock3} count={vus.bientot.length} hint={AVIS_CONSEIL_MOMENT}>
          <Liste rows={vus.bientot} rendu={(r, first) => (
            <AvisLine key={r.id} it={r} first={first} href={`/admin/clients/${r.id}`} actions={menu(r, [SUR_PLACE, ECARTER])} />
          )} />
        </AvisSection>
      )}

      {montre("attente") && vus.attente.length > 0 && (
        <AvisSection title="En attente de réponse" icon={Mail} count={vus.attente.length}>
          <Liste rows={vus.attente} rendu={(r, first) => (
            <AvisLine
              key={r.id}
              it={r}
              first={first}
              href={`/admin/clients/${r.id}`}
              actions={
                <>
                  {r.rappelDu && (
                    <button
                      type="button"
                      onClick={() => ouvrir(r)}
                      disabled={busy === r.id || !reviewLinkSet || !r.email || r.blocked}
                      title="Relire puis envoyer le rappel"
                      className={`${ghostBtnClass} relative z-10`}
                      style={{ borderColor: ghostBorder, color: T.warning }}
                    >
                      {busy === r.id ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                      Relancer
                    </button>
                  )}
                  {menu(r, ATTENTE_ITEMS)}
                </>
              }
            />
          )} />
        </AvisSection>
      )}

      {montre("pret") && (
        <AvisRepli title="Ventes anciennes" count={vus.anciennes.length}>
          <Liste rows={vus.anciennes} rendu={(r, first) => (
            <AvisLine key={r.id} it={r} first={first} href={`/admin/clients/${r.id}`} actions={actionsAFaire(r)} />
          )} />
        </AvisRepli>
      )}

      {montre("avis") && (
        <AvisRepli title="Avis obtenus" count={vus.avis.length}>
          <Liste rows={vus.avis} rendu={(r, first) => (
            <AvisLine key={r.id} it={r} first={first} href={`/admin/clients/${r.id}`} actions={menu(r, [REMETTRE])} />
          )} />
        </AvisRepli>
      )}

      {filtre === "" && (
        <AvisRepli title="Écartés et arrêts" count={vus.ecartes.length}>
          <Liste rows={vus.ecartes} rendu={(r, first) => (
            <AvisLine key={r.id} it={r} first={first} href={`/admin/clients/${r.id}`} actions={menu(r, [REMETTRE])} />
          )} />
        </AvisRepli>
      )}

      {filtre === "" && recherche === "" && (
        <>
          {supports.qr && <Supports lien={supports.lien} qr={supports.qr} sms={supports.sms} />}
          <AvisJournal entries={journal} />
        </>
      )}

      {total > 0 && <AvisRegle />}

      {state && (
        <AvisDialog
          target={state.target}
          preview={state.preview}
          sending={sending}
          onSend={envoyer}
          onCancel={() => setState(null)}
        />
      )}
    </AdminPage>
  );
}

/* ── Une liste paginée : les blocs longs cessent de dérouler l'écran ── */
function Liste({ rows, rendu }: { rows: AvisView[]; rendu: (r: AvisView, first: boolean) => ReactNode }) {
  const [affichees, setAffichees] = useState(PAGE);
  const visibles = rows.slice(0, affichees);
  const reste = rows.length - visibles.length;

  return (
    <>
      {visibles.map((r, i) => rendu(r, i === 0))}
      {reste > 0 && (
        <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid ${T.border}` }}>
          <button
            type="button"
            onClick={() => setAffichees((n) => n + PAGE)}
            className="adm-act text-[11px] tracking-widest uppercase"
            style={{ color: T.accent }}
          >
            Afficher {formatNumber(Math.min(PAGE, reste))} de plus · {formatNumber(reste)} restant{reste > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </>
  );
}

/* ── Le bouton dit son état : ce qui l'empêche se lit avant le clic ── */
function BoutonEnvoi({
  r,
  busy,
  reviewLinkSet,
  onClick,
}: {
  r: AvisView;
  busy: boolean;
  reviewLinkSet: boolean;
  onClick: () => void;
}) {
  const empeche = !r.email
    ? "Renseignez une adresse email sur la fiche du client."
    : r.blocked
      ? "Ce client est en liste rouge : les messages du site s'arrêtent avant lui."
      : !reviewLinkSet
        ? "Renseignez le lien Google dans Réglages → Marque blanche."
        : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || Boolean(empeche)}
      title={empeche || "Relire puis envoyer l'invitation à laisser un avis"}
      className={`${primaryBtnClass} relative z-10`}
      style={{ backgroundColor: T.accent, color: T.bg }}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
      {busy ? "Ouverture…" : "Demander un avis"}
    </button>
  );
}
