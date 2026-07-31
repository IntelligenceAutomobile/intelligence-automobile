"use client";

// Reprises : liste de travail des estimations de véhicules clients.
//
// La saisie vit sur sa propre page (/admin/reprises/nouvelle). Cet écran sert à
// retrouver une estimation et à conclure une offre sans l'ouvrir.
//
// La ligne se lit sur deux niveaux : le véhicule et son montant en tête, le
// vendeur, la plaque et la référence juste dessous. Sur téléphone elle se
// déplie, là où le nom du véhicule se réduisait à deux lettres en se disputant
// la place avec le montant, l'étiquette et la date.
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, HandCoins, Search, X, Check, Car } from "lucide-react";
import { formatEuroCents } from "@/lib/comptes";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/vehicules";
import {
  REPRISE_FILTERS, REPRISE_STATUS_LABEL, REPRISE_STATUS_TONE, REFUSAL_REASONS, REFUSAL_REASON_LABEL,
  type RepriseStatus, type RepriseFilter, type RefusalReason,
} from "@/lib/reprises";
import { T, TONE, Tag, AdminPage, PageHeader, fieldStyle, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import { useToast } from "../toast";

export type RepriseRow = {
  id: string;
  reference: string;
  status: RepriseStatus;
  clientId: string | null;
  vehicule: string;
  vendeur: string;
  plate: string;
  vin: string;
  make: string;
  model: string;
  version: string;
  mileageKm: number;
  fuel: string;
  offerCents: number;
  offerDate: string;
  /** Ancienneté écrite côté serveur, avec une seule heure de référence. */
  anciennete: string;
  /** Texte sur lequel porte la recherche, assemblé côté serveur. */
  texteRecherche: string;
};

// Identité stable : sert de valeur de repli aux statuts posés à l'écran, pour
// que le mémo qui en dépend se recalcule à bon escient.
const AUCUN_STATUT_POSE: Record<string, RepriseStatus> = {};

// Les deux grilles de colonnes, déclarées une fois : l'en-tête et les lignes
// doivent porter exactement la même définition, sinon les colonnes se décalent.
const GRILLE =
  "@[640px]:grid-cols-[92px_minmax(140px,1fr)_112px_128px_92px] " +
  "@[980px]:grid-cols-[96px_minmax(160px,1fr)_116px_112px_136px_88px_92px]";

/* ── Une ligne ── */
function Ligne({
  r, premiere, occupee, onIssue,
}: {
  r: RepriseRow;
  premiere: boolean;
  occupee: boolean;
  onIssue: (r: RepriseRow, statut: "acceptee" | "refusee") => void;
}) {
  const ouverte = r.status === "brouillon" || r.status === "proposee";
  const actionClass =
    "adm-act inline-flex items-center justify-center gap-1.5 text-[11px] tracking-widest uppercase " +
    "transition-colors flex-shrink-0 relative z-10 px-2.5 py-1.5";

  return (
    <div
      className={`group relative grid items-center px-4 py-3 gap-x-3 gap-y-2 grid-cols-[1fr_auto] ${GRILLE}`}
      style={{ borderTop: premiere ? "none" : `1px solid ${T.border}`, opacity: occupee ? 0.6 : 1, transition: "opacity 0.15s" }}
    >
      {/* Lien de couverture : toute la ligne ouvre l'estimation, sauf les
          actions. Un bouton posé à l'intérieur d'un lien serait invalide et
          piégerait le clavier. */}
      <Link
        href={`/admin/reprises/${r.id}`}
        className="absolute inset-0"
        aria-label={`Ouvrir l'estimation ${r.reference}`}
        style={{ zIndex: 0 }}
      />

      <span className="text-xs tracking-widest uppercase whitespace-nowrap hidden @[640px]:block" style={{ color: T.accent }}>
        {r.reference}
      </span>

      <span className="min-w-0 col-span-2 @[640px]:col-span-1">
        <span className="flex items-center gap-2 min-w-0">
          <HandCoins size={15} className="@[640px]:hidden" style={{ color: T.accent, flexShrink: 0 }} />
          <span className="text-sm truncate" style={{ color: T.text }}>{r.vehicule}</span>
        </span>
        <span className="text-[11px] truncate block mt-0.5" style={{ color: T.muted }}>
          {[r.vendeur, r.mileageKm > 0 ? `${formatNumber(r.mileageKm)} km` : "", r.fuel]
            .filter(Boolean).join(" · ")}
          <span className="@[640px]:hidden">{r.plate ? ` · ${r.plate}` : ""} · {r.reference}</span>
        </span>
      </span>

      <span className="text-[12px] hidden @[980px]:block truncate" style={{ color: r.plate ? T.textDim : T.border }}>
        {r.plate || "—"}
      </span>

      <span
        className="text-sm font-semibold text-right whitespace-nowrap"
        style={{ color: r.offerCents > 0 ? T.text : T.border, fontVariantNumeric: "tabular-nums" }}
      >
        {r.offerCents > 0 ? formatEuroCents(r.offerCents) : "—"}
      </span>

      <span className="flex">
        <Tag tone={REPRISE_STATUS_TONE[r.status]}>{REPRISE_STATUS_LABEL[r.status]}</Tag>
      </span>

      <span className="text-[11px] text-right hidden @[980px]:block whitespace-nowrap" style={{ color: T.muted }}>
        {r.anciennete}
      </span>

      {/* Actions : une barre à part sur téléphone, un groupe en fin de ligne
          ensuite. Chacune arrête le clic pour laisser le lien tranquille.
          Une estimation conclue laisse la place vide : son issue se lit déjà
          dans la colonne Statut, juste à côté. */}
      {ouverte ? (
        <div
          className="adm-row-actions flex items-center gap-1 col-span-2 @[640px]:col-span-1 justify-start @[640px]:justify-end
                     border-t @[640px]:border-t-0 pt-1.5 @[640px]:pt-0"
          style={{ borderColor: T.border }}
        >
          <button
            type="button"
            disabled={occupee}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIssue(r, "acceptee"); }}
            className={actionClass}
            style={{ color: TONE.success.fg }}
            title="Le vendeur a accepté l'offre"
          >
            <Check size={13} />
            <span className="@[640px]:hidden @[980px]:inline">Acceptée</span>
          </button>
          <button
            type="button"
            disabled={occupee}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIssue(r, "refusee"); }}
            className={actionClass}
            style={{ color: T.muted }}
            title="Le vendeur a écarté l'offre"
          >
            <X size={13} />
            <span className="@[640px]:hidden @[980px]:inline">Refusée</span>
          </button>
        </div>
      ) : (
        <span className="hidden @[640px]:block" />
      )}
    </div>
  );
}

/* ── Écran vide ── */
function EcranVide({
  total, recherche, filtre, onReset,
}: {
  total: number;
  recherche: string;
  filtre: RepriseFilter;
  onReset: () => void;
}) {
  const cherche = recherche.trim() !== "";
  const filtre_pose = filtre !== "all";

  if (total === 0) {
    return (
      <div className="p-12 text-center" style={{ border: `1px solid ${T.border}` }}>
        <div className="flex justify-center mb-4" style={{ color: T.border }}><HandCoins size={28} /></div>
        <p className="text-sm mb-1" style={{ color: T.text }}>Votre première estimation s&apos;affichera ici.</p>
        <p className="text-[13px] mb-6" style={{ color: T.muted }}>
          L&apos;évaluation crée la fiche du vendeur, l&apos;offre datée, et l&apos;affaire qui suit dans le pipeline.
        </p>
        <Link href="/admin/reprises/nouvelle" className={btnPrimaryClass} style={btnPrimaryStyle}>+ Créer la première</Link>
      </div>
    );
  }

  const f = REPRISE_FILTERS.find((x) => x.value === filtre);
  let titre = `Rien dans « ${f?.label ?? ""} » pour l'instant.`;
  let aide = f?.vide || "Ce filtre se remplira dès qu'une estimation y entrera.";
  if (cherche && filtre_pose) {
    titre = `Rien dans « ${f?.label ?? ""} » pour « ${recherche.trim()} ».`;
    aide = "Élargissez la recherche ou changez de filtre.";
  } else if (cherche) {
    titre = `Aucune estimation pour « ${recherche.trim()} ».`;
    aide = "La recherche porte sur le véhicule, l'immatriculation, le numéro de série et le vendeur.";
  }

  return (
    <div className="p-12 text-center" style={{ border: `1px solid ${T.border}` }}>
      <div className="flex justify-center mb-4" style={{ color: T.border }}>
        {cherche ? <Search size={24} /> : <Car size={26} />}
      </div>
      <p className="text-sm mb-1" style={{ color: T.text }}>{titre}</p>
      <p className="text-[13px] mb-6" style={{ color: T.muted }}>{aide}</p>
      <button type="button" onClick={onReset} className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
        Revenir à toutes les estimations
      </button>
    </div>
  );
}

/* ── Choix du motif de refus ── */
function MotifRefus({
  reprise, busy, onValider, onAnnuler,
}: {
  reprise: RepriseRow;
  busy: boolean;
  onValider: (motif: RefusalReason) => void;
  onAnnuler: () => void;
}) {
  const [motif, setMotif] = useState<RefusalReason>("offre_basse");
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onAnnuler}
      role="dialog"
      aria-modal="true"
      aria-label="Motif du refus"
    >
      <div className="w-full max-w-md p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-medium mb-1.5" style={{ color: T.text }}>Offre refusée</h2>
        <p className="text-sm mb-5" style={{ color: T.muted }}>
          {reprise.vehicule} · {reprise.vendeur}. Le motif se relit plus tard pour savoir sur quoi les reprises échouent.
        </p>
        <select
          value={motif}
          onChange={(e) => setMotif(e.target.value as RefusalReason)}
          className="px-4 py-3 text-sm outline-none w-full cursor-pointer focus:border-[#6B9FEE]"
          style={fieldStyle}
        >
          {REFUSAL_REASONS.map((r) => <option key={r} value={r}>{REFUSAL_REASON_LABEL[r]}</option>)}
        </select>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onAnnuler} disabled={busy} className="text-[11px] tracking-widest uppercase px-5 py-3" style={{ color: T.textDim }}>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onValider(motif)}
            disabled={busy}
            className={btnPrimaryClass}
            style={btnPrimaryStyle}
          >
            {busy ? "…" : "Enregistrer le refus"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE = 80;

export default function ReprisesClient({
  reprises, total, filtreInitial, rechercheInitiale,
}: {
  reprises: RepriseRow[];
  total: number;
  filtreInitial: RepriseFilter;
  rechercheInitiale: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [filtre, setFiltre] = useState<RepriseFilter>(filtreInitial);
  const [recherche, setRecherche] = useState(rechercheInitiale);
  const [affichees, setAffichees] = useState(PAGE);
  const [occupees, setOccupees] = useState<Set<string>>(new Set());
  const [refus, setRefus] = useState<RepriseRow | null>(null);
  const champ = useRef<HTMLInputElement>(null);

  // Photo de situation : le statut posé à l'écran vaut tant que le serveur
  // renvoie exactement les mêmes lignes. Sans ce garde-fou, le rafraîchissement
  // qui suit l'action ressèmerait l'ancienne valeur, et l'étiquette reviendrait
  // en arrière sous les yeux. Le module Réunions a déjà payé ce piège.
  const [pose, setPose] = useState<{ pour: RepriseRow[]; statuts: Record<string, RepriseStatus> }>({
    pour: reprises,
    statuts: AUCUN_STATUT_POSE,
  });
  const statutsPoses = pose.pour === reprises ? pose.statuts : AUCUN_STATUT_POSE;
  const statutDe = (r: RepriseRow): RepriseStatus => statutsPoses[r.id] ?? r.status;

  /* ── Raccourcis ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const dansUnChamp = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.tagName === "SELECT" || el?.isContentEditable;
      if (e.key === "/" && !dansUnChamp) {
        e.preventDefault();
        champ.current?.focus();
      } else if (e.key === "Escape" && el === champ.current) {
        setRecherche("");
        champ.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Report des réglages dans l'adresse ── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (filtre !== "all") params.set("statut", filtre);
    if (recherche.trim()) params.set("q", recherche.trim());
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filtre, recherche]);

  // Changer de filtre ou de recherche fait repartir la pagination du haut.
  const criteres = `${filtre}|${recherche}`;
  const [criteresPrecedents, setCriteresPrecedents] = useState(criteres);
  if (criteresPrecedents !== criteres) {
    setCriteresPrecedents(criteres);
    setAffichees(PAGE);
  }

  const comptes = useMemo(() => {
    const c: Record<string, number> = { all: reprises.length };
    for (const r of reprises) {
      const s = statutDe(r);
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reprises, statutsPoses]);

  const filtrees = useMemo(() => {
    return reprises.filter((r) => {
      if (filtre !== "all" && statutDe(r) !== filtre) return false;
      // Le test de recherche vient en dernier : il répond vrai sur une requête
      // vide, et le placer en tête court-circuiterait le filtre.
      return matchesSearch(r.texteRecherche, recherche);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reprises, filtre, recherche, statutsPoses]);

  const visibles = filtrees.slice(0, affichees);

  async function poserIssue(r: RepriseRow, statut: "acceptee" | "refusee", motif?: RefusalReason) {
    setOccupees((s) => new Set(s).add(r.id));
    setPose({ pour: reprises, statuts: { ...statutsPoses, [r.id]: statut } });
    try {
      const res = await fetch(`/api/admin/reprises/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statut === "refusee" ? { status: statut, refusalReason: motif ?? "autre" } : { status: statut }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(statut === "acceptee" ? "Offre acceptée." : "Offre refusée.");
      setRefus(null);
      startTransition(() => router.refresh());
    } catch (e) {
      // L'étiquette posée à l'écran revient à sa valeur d'avant : mieux vaut
      // afficher la vérité de la base qu'une issue qui a échoué.
      setPose((p) => {
        const statuts = { ...p.statuts };
        delete statuts[r.id];
        return { pour: reprises, statuts };
      });
      toast.error(e instanceof Error && e.message ? e.message : "Le changement a échoué.");
    } finally {
      setOccupees((s) => {
        const n = new Set(s);
        n.delete(r.id);
        return n;
      });
    }
  }

  const lignesAvecStatutPose = visibles.map((r) => ({ ...r, status: statutDe(r) }));
  const enAttente = reprises.filter((r) => statutDe(r) === "proposee").length;

  return (
    <AdminPage>
      <PageHeader
        title="Reprises"
        subtitle={
          total === 0
            ? "Évaluez le véhicule d'un client, il rejoint le pipeline."
            : `${total} estimation${total > 1 ? "s" : ""}${enAttente > 0 ? ` · ${enAttente} offre${enAttente > 1 ? "s attendent" : " attend"} une réponse` : ""}.`
        }
        action={
          <Link href="/admin/reprises/nouvelle" className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle estimation
          </Link>
        }
      />

      {/* Recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <div className="relative sm:max-w-xs w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
          <input
            ref={champ}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher · touche /"
            aria-label="Rechercher une estimation"
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
          {REPRISE_FILTERS.map((f) => {
            const actif = filtre === f.value;
            const n = comptes[f.value] ?? 0;
            if (f.value !== "all" && n === 0) return null;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={actif}
                onClick={() => setFiltre(f.value)}
                className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
                style={{
                  borderColor: actif ? T.accent : T.border,
                  color: actif ? T.bg : T.textDim,
                  backgroundColor: actif ? T.accent : "transparent",
                }}
              >
                {f.label}
                <span style={{ opacity: 0.75 }}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {total > reprises.length && (
        <p className="text-[11px] mb-3" style={{ color: T.muted }}>
          Les {reprises.length} estimations les plus récentes sur {total}.
        </p>
      )}

      {filtrees.length === 0 ? (
        <EcranVide
          total={reprises.length}
          recherche={recherche}
          filtre={filtre}
          onReset={() => { setFiltre("all"); setRecherche(""); }}
        />
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          <div
            className={`hidden @[640px]:grid items-center px-4 py-2 gap-x-3 ${GRILLE}`}
            style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}
          >
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Réf.</span>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Véhicule</span>
            <span className="text-[10px] tracking-[0.14em] uppercase hidden @[980px]:block" style={{ color: T.muted }}>Plaque</span>
            <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Offre</span>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Statut</span>
            <span className="text-[10px] tracking-[0.14em] uppercase text-right hidden @[980px]:block" style={{ color: T.muted }}>Estimée</span>
            <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Issue</span>
          </div>

          {lignesAvecStatutPose.map((r, i) => (
            <Ligne
              key={r.id}
              r={r}
              premiere={i === 0}
              occupee={occupees.has(r.id)}
              onIssue={(ligne, statut) => (statut === "refusee" ? setRefus(ligne) : poserIssue(ligne, statut))}
            />
          ))}
        </div>
      )}

      {filtrees.length > affichees && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setAffichees((n) => n + PAGE)}
            className="text-[11px] tracking-widest uppercase"
            style={{ color: T.accent }}
          >
            Afficher {Math.min(PAGE, filtrees.length - affichees)} de plus · {filtrees.length - affichees} restante
            {filtrees.length - affichees > 1 ? "s" : ""}
          </button>
        </div>
      )}

      {refus && (
        <MotifRefus
          reprise={refus}
          busy={occupees.has(refus.id)}
          onValider={(motif) => poserIssue(refus, "refusee", motif)}
          onAnnuler={() => setRefus(null)}
        />
      )}
    </AdminPage>
  );
}
