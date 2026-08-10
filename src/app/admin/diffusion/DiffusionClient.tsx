"use client";

// Diffusion multi-portails : état de publication par portail, mise en ligne en
// un geste, liens tracés, flux XML réel.
//
// Trois principes tiennent cet écran :
//  1. L'état affiché vient du serveur. L'affichage local ne sert qu'au temps de
//     l'aller-retour, puis il s'efface dès que les données reviennent : une
//     pastille verte périmée ne peut plus masquer la vérité.
//  2. Un geste égale une notification, et la notification dit ce qui a vraiment
//     changé, d'après la réponse du serveur.
//  3. Rien ne se perd sans retour arrière : retirer une annonce conserve sa date
//     de mise en ligne, et la bande « Annuler » la remet en ligne telle quelle.
//
// L'habillage vit dans presentation.tsx, partagé avec la démonstration /demopro.
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio, CircleOff, Loader2, FileCode2, Link2, Copy, Check } from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  PORTALS, PORTAL_COLONNE, PORTAL_LABEL, PORTAL_MANUEL, lienTrace, FENETRE_ARRIVEES_JOURS,
  type EtatPortail, type Portal,
} from "@/lib/diffusion";
import { T, AdminPage, PageHeader, Tag, btnGhostClass, btnGhostStyle } from "../ui";
import { KpiTile } from "../charts";
import { useToast } from "../toast";
import {
  BandeColonnes, ContenuCellule, EtatVide, LigneDiffusion, MentionArrivees, MentionPied,
  actionLigneClass, celluleClass, libelleCellule, tonDe,
  type LigneVue, type TransitPortail,
} from "./presentation";

type Filtre = "tous" | "complet" | "a-completer" | "a-republier";

const CASCADE_MS = 160;
const UNDO_MS = 8000;

function cle(vehicleId: string, portal: Portal) {
  return `${vehicleId}:${portal}`;
}

export default function DiffusionClient({ lignes }: { lignes: LigneVue[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  /* Affichage local, effacé dès que le serveur a répondu et que la page s'est
     rafraîchie. C'est ce nettoyage qui manquait : une pastille posée à la main
     survivait à tout, y compris à un changement fait ailleurs. */
  const [local, setLocal] = useState<Record<string, EtatPortail>>({});
  const [transit, setTransit] = useState<Record<string, TransitPortail>>({});
  const [retard, setRetard] = useState<Record<string, number>>({});
  const [occupees, setOccupees] = useState<Set<string>>(new Set());
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [undo, setUndo] = useState<{ label: string; run: () => void } | null>(null);
  const [liens, setLiens] = useState<string | null>(null);

  /* Le vrai verrou de ré-entrée : une référence se lit et s'écrit dans le même
     tour, là où un état React attend le rendu suivant. */
  const enCours = useRef<Set<string>>(new Set());
  const etaitPending = useRef(false);
  const abandons = useRef<Set<AbortController>>(new Set());

  /* Réconciliation : la fin du rafraîchissement rend la main au serveur. */
  useEffect(() => {
    if (etaitPending.current && !isPending && enCours.current.size === 0) {
      setLocal({});
      setTransit({});
      setRetard({});
    }
    etaitPending.current = isPending;
  }, [isPending]);

  /* Quitter l'écran annule les appels en vol : sans cela, les notifications
     s'affichaient par-dessus la page suivante. */
  useEffect(() => {
    const controleurs = abandons.current;
    return () => controleurs.forEach((c) => c.abort());
  }, []);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(id);
  }, [undo]);

  const etatDe = useCallback(
    (vue: LigneVue, portal: Portal): EtatPortail => local[cle(vue.id, portal)] ?? vue.etats[portal],
    [local],
  );

  const compter = useCallback(
    (vue: LigneVue, etat: EtatPortail) => PORTALS.filter((p) => etatDe(vue, p) === etat).length,
    [etatDe],
  );

  const enLigneCount = useCallback(
    (vue: LigneVue) => PORTALS.filter((p) => etatDe(vue, p) !== "retire").length,
    [etatDe],
  );

  /* ── Indicateurs ──
     Les emplacements plutôt que les véhicules : « 3 sur 3 » s'affichait alors
     que huit emplacements restaient vides. */
  const stats = useMemo(() => {
    let pris = 0;
    let complets = 0;
    let aRepublier = 0;
    let arrivees = 0;
    for (const vue of lignes) {
      const n = enLigneCount(vue);
      pris += n;
      if (n === PORTALS.length) complets++;
      if (compter(vue, "a-republier") > 0) aRepublier++;
      arrivees += vue.arrivees;
    }
    const emplacements = lignes.length * PORTALS.length;
    return {
      pris,
      emplacements,
      libres: emplacements - pris,
      complets,
      aCompleter: lignes.length - complets,
      aRepublier,
      arrivees,
    };
  }, [lignes, enLigneCount, compter]);

  const dansLeFlux = useMemo(() => lignes.filter((v) => v.dansLeFlux).length, [lignes]);

  /* Le véhicule dont on regarde les liens peut quitter la liste sous nos yeux
     (vendu ailleurs, rafraîchissement) : le panneau se referme au lieu de
     chercher une ligne disparue. */
  const ligneDesLiens = useMemo(() => lignes.find((l) => l.id === liens) ?? null, [lignes, liens]);

  const affiches = useMemo(() => {
    if (filtre === "complet") return lignes.filter((v) => enLigneCount(v) === PORTALS.length);
    if (filtre === "a-completer") return lignes.filter((v) => enLigneCount(v) < PORTALS.length);
    if (filtre === "a-republier") return lignes.filter((v) => compter(v, "a-republier") > 0);
    return lignes;
  }, [lignes, filtre, enLigneCount, compter]);

  /* ── Appel serveur ── */
  const appeler = useCallback(
    async (vehicleId: string, portals: Portal[], action: "publish" | "unpublish" | "restore") => {
      const ctrl = new AbortController();
      abandons.current.add(ctrl);
      try {
        const res = await fetch("/api/admin/diffusion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId, portals, action }),
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => null);
        // Le motif du refus vient du serveur : « Cette fiche demande une photo »
        // vaut mieux que « La diffusion a échoué ».
        if (!res.ok) throw new Error(data?.error || "La mise à jour a échoué.");
        return (data?.changed ?? []) as Portal[];
      } finally {
        abandons.current.delete(ctrl);
      }
    },
    [],
  );

  /* Prise et remise du verrou. La référence tranche, l'état habille. */
  const prendre = useCallback((vehicleId: string) => {
    if (enCours.current.has(vehicleId)) return false;
    enCours.current.add(vehicleId);
    setOccupees((s) => new Set(s).add(vehicleId));
    return true;
  }, []);

  const rendre = useCallback((vehicleId: string) => {
    enCours.current.delete(vehicleId);
    setOccupees((s) => {
      const n = new Set(s);
      n.delete(vehicleId);
      return n;
    });
  }, []);

  const poser = useCallback((vehicleId: string, portals: Portal[], etat: EtatPortail) => {
    setLocal((s) => {
      const n = { ...s };
      portals.forEach((p) => (n[cle(vehicleId, p)] = etat));
      return n;
    });
  }, []);

  const oublierTransit = useCallback((vehicleId: string, portals: Portal[]) => {
    setTransit((s) => {
      const n = { ...s };
      portals.forEach((p) => delete n[cle(vehicleId, p)]);
      return n;
    });
  }, []);

  const estAbandon = (e: unknown) => (e as { name?: string })?.name === "AbortError";

  /* ── Mettre en ligne les portails à traiter ──
     Un portail « à republier » compte parmi eux : republier, c'est justement
     remettre en ligne une fiche qui a bougé depuis. */
  async function diffuser(vue: LigneVue) {
    const aTraiter = PORTALS.filter((p) => etatDe(vue, p) !== "en-ligne");
    if (aTraiter.length === 0) return;
    if (!prendre(vue.id)) return;

    // Les cellules passent en file au même instant : l'attente devient vraie.
    setTransit((s) => {
      const n = { ...s };
      aTraiter.forEach((p) => (n[cle(vue.id, p)] = "en-file"));
      return n;
    });

    const doux =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      const changed = await appeler(vue.id, aTraiter, "publish");

      // Un seul écrit, quatre retards d'affichage : la cascade se voit sans
      // qu'aucun état ne soit posé après coup.
      if (!doux && changed.length > 1) {
        setRetard((s) => {
          const n = { ...s };
          changed.forEach((p, i) => (n[cle(vue.id, p)] = i * CASCADE_MS));
          return n;
        });
      }
      poser(vue.id, changed, "en-ligne");
      oublierTransit(vue.id, aTraiter);

      const nom = `${vue.make} ${vue.model}`;
      if (changed.length === 0) {
        toast.info(`${nom} · déjà en ligne sur ces portails.`);
      } else if (changed.length === aTraiter.length) {
        toast.success(`${nom} · en ligne sur ${changed.length} portail${changed.length > 1 ? "s" : ""}.`);
      } else {
        toast.success(
          `${nom} · en ligne sur ${changed.length} portail${changed.length > 1 ? "s" : ""} sur ${aTraiter.length}.`,
        );
      }
    } catch (e) {
      if (estAbandon(e)) return;
      // L'état posé repart avec l'échec : le sablier tournait auparavant jusqu'au
      // prochain rechargement.
      oublierTransit(vue.id, aTraiter);
      toast.error((e as Error).message);
    } finally {
      rendre(vue.id);
      // Le rafraîchissement part dans tous les cas : l'en-tête et la ligne
      // racontaient deux histoires différentes après un échec.
      startTransition(() => router.refresh());
    }
  }

  /* ── Basculer un portail ── */
  async function basculer(vue: LigneVue, portal: Portal, etat: EtatPortail) {
    if (!prendre(vue.id)) return;
    const retirer = etat !== "retire";
    setTransit((s) => ({ ...s, [cle(vue.id, portal)]: "en-cours" }));
    try {
      const changed = await appeler(vue.id, [portal], retirer ? "unpublish" : "publish");
      if (changed.length === 0) {
        // Le serveur avait déjà cet état : rien à poser, rien à annuler.
        toast.info(`${PORTAL_LABEL[portal]} portait déjà cet état.`);
      } else {
        poser(vue.id, [portal], retirer ? "retire" : "en-ligne");
        if (retirer) {
          // Retirer conserve la date : « Annuler » remet l'annonce telle quelle.
          setUndo({
            label: `Annonce retirée de ${PORTAL_LABEL[portal]}.`,
            run: () => void remettre(vue, [portal]),
          });
        } else {
          toast.success(`${vue.make} ${vue.model} · en ligne sur ${PORTAL_LABEL[portal]}.`);
        }
      }
    } catch (e) {
      if (estAbandon(e)) return;
      toast.error((e as Error).message);
    } finally {
      oublierTransit(vue.id, [portal]);
      rendre(vue.id);
      startTransition(() => router.refresh());
    }
  }

  /* ── Retirer de tous les portails ── */
  async function toutRetirer(vue: LigneVue) {
    const enLigne = PORTALS.filter((p) => etatDe(vue, p) !== "retire");
    if (enLigne.length === 0) return;
    if (!prendre(vue.id)) return;
    try {
      const changed = await appeler(vue.id, enLigne, "unpublish");
      if (changed.length === 0) {
        toast.info(`${vue.make} ${vue.model} · ces portails étaient déjà hors ligne.`);
      } else {
        poser(vue.id, changed, "retire");
        setUndo({
          label: `${vue.make} ${vue.model} retiré de ${changed.length} portail${changed.length > 1 ? "s" : ""}.`,
          run: () => void remettre(vue, changed),
        });
      }
    } catch (e) {
      if (estAbandon(e)) return;
      toast.error((e as Error).message);
    } finally {
      rendre(vue.id);
      startTransition(() => router.refresh());
    }
  }

  async function remettre(vue: LigneVue, portals: Portal[]) {
    if (!prendre(vue.id)) return;
    setTransit((s) => {
      const n = { ...s };
      portals.forEach((p) => (n[cle(vue.id, p)] = "en-cours"));
      return n;
    });
    try {
      const changed = await appeler(vue.id, portals, "restore");
      poser(vue.id, changed, "en-ligne");
      toast.success(
        `${vue.make} ${vue.model} · remis en ligne sur ${changed.length} portail${changed.length > 1 ? "s" : ""}.`,
      );
    } catch (e) {
      if (estAbandon(e)) return;
      toast.error((e as Error).message);
    } finally {
      oublierTransit(vue.id, portals);
      rendre(vue.id);
      startTransition(() => router.refresh());
    }
  }

  const basculerFiltre = (f: Filtre) => setFiltre((c) => (c === f ? "tous" : f));

  return (
    <AdminPage>
      <PageHeader
        title="Diffusion des annonces"
        badge={<Tag tone="warning">Simulation</Tag>}
        subtitle={
          <>
            {formatNumber(lignes.length)} véhicule{lignes.length > 1 ? "s" : ""} diffusable
            {lignes.length > 1 ? "s" : ""} · {formatNumber(stats.pris)} emplacement
            {stats.pris > 1 ? "s" : ""} sur {formatNumber(stats.emplacements)} occupé
            {stats.pris > 1 ? "s" : ""} · flux XML actif
          </>
        }
        action={
          <div className="flex flex-col items-stretch sm:items-end gap-1.5 max-w-full">
            <a href="/api/admin/diffusion/flux" download className={btnGhostClass} style={btnGhostStyle}>
              <FileCode2 size={14} />
              Télécharger le flux XML
            </a>
            <span className="text-[11px] leading-snug sm:text-right max-w-xs" style={{ color: T.muted }}>
              {`Transmettez ce fichier à votre agrégateur, il publiera votre stock. ${formatNumber(dansLeFlux)} véhicule${dansLeFlux > 1 ? "s" : ""} à l'intérieur.`}
            </span>
          </div>
        }
      />

      {/* Indicateurs. Les trois premiers filtrent la liste sous eux. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
        <KpiTile
          label="Diffusion complète"
          value={stats.complets}
          icon="radio"
          index={0}
          hint={`sur ${formatNumber(lignes.length)} véhicule${lignes.length > 1 ? "s" : ""}`}
          pressed={filtre === "complet"}
          onClick={() => basculerFiltre("complet")}
        />
        <KpiTile
          label="À compléter"
          value={stats.aCompleter}
          icon="grid"
          index={1}
          hint={`${formatNumber(stats.libres)} emplacement${stats.libres > 1 ? "s" : ""} libre${stats.libres > 1 ? "s" : ""}`}
          pressed={filtre === "a-completer"}
          onClick={() => basculerFiltre("a-completer")}
        />
        <KpiTile
          label="À republier"
          value={stats.aRepublier}
          icon="clock"
          index={2}
          hint="fiche modifiée depuis la mise en ligne"
          pressed={filtre === "a-republier"}
          onClick={() => basculerFiltre("a-republier")}
        />
        <KpiTile
          label={`Arrivées sur ${FENETRE_ARRIVEES_JOURS} j`}
          value={stats.arrivees}
          icon="eye"
          index={3}
          hint="visites mesurées sur vos fiches"
        />
      </div>
      <MentionArrivees />

      {lignes.length === 0 || affiches.length === 0 ? (
        <EtatVide filtre={lignes.length === 0 ? "tous" : filtre} onReset={() => setFiltre("tous")} />
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          <BandeColonnes />

          {affiches.map((vue, i) => {
            const occupee = occupees.has(vue.id);
            const tout = enLigneCount(vue) === PORTALS.length && compter(vue, "a-republier") === 0;
            const aRepublier = compter(vue, "a-republier") > 0;

            return (
              <LigneDiffusion
                key={vue.id}
                vue={{ ...vue, etats: Object.fromEntries(PORTALS.map((p) => [p, etatDe(vue, p)])) as Record<Portal, EtatPortail> }}
                first={i === 0}
                href={`/admin/vehicules/${vue.id}`}
                cellules={PORTALS.map((p) => {
                  const etat = etatDe(vue, p);
                  const tr = transit[cle(vue.id, p)];
                  const ton = tonDe(etat, tr);
                  const d = retard[cle(vue.id, p)];
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-disabled={occupee}
                      aria-pressed={etat !== "retire"}
                      aria-label={libelleCellule(`${vue.make} ${vue.model}`, p, etat)}
                      onClick={() => {
                        if (occupee) return;
                        basculer(vue, p, etat);
                      }}
                      className={celluleClass}
                      style={{
                        backgroundColor: ton.bg,
                        border: `1px solid ${ton.bd}`,
                        color: ton.fg,
                        transitionDelay: d ? `${d}ms` : undefined,
                      }}
                    >
                      <ContenuCellule portal={p} etat={etat} transit={tr} />
                    </button>
                  );
                })}
                actionNom={
                  <button
                    type="button"
                    onClick={() => setLiens(liens === vue.id ? null : vue.id)}
                    aria-expanded={liens === vue.id}
                    aria-label={`Liens tracés de ${vue.make} ${vue.model}`}
                    title="Liens tracés à coller dans vos annonces"
                    className="adm-act adm-btn-focus adm-row-actions relative z-[1] inline-flex items-center justify-center h-6 w-6"
                    style={{ color: liens === vue.id ? T.accent : T.muted }}
                  >
                    <Link2 size={13} />
                  </button>
                }
                action={
                  <>
                    {tout ? (
                      <button
                        type="button"
                        aria-disabled={occupee}
                        onClick={() => toutRetirer(vue)}
                        aria-label={`Retirer ${vue.make} ${vue.model} de tous les portails`}
                        className={actionLigneClass}
                        style={{ color: T.muted }}
                      >
                        {occupee ? <Loader2 size={12} className="animate-spin" /> : <CircleOff size={12} />}
                        Tout retirer
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-disabled={occupee}
                        onClick={() => diffuser(vue)}
                        aria-label={`${aRepublier ? "Republier" : "Diffuser"} ${vue.make} ${vue.model}`}
                        className={actionLigneClass}
                        style={{ color: aRepublier ? T.warning : T.accent }}
                      >
                        {occupee ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
                        {aRepublier ? "Republier" : "Diffuser"}
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Liens tracés : c'est ce qui fait remonter la visite au bon portail. */}
      {ligneDesLiens && <PanneauLiens vue={ligneDesLiens} onClose={() => setLiens(null)} />}

      <MentionPied />

      {/* Bande « Annuler ». `role="status"` la fait lire à voix haute : le
          retrait ne produit aucune notification, il fallait bien l'annoncer. */}
      {undo && (
        <div
          role="status"
          className="fixed bottom-6 left-6 lg:left-[256px] z-[63] flex items-center gap-4 px-4 py-2"
          style={{
            backgroundColor: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 10px 30px rgba(4,11,22,0.5)",
          }}
        >
          <span className="text-[12px]" style={{ color: T.textDim }}>
            {undo.label}
          </span>
          <button
            type="button"
            onClick={() => {
              undo.run();
              setUndo(null);
            }}
            className="adm-act adm-btn-focus inline-flex items-center gap-1.5 min-h-[39px] px-2 text-[11px] tracking-widest uppercase"
            style={{ color: T.accent }}
          >
            Annuler
          </button>
        </div>
      )}
    </AdminPage>
  );
}

/* ── Liens tracés ──
   Collé dans une annonce portail, ce lien fait remonter la visite au bon
   portail : c'est le chaînon qui manquait entre la diffusion et la mesure. */
function PanneauLiens({ vue, onClose }: { vue: LigneVue; onClose: () => void }) {
  const toast = useToast();
  const [copie, setCopie] = useState<string | null>(null);

  async function copier(portal: Portal) {
    const lien = lienTrace(vue.id, portal);
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(portal);
      toast.success(`Lien ${PORTAL_COLONNE[portal]} copié.`);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      toast.error("La copie a échoué, sélectionnez le lien à la main.");
    }
  }

  return (
    <div className="mt-4 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between gap-4 mb-1">
        <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.textDim }}>
          Liens tracés · {vue.make} {vue.model}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="adm-act adm-btn-focus text-[11px] tracking-widest uppercase"
          style={{ color: T.muted }}
        >
          Fermer
        </button>
      </div>
      <p className="text-[11px] mb-4 max-w-2xl" style={{ color: T.muted }}>
        Collez le lien du portail dans l&apos;annonce que vous y publiez. Les visites qu&apos;il rapporte remontent
        alors dans la colonne des arrivées, portail par portail.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {PORTALS.map((p) => (
          <div
            key={p}
            className="flex items-center gap-2 px-3 py-2 min-w-0"
            style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}
          >
            <span className="text-[10px] tracking-[0.14em] uppercase w-24 flex-shrink-0" style={{ color: T.accent }}>
              {PORTAL_COLONNE[p]}
            </span>
            <code className="text-[11px] truncate flex-1 min-w-0" style={{ color: T.muted }}>
              {lienTrace(vue.id, p)}
            </code>
            {PORTAL_MANUEL[p] && <Tag tone="muted">à la main</Tag>}
            <button
              type="button"
              onClick={() => copier(p)}
              aria-label={`Copier le lien ${PORTAL_COLONNE[p]}`}
              className="adm-act adm-btn-focus inline-flex items-center justify-center min-h-[39px] w-9 flex-shrink-0"
              style={{ color: copie === p ? T.success : T.muted }}
            >
              {copie === p ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
