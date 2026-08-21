"use client";

// Mandats : liste de travail des contrats de mission.
//
// La saisie vit sur sa propre page (/admin/mandats/nouveau). Cet écran sert à
// retrouver un mandat, à surveiller les échéances et à ouvrir la fiche.
// L'issue d'un mandat se pose sur la fiche : elle demande une date et un prix,
// deux choses qu'une action de liste bâclerait.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, FileSignature, Search, X } from "lucide-react";
import { formatEuroCents } from "@/lib/comptes";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/vehicules";
import {
  MANDAT_FILTERS, MANDAT_STATUS_TONE, MANDAT_TYPE_LABEL, mandatStatusLabel,
  ECHEANCE_ALERTE_JOURS,
  type MandatStatus, type MandatType, type MandatFilter,
} from "@/lib/mandats";
import { T, TONE, Tag, AdminPage, PageHeader, fieldStyle, btnPrimaryClass, btnPrimaryStyle } from "../ui";

export type MandatRow = {
  id: string;
  reference: string;
  type: MandatType;
  status: MandatStatus;
  clientId: string | null;
  vehicule: string;
  vendeur: string;
  plate: string;
  mileageKm: number;
  priceCents: number;
  floorCents: number;
  signe: boolean;
  expiree: boolean;
  echeanceProche: boolean;
  /** « expire dans 12 j », « échu depuis 4 j ». Écrite côté serveur. */
  phraseEcheance: string;
  /** Texte sur lequel porte la recherche, assemblé côté serveur. */
  texteRecherche: string;
  /** Ancienneté écrite côté serveur, avec une seule heure de référence. */
  anciennete: string;
};

export type Pilotage = {
  enCours: number;
  enCoursCents: number;
  aEcheance: number;
  echus: number;
  vendus: number;
  vendusCents: number;
  conclus: number;
  jours: number;
};

// Les deux grilles de colonnes, déclarées une fois : l'en-tête et les lignes
// doivent porter exactement la même définition, sinon les colonnes se décalent.
const GRILLE =
  "@[640px]:grid-cols-[92px_minmax(150px,1fr)_128px_112px_128px] " +
  "@[980px]:grid-cols-[96px_minmax(170px,1fr)_116px_128px_112px_128px_92px]";

const CLOS: MandatStatus[] = ["retire", "sans_suite", "retracte"];

/* ── Une ligne ── */
function Ligne({ r, premiere }: { r: MandatRow; premiere: boolean }) {
  const enExecution = r.status === "signe";
  // Ce qui appelle l'œil : un mandat échu d'abord, puis une échéance proche.
  const liseré = enExecution ? (r.expiree ? T.danger : r.echeanceProche ? T.warning : null) : null;

  return (
    <div
      className={`group relative grid items-center px-4 py-3 gap-x-3 gap-y-2 grid-cols-[1fr_auto] ${GRILLE}`}
      style={{
        borderTop: premiere ? "none" : `1px solid ${T.border}`,
        // Le liseré REMPLACE la bordure gauche au lieu de s'y ajouter, sinon la
        // ligne se décale d'un pixel par rapport à ses voisines.
        borderLeft: liseré ? `2px solid ${liseré}` : "2px solid transparent",
      }}
    >
      {/* Lien de couverture : toute la ligne ouvre la fiche du mandat. */}
      <Link
        href={`/admin/mandats/${r.id}`}
        className="absolute inset-0"
        aria-label={`Ouvrir le mandat ${r.reference}`}
        style={{ zIndex: 0 }}
      />

      <span className="text-xs tracking-widest uppercase whitespace-nowrap hidden @[640px]:block" style={{ color: T.accent }}>
        {r.reference}
      </span>

      <span className="min-w-0 col-span-2 @[640px]:col-span-1">
        <span className="flex items-center gap-2 min-w-0">
          <FileSignature size={15} className="@[640px]:hidden" style={{ color: T.accent, flexShrink: 0 }} />
          <span className="text-sm truncate" style={{ color: T.text }}>{r.vehicule}</span>
        </span>
        <span className="text-[11px] truncate block mt-0.5" style={{ color: T.muted }}>
          {[r.vendeur, r.mileageKm > 0 ? `${formatNumber(r.mileageKm)} km` : "", MANDAT_TYPE_LABEL[r.type]]
            .filter(Boolean).join(" · ")}
          <span className="@[640px]:hidden">{r.plate ? ` · ${r.plate}` : ""} · {r.reference}</span>
          {enExecution && r.phraseEcheance && (
            <>
              {" · "}
              <span style={{ color: r.expiree ? TONE.danger.fg : r.echeanceProche ? TONE.warning.fg : T.muted }}>
                {r.phraseEcheance}
              </span>
            </>
          )}
        </span>
      </span>

      <span className="text-[12px] hidden @[980px]:block truncate" style={{ color: r.plate ? T.textDim : T.border }}>
        {r.plate || "—"}
      </span>

      <span className="text-right whitespace-nowrap">
        <span
          className="text-sm font-semibold block"
          style={{ color: r.priceCents > 0 ? T.text : T.border, fontVariantNumeric: "tabular-nums" }}
        >
          {r.priceCents > 0 ? formatEuroCents(r.priceCents) : "—"}
        </span>
        {/* Le prix plancher sous le prix affiché : c'est l'engagement pris
            envers le vendeur, et il se lisait nulle part sans ouvrir la fiche. */}
        {r.floorCents > 0 && (
          <span
            className="text-[10.5px] block"
            style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}
            title="Prix plancher net vendeur"
          >
            net {formatEuroCents(r.floorCents)}
          </span>
        )}
      </span>

      <span className="flex">
        <Tag tone={MANDAT_STATUS_TONE[r.status]}>{mandatStatusLabel(r.type, r.status)}</Tag>
      </span>

      <span
        className="text-[11px] text-right hidden @[980px]:block whitespace-nowrap"
        style={{ color: enExecution && (r.expiree || r.echeanceProche) ? TONE[r.expiree ? "danger" : "warning"].fg : T.muted }}
      >
        {enExecution ? r.phraseEcheance || "—" : "—"}
      </span>

      <span className="text-[11px] text-right hidden @[640px]:block whitespace-nowrap" style={{ color: T.muted }}>
        {r.anciennete}
      </span>
    </div>
  );
}

/* ── Écran vide ── */
function EcranVide({
  total, recherche, filtre, onReset,
}: {
  total: number;
  recherche: string;
  filtre: MandatFilter;
  onReset: () => void;
}) {
  const cherche = recherche.trim() !== "";
  const filtrePose = filtre !== "all";

  if (total === 0) {
    return (
      <div className="p-12 text-center" style={{ border: `1px solid ${T.border}` }}>
        <div className="flex justify-center mb-4" style={{ color: T.border }}><FileSignature size={28} /></div>
        <p className="text-sm mb-1" style={{ color: T.text }}>Votre premier mandat s&apos;affichera ici.</p>
        <p className="text-[13px] mb-6" style={{ color: T.muted }}>
          La saisie crée la fiche du vendeur, le contrat prêt à imprimer et l&apos;affaire qui suit dans le pipeline.
        </p>
        <Link href="/admin/mandats/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>+ Créer le premier</Link>
      </div>
    );
  }

  const f = MANDAT_FILTERS.find((x) => x.value === filtre);
  let titre = `Rien dans « ${f?.label ?? ""} » pour l'instant.`;
  let aide = f?.vide || "Ce filtre se remplira dès qu'un mandat y entrera.";
  if (cherche && filtrePose) {
    titre = `Rien dans « ${f?.label ?? ""} » pour « ${recherche.trim()} ».`;
    aide = "Élargissez la recherche ou changez de filtre.";
  } else if (cherche) {
    titre = `Aucun mandat pour « ${recherche.trim()} ».`;
    aide = "La recherche porte sur le véhicule, l'immatriculation, le numéro de série et le vendeur.";
  }

  return (
    <div className="p-12 text-center" style={{ border: `1px solid ${T.border}` }}>
      <div className="flex justify-center mb-4" style={{ color: T.border }}>
        {cherche ? <Search size={24} /> : <FileSignature size={26} />}
      </div>
      <p className="text-sm mb-1" style={{ color: T.text }}>{titre}</p>
      <p className="text-[13px] mb-6" style={{ color: T.muted }}>{aide}</p>
      <button type="button" onClick={onReset} className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
        Revenir à tous les mandats
      </button>
    </div>
  );
}

const PAGE = 80;

export default function MandatsClient({
  mandats, total, pilotage, filtreInitial, rechercheInitiale,
}: {
  mandats: MandatRow[];
  total: number;
  pilotage: Pilotage;
  filtreInitial: MandatFilter;
  rechercheInitiale: string;
}) {
  const [filtre, setFiltre] = useState<MandatFilter>(filtreInitial);
  const [recherche, setRecherche] = useState(rechercheInitiale);
  const [affichees, setAffichees] = useState(PAGE);
  const champ = useRef<HTMLInputElement>(null);

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
    const c: Record<string, number> = { all: mandats.length, echeance: 0, clos: 0 };
    for (const r of mandats) {
      c[r.status] = (c[r.status] ?? 0) + 1;
      if (r.status === "signe" && (r.expiree || r.echeanceProche)) c.echeance += 1;
      if (CLOS.includes(r.status)) c.clos += 1;
    }
    return c;
  }, [mandats]);

  const filtrees = useMemo(() => {
    return mandats.filter((r) => {
      // « À l'échéance » se déduit de la date d'effet : c'est une situation,
      // jamais un statut rangé en base. « Clos » regroupe les trois sorties.
      if (filtre === "echeance") {
        if (r.status !== "signe" || (!r.expiree && !r.echeanceProche)) return false;
      } else if (filtre === "clos") {
        if (!CLOS.includes(r.status)) return false;
      } else if (filtre !== "all" && r.status !== filtre) {
        return false;
      }
      // Le test de recherche vient en dernier : il répond vrai sur une requête
      // vide, et le placer en tête court-circuiterait le filtre.
      return matchesSearch(r.texteRecherche, recherche);
    });
  }, [mandats, filtre, recherche]);

  const visibles = filtrees.slice(0, affichees);

  const tuileStyle = (actif: boolean) => ({
    backgroundColor: T.surface,
    border: `1px solid ${actif ? T.accent : T.border}`,
  });

  return (
    <AdminPage>
      <PageHeader
        title="Mandats"
        subtitle={
          total === 0
            ? "Le contrat de chaque mission : signé, suivi, archivé."
            : `${total} mandat${total > 1 ? "s" : ""}${pilotage.enCours > 0 ? ` · ${pilotage.enCours} en cours d'exécution` : ""}.`
        }
        action={
          <Link href="/admin/mandats/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau mandat
          </Link>
        }
      />

      {/* Trois chiffres de pilotage, calculés sur TOUTE la table et jamais sur
          les lignes chargées. Les deux premiers se cliquent et posent leur
          filtre. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <button
          type="button"
          aria-pressed={filtre === "signe"}
          onClick={() => setFiltre((v) => (v === "signe" ? "all" : "signe"))}
          className="px-4 py-3 text-left transition-colors"
          style={tuileStyle(filtre === "signe")}
        >
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>En cours d&apos;exécution</div>
          <div className="text-[19px] sm:text-[24px] mt-1 whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {pilotage.enCoursCents > 0 ? formatEuroCents(pilotage.enCoursCents) : pilotage.enCours || "—"}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>
            {pilotage.enCours > 0
              ? `${pilotage.enCours} mandat${pilotage.enCours > 1 ? "s" : ""} signé${pilotage.enCours > 1 ? "s" : ""}, en prix affichés`
              : "en attente d'une première signature"}
          </div>
        </button>

        <button
          type="button"
          aria-pressed={filtre === "echeance"}
          onClick={() => setFiltre((v) => (v === "echeance" ? "all" : "echeance"))}
          className="px-4 py-3 text-left transition-colors"
          style={tuileStyle(filtre === "echeance")}
        >
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>À l&apos;échéance</div>
          <div
            className="text-[19px] sm:text-[24px] mt-1 whitespace-nowrap"
            style={{ color: pilotage.aEcheance > 0 ? TONE.warning.fg : T.text, fontVariantNumeric: "tabular-nums" }}
          >
            {pilotage.aEcheance}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>
            {pilotage.aEcheance > 0
              ? `${pilotage.echus} échu${pilotage.echus > 1 ? "s" : ""} · ${pilotage.aEcheance - pilotage.echus} sous ${ECHEANCE_ALERTE_JOURS} j — proposer le renouvellement écrit`
              : "tous les mandats signés tiennent encore"}
          </div>
        </button>

        <div className="px-4 py-3 col-span-2 lg:col-span-1" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Vendu sur {pilotage.jours} jours</div>
          <div className="text-[19px] sm:text-[24px] mt-1 whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {pilotage.vendusCents > 0 ? formatEuroCents(pilotage.vendusCents) : "—"}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>
            {pilotage.conclus > 0
              ? `${pilotage.vendus} vente${pilotage.vendus > 1 ? "s" : ""} sur ${pilotage.conclus} mandat${pilotage.conclus > 1 ? "s" : ""} conclu${pilotage.conclus > 1 ? "s" : ""}`
              : "en attente d'une première vente conclue"}
          </div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <div className="relative sm:max-w-xs w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
          <input
            ref={champ}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher · touche /"
            aria-label="Rechercher un mandat"
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
          {MANDAT_FILTERS.map((f) => {
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

      {total > mandats.length && (
        <p className="text-[11px] mb-3" style={{ color: T.muted }}>
          Les {mandats.length} mandats les plus récents sur {total}.
        </p>
      )}

      {filtrees.length === 0 ? (
        <EcranVide
          total={mandats.length}
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
            <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Prix affiché</span>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Statut</span>
            <span className="text-[10px] tracking-[0.14em] uppercase text-right hidden @[980px]:block" style={{ color: T.muted }}>Échéance</span>
            <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Effet</span>
          </div>

          {visibles.map((r, i) => (
            <Ligne key={r.id} r={r} premiere={i === 0} />
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
            Afficher {Math.min(PAGE, filtrees.length - affichees)} de plus · {filtrees.length - affichees} restant
            {filtrees.length - affichees > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </AdminPage>
  );
}
