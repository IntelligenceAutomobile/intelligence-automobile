"use client";

// Diffusion multi-portails : état de publication par portail, gestes unitaires
// et groupés, liens tracés, journal, synthèse par portail, flux XML réel.
//
// Trois principes tiennent cet écran :
//  1. L'état affiché vient du serveur. L'affichage local ne sert qu'au temps de
//     l'aller-retour, puis il s'efface dès que les données reviennent : une
//     pastille verte périmée ne peut plus masquer la vérité.
//  2. Un geste égale une notification, et la notification dit ce qui a vraiment
//     changé, d'après la réponse du serveur.
//  3. Rien ne se perd sans retour arrière : retirer une annonce conserve ses
//     dates, et la bande « Annuler » la remet en ligne telle quelle.
//
// L'habillage vit dans presentation.tsx, partagé avec la démonstration /demopro.
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio, CircleOff, Loader2, FileCode2, Link2, Copy, Check, History, Search } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/vehicules";
import {
  PORTALS, PORTAL_COLONNE, PORTAL_LABEL, PORTAL_MANUEL, lienTrace, JOURNAL_LABEL,
  type EtatPortail, type JournalAction, type Portal,
} from "@/lib/diffusion";
import { T, AdminPage, PageHeader, Tag, btnGhostClass, btnGhostStyle } from "../ui";
import { KpiTile } from "../charts";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";
import {
  BandeColonnes, ContenuCellule, EtatVide, LigneDiffusion, MentionArrivees, MentionPied,
  SynthesePortails, actionLigneClass, celluleClass, libelleCellule, tonDe,
  type LigneVue, type PortailSynthese, type TransitPortail,
} from "./presentation";

type Filtre = "tous" | "complet" | "a-completer" | "a-republier";
type Panneau = { type: "liens" | "journal"; vehicleId: string } | null;

const CASCADE_MS = 160;
const UNDO_MS = 8000;

function cle(vehicleId: string, portal: Portal) {
  return `${vehicleId}:${portal}`;
}

function lireFiltre(v: string): Filtre {
  return v === "complet" || v === "a-completer" || v === "a-republier" ? v : "tous";
}

export default function DiffusionClient({
  lignes,
  syntheses,
  adresseFlux,
  initialQ,
  initialFiltre,
}: {
  lignes: LigneVue[];
  syntheses: PortailSynthese[];
  adresseFlux: string | null;
  initialQ: string;
  initialFiltre: string;
}) {
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
  const [filtre, setFiltre] = useState<Filtre>(lireFiltre(initialFiltre));
  const [q, setQ] = useState(initialQ);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ label: string; run: () => void } | null>(null);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [portailMenu, setPortailMenu] = useState<Portal | null>(null);
  const [groupeeEnCours, setGroupeeEnCours] = useState(false);

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

  /* Les réglages se reportent dans l'adresse, comme partout ailleurs : un
     rechargement ou un lien partagé retombe sur la même liste. */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    if (filtre !== "tous") url.searchParams.set("filtre", filtre);
    else url.searchParams.delete("filtre");
    window.history.replaceState(null, "", url.toString());
  }, [q, filtre]);

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

  const affiches = useMemo(() => {
    let liste = lignes;
    if (filtre === "complet") liste = liste.filter((v) => enLigneCount(v) === PORTALS.length);
    if (filtre === "a-completer") liste = liste.filter((v) => enLigneCount(v) < PORTALS.length);
    if (filtre === "a-republier") liste = liste.filter((v) => compter(v, "a-republier") > 0);
    if (q.trim()) liste = liste.filter((v) => matchesSearch(`${v.make} ${v.model} ${v.year}`, q));
    return liste;
  }, [lignes, filtre, q, enLigneCount, compter]);

  /* Le véhicule dont on regarde les liens ou le journal peut quitter la liste
     sous nos yeux : le panneau se referme au lieu de chercher une ligne
     disparue. */
  const lignePanneau = useMemo(
    () => (panneau ? (lignes.find((l) => l.id === panneau.vehicleId) ?? null) : null),
    [lignes, panneau],
  );

  /* ── Appels serveur ── */
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

  type ResultatGroupe = {
    changed: Array<{ vehicleId: string; portals: Portal[] }>;
    skipped: Array<{ vehicleId: string; vehicle: string; reason: string }>;
  };

  const appelerGroupe = useCallback(
    async (vehicleIds: string[], portals: Portal[], action: "publish" | "unpublish" | "restore") => {
      const ctrl = new AbortController();
      abandons.current.add(ctrl);
      try {
        const res = await fetch("/api/admin/diffusion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleIds, portals, action }),
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "La mise à jour a échoué.");
        return data as ResultatGroupe;
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
    const republication = aTraiter.some((p) => etatDe(vue, p) === "a-republier");
    if (!prendre(vue.id)) return;

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
      } else if (republication) {
        // Le mot compte : la fiche avait bougé, les portails sont à jour.
        toast.success(`${nom} · republié sur ${changed.length} portail${changed.length > 1 ? "s" : ""}, annonce à jour.`);
      } else if (changed.length === aTraiter.length) {
        toast.success(`${nom} · en ligne sur ${changed.length} portail${changed.length > 1 ? "s" : ""}.`);
      } else {
        toast.success(
          `${nom} · en ligne sur ${changed.length} portail${changed.length > 1 ? "s" : ""} sur ${aTraiter.length}.`,
        );
      }
    } catch (e) {
      if (estAbandon(e)) return;
      oublierTransit(vue.id, aTraiter);
      toast.error((e as Error).message);
    } finally {
      rendre(vue.id);
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
        toast.info(`${PORTAL_LABEL[portal]} portait déjà cet état.`);
      } else {
        poser(vue.id, [portal], retirer ? "retire" : "en-ligne");
        if (retirer) {
          setUndo({
            label: `Annonce retirée de ${PORTAL_LABEL[portal]}.`,
            run: () => void remettre([{ vehicleId: vue.id, portals: [portal] }], `${vue.make} ${vue.model}`),
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
          run: () => void remettre([{ vehicleId: vue.id, portals: changed }], `${vue.make} ${vue.model}`),
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

  /* ── Retour arrière, unitaire ou groupé : la même remise en ligne ── */
  async function remettre(cibles: Array<{ vehicleId: string; portals: Portal[] }>, nom: string) {
    const ids = cibles.map((c) => c.vehicleId).filter((id) => prendre(id));
    if (ids.length === 0) return;
    try {
      // Les cibles peuvent porter des portails différents : un appel par
      // ensemble distinct, ce qui en pratique fait un seul appel.
      const parPortails = new Map<string, string[]>();
      for (const c of cibles) {
        const k = [...c.portals].sort().join(",");
        parPortails.set(k, [...(parPortails.get(k) ?? []), c.vehicleId]);
      }
      let total = 0;
      for (const [k, vehicleIds] of parPortails) {
        const portals = k.split(",") as Portal[];
        const r = await appelerGroupe(vehicleIds, portals, "restore");
        for (const c of r.changed) {
          poser(c.vehicleId, c.portals, "en-ligne");
          total += c.portals.length;
        }
      }
      toast.success(`${nom} · remis en ligne (${formatNumber(total)} emplacement${total > 1 ? "s" : ""}).`);
    } catch (e) {
      if (estAbandon(e)) return;
      toast.error((e as Error).message);
    } finally {
      ids.forEach(rendre);
      startTransition(() => router.refresh());
    }
  }

  /* ── Gestes groupés sur la sélection ── */
  async function groupe(action: "publish" | "unpublish", portals: Portal[], libelle: string) {
    const ids = [...selection].filter((id) => prendre(id));
    if (ids.length === 0) return;
    setGroupeeEnCours(true);
    try {
      const r = await appelerGroupe(ids, portals, action);
      const touches = r.changed.filter((c) => c.portals.length > 0);
      const total = touches.reduce((n, c) => n + c.portals.length, 0);

      for (const c of r.changed) {
        if (c.portals.length > 0) poser(c.vehicleId, c.portals, action === "publish" ? "en-ligne" : "retire");
      }

      if (total === 0 && r.skipped.length === 0) {
        toast.info("La sélection portait déjà cet état.");
      } else {
        const morceaux: string[] = [];
        if (total > 0) {
          morceaux.push(
            `${libelle} : ${formatNumber(touches.length)} véhicule${touches.length > 1 ? "s" : ""}, ${formatNumber(total)} emplacement${total > 1 ? "s" : ""}.`,
          );
        }
        if (r.skipped.length > 0) {
          const noms = r.skipped.map((x) => x.vehicle || "une fiche").slice(0, 3).join(", ");
          morceaux.push(`Écartés : ${noms}${r.skipped.length > 3 ? "…" : ""} (${r.skipped[0].reason}).`);
        }
        (total > 0 ? toast.success : toast.error)(morceaux.join(" "));
      }

      if (action === "unpublish" && total > 0) {
        const cibles = touches.map((c) => ({ vehicleId: c.vehicleId, portals: c.portals }));
        setUndo({
          label: `${formatNumber(total)} emplacement${total > 1 ? "s" : ""} retiré${total > 1 ? "s" : ""}.`,
          run: () => void remettre(cibles, "Sélection"),
        });
      }
      setSelection(new Set());
    } catch (e) {
      if (estAbandon(e)) return;
      toast.error((e as Error).message);
    } finally {
      ids.forEach(rendre);
      setGroupeeEnCours(false);
      startTransition(() => router.refresh());
    }
  }

  /* ── Suspension d'un portail entier ── */
  async function suspendrePortail(portal: Portal) {
    const cibles = lignes.filter((v) => etatDe(v, portal) !== "retire").map((v) => v.id);
    setPortailMenu(null);
    if (cibles.length === 0) {
      toast.info(`${PORTAL_LABEL[portal]} porte déjà zéro annonce.`);
      return;
    }
    const ids = cibles.filter((id) => prendre(id));
    setGroupeeEnCours(true);
    try {
      const r = await appelerGroupe(ids, [portal], "unpublish");
      const touches = r.changed.filter((c) => c.portals.length > 0);
      touches.forEach((c) => poser(c.vehicleId, [portal], "retire"));
      toast.success(
        `${PORTAL_LABEL[portal]} suspendu : ${formatNumber(touches.length)} annonce${touches.length > 1 ? "s" : ""} retirée${touches.length > 1 ? "s" : ""}.`,
      );
      setUndo({
        label: `${PORTAL_LABEL[portal]} suspendu (${formatNumber(touches.length)} annonce${touches.length > 1 ? "s" : ""}).`,
        run: () =>
          void remettre(
            touches.map((c) => ({ vehicleId: c.vehicleId, portals: [portal] })),
            PORTAL_LABEL[portal],
          ),
      });
    } catch (e) {
      if (estAbandon(e)) return;
      toast.error((e as Error).message);
    } finally {
      ids.forEach(rendre);
      setGroupeeEnCours(false);
      startTransition(() => router.refresh());
    }
  }

  const basculerFiltre = (f: Filtre) => setFiltre((c) => (c === f ? "tous" : f));

  const toutesAffichees = affiches.length > 0 && affiches.every((v) => selection.has(v.id));

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
              {`Fichier pour votre agrégateur, adresse pour un portail qui vient lire le flux lui-même. ${formatNumber(dansLeFlux)} véhicule${dansLeFlux > 1 ? "s" : ""} à l'intérieur.`}
            </span>
            <AdresseFlux adresse={adresseFlux} />
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
          label="Arrivées sur 30 j"
          value={stats.arrivees}
          icon="eye"
          index={3}
          hint="visites mesurées sur vos fiches"
        />
      </div>
      <MentionArrivees />

      {/* Recherche : marque, modèle, année. Les réglages vivent dans l'adresse. */}
      <div className="relative mb-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un véhicule…"
          aria-label="Rechercher un véhicule"
          className="w-full pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#6B9FEE]"
          style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.text }}
        />
      </div>

      {lignes.length === 0 || affiches.length === 0 ? (
        <EtatVide
          filtre={lignes.length === 0 ? "tous" : q.trim() ? "recherche" : filtre}
          onReset={() => {
            setFiltre("tous");
            setQ("");
          }}
        />
      ) : (
        <>
          <div className="@container" style={{ border: `1px solid ${T.border}` }}>
            <BandeColonnes onPortail={(p) => setPortailMenu(p)} />

            {affiches.map((vue, i) => {
              const occupee = occupees.has(vue.id);
              const tout = enLigneCount(vue) === PORTALS.length && compter(vue, "a-republier") === 0;
              const aRepublier = compter(vue, "a-republier") > 0;
              const coche = selection.has(vue.id);

              return (
                <LigneDiffusion
                  key={vue.id}
                  vue={{
                    ...vue,
                    etats: Object.fromEntries(PORTALS.map((p) => [p, etatDe(vue, p)])) as Record<
                      Portal,
                      EtatPortail
                    >,
                  }}
                  first={i === 0}
                  href={`/admin/vehicules/${vue.id}`}
                  selection={
                    <input
                      type="checkbox"
                      checked={coche}
                      onChange={() => {
                        setSelection((s) => {
                          const n = new Set(s);
                          if (n.has(vue.id)) n.delete(vue.id);
                          else n.add(vue.id);
                          return n;
                        });
                      }}
                      aria-label={`Sélectionner ${vue.make} ${vue.model}`}
                      className="adm-btn-focus relative z-[1] h-4 w-4 accent-[#6B9FEE] cursor-pointer"
                    />
                  }
                  actionNom={
                    <span className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setPanneau(panneau?.vehicleId === vue.id && panneau.type === "liens" ? null : { type: "liens", vehicleId: vue.id })}
                        aria-expanded={panneau?.vehicleId === vue.id && panneau.type === "liens"}
                        aria-label={`Liens tracés de ${vue.make} ${vue.model}`}
                        title="Liens tracés à coller dans vos annonces"
                        className="adm-act adm-btn-focus adm-row-actions relative z-[1] inline-flex items-center justify-center h-6 w-6"
                        style={{ color: panneau?.vehicleId === vue.id && panneau.type === "liens" ? T.accent : T.muted }}
                      >
                        <Link2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPanneau(panneau?.vehicleId === vue.id && panneau.type === "journal" ? null : { type: "journal", vehicleId: vue.id })}
                        aria-expanded={panneau?.vehicleId === vue.id && panneau.type === "journal"}
                        aria-label={`Journal de diffusion de ${vue.make} ${vue.model}`}
                        title="Journal des mises en ligne et retraits"
                        className="adm-act adm-btn-focus adm-row-actions relative z-[1] inline-flex items-center justify-center h-6 w-6"
                        style={{ color: panneau?.vehicleId === vue.id && panneau.type === "journal" ? T.accent : T.muted }}
                      >
                        <History size={13} />
                      </button>
                    </span>
                  }
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

          {/* Le périmètre de la case maîtresse est nommé : elle porte sur les
              lignes AFFICHÉES, filtre et recherche compris. */}
          <button
            type="button"
            onClick={() => {
              setSelection(toutesAffichees ? new Set() : new Set(affiches.map((v) => v.id)));
            }}
            className="adm-act adm-btn-focus mt-3 text-[11px] tracking-widest uppercase"
            style={{ color: T.muted }}
          >
            {toutesAffichees
              ? "Vider la sélection"
              : `Sélectionner les ${formatNumber(affiches.length)} véhicule${affiches.length > 1 ? "s" : ""} affichés`}
          </button>
        </>
      )}

      {/* Panneau contextuel : liens tracés ou journal du véhicule choisi. */}
      {lignePanneau && panneau?.type === "liens" && (
        <PanneauLiens vue={lignePanneau} onClose={() => setPanneau(null)} />
      )}
      {lignePanneau && panneau?.type === "journal" && (
        <PanneauJournal key={lignePanneau.id} vue={lignePanneau} onClose={() => setPanneau(null)} />
      )}

      <SynthesePortails
        syntheses={syntheses}
        editeurCout={(s) => <EditeurCout synthese={s} onSaved={() => startTransition(() => router.refresh())} />}
      />

      <MentionPied />

      {/* Barre des gestes groupés, posée dès qu'une ligne est cochée. */}
      {selection.size > 0 && (
        <div
          /* Sur téléphone la barre prend la largeur de l'écran ; centrée sur
             son contenu, elle s'empilait en colonne étroite. */
          className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[62] flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
          style={{
            backgroundColor: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 10px 30px rgba(4,11,22,0.5)",
          }}
        >
          <span className="text-[12px] tabular-nums" style={{ color: T.textDim }}>
            {formatNumber(selection.size)} sélectionné{selection.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            disabled={groupeeEnCours}
            onClick={() => groupe("publish", [...PORTALS], "Diffusion")}
            className="adm-act adm-btn-focus inline-flex items-center gap-1.5 min-h-[39px] px-2 text-[11px] tracking-widest uppercase disabled:opacity-50"
            style={{ color: T.accent }}
          >
            {groupeeEnCours ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
            Diffuser
          </button>
          <button
            type="button"
            disabled={groupeeEnCours}
            onClick={() => groupe("unpublish", [...PORTALS], "Retrait")}
            className="adm-act adm-btn-focus inline-flex items-center gap-1.5 min-h-[39px] px-2 text-[11px] tracking-widest uppercase disabled:opacity-50"
            style={{ color: T.muted }}
          >
            <CircleOff size={12} />
            Tout retirer
          </button>
          <button
            type="button"
            onClick={() => setSelection(new Set())}
            className="adm-act adm-btn-focus min-h-[39px] px-2 text-[11px] tracking-widest uppercase"
            style={{ color: T.muted }}
          >
            Effacer
          </button>
        </div>
      )}

      {/* Suspension d'un portail : le seul geste groupé qui demande confirmation,
          il touche tout le stock d'un coup. */}
      <ConfirmDialog
        open={portailMenu !== null}
        title={portailMenu ? `Suspendre ${PORTAL_LABEL[portailMenu]} ?` : ""}
        description={
          portailMenu
            ? `Les ${formatNumber(lignes.filter((v) => etatDe(v, portailMenu) !== "retire").length)} annonces en ligne sur ${PORTAL_LABEL[portailMenu]} passent hors ligne. La bande « Annuler » les remettra telles quelles.${PORTAL_MANUEL[portailMenu] ? " Ce portail se gère à la main : pensez à retirer aussi les annonces sur place." : ""}`
            : undefined
        }
        confirmLabel="Suspendre"
        busy={groupeeEnCours}
        onConfirm={() => portailMenu && void suspendrePortail(portailMenu)}
        onCancel={() => setPortailMenu(null)}
      />

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

/* ── Adresse publique du flux ──
   Un portail partenaire (Annonces-Automobile, un agrégateur) vient lire le
   flux lui-même à cette adresse, sans compte chez nous : la clé portée dans
   l'adresse tient lieu de mot de passe. Le jour où il faut la renvoyer à un
   autre portail, elle est ici. */
function AdresseFlux({ adresse }: { adresse: string | null }) {
  const toast = useToast();
  const [copie, setCopie] = useState(false);

  if (!adresse) {
    return (
      <span className="text-[11px] leading-snug sm:text-right max-w-xs" style={{ color: T.warning }}>
        Adresse publique du flux à activer : posez la clé FLUX_CLE dans les réglages Vercel.
      </span>
    );
  }
  const lien = adresse;

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      toast.success("Adresse du flux copiée.");
      setTimeout(() => setCopie(false), 2000);
    } catch {
      toast.error("La copie a échoué, sélectionnez l'adresse à la main.");
    }
  }

  return (
    <div
      className="flex items-center gap-2 pl-3 min-w-0 w-full sm:w-80 max-w-full"
      style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}
      title={lien}
    >
      <Link2 size={12} className="flex-shrink-0" style={{ color: T.accent }} />
      <code className="text-[11px] truncate flex-1 min-w-0" style={{ color: T.muted }}>
        {lien}
      </code>
      <button
        type="button"
        onClick={copier}
        aria-label="Copier l'adresse du flux"
        className="adm-act adm-btn-focus inline-flex items-center justify-center min-h-[36px] w-9 flex-shrink-0"
        style={{ color: copie ? T.success : T.muted }}
      >
        {copie ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
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

/* ── Journal de diffusion d'un véhicule ──
   Les derniers gestes, datés et signés : « pourquoi cette annonce est-elle
   hors ligne ? » trouve sa réponse ici plutôt que de mémoire. */
type EntreeJournal = {
  id: string;
  portal: string;
  action: string;
  detail: string;
  author: string;
  createdAt: string;
};

function PanneauJournal({ vue, onClose }: { vue: LigneVue; onClose: () => void }) {
  const [entrees, setEntrees] = useState<EntreeJournal[] | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/admin/diffusion/journal?vehicleId=${encodeURIComponent(vue.id)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setEntrees(Array.isArray(d?.entrees) ? d.entrees : []))
      .catch((e) => {
        if ((e as { name?: string })?.name === "AbortError") return;
        setErreur("Le journal est resté injoignable, réessayez.");
      });
    return () => ctrl.abort();
  }, [vue.id]);

  const dateFr = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mt-4 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.textDim }}>
          Journal · {vue.make} {vue.model}
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

      {erreur ? (
        <p className="text-[12px]" style={{ color: T.danger }}>
          {erreur}
        </p>
      ) : entrees === null ? (
        <p className="text-[12px] inline-flex items-center gap-2" style={{ color: T.muted }}>
          <Loader2 size={12} className="animate-spin" /> Chargement du journal…
        </p>
      ) : entrees.length === 0 ? (
        <p className="text-[12px]" style={{ color: T.muted }}>
          Le journal s&apos;écrira au premier geste de diffusion sur ce véhicule.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entrees.map((e) => (
            <li key={e.id} className="grid grid-cols-[92px_150px_1fr] items-baseline gap-x-3 text-[12px]">
              <span className="tabular-nums" style={{ color: T.muted }}>
                {dateFr(e.createdAt)}
              </span>
              <span style={{ color: e.action === "refus" ? T.danger : e.action.startsWith("retrait") ? T.warning : T.success }}>
                {JOURNAL_LABEL[e.action as JournalAction] ?? e.action}
              </span>
              <span className="min-w-0 truncate" style={{ color: T.textDim }} title={`${e.detail}${e.author ? ` · ${e.author}` : ""}`}>
                {e.detail}
                {e.author && <span style={{ color: T.muted }}> · {e.author}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ── Saisie du coût mensuel d'un portail ──
   Deux champs auraient suffi, un seul fait l'affaire : le montant du mois en
   cours, en euros. La valeur rend le coût par contact calculable. */
function EditeurCout({ synthese, onSaved }: { synthese: PortailSynthese; onSaved: () => void }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [valeur, setValeur] = useState(synthese.coutCents !== null ? String(Math.round(synthese.coutCents / 100)) : "");
  const [enCours, setEnCours] = useState(false);

  async function enregistrer() {
    const euros = Number(valeur.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 0) {
      toast.error("Le montant se saisit en euros, chiffres seulement.");
      return;
    }
    setEnCours(true);
    try {
      const res = await fetch("/api/admin/diffusion/couts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal: synthese.portal, amountCents: Math.round(euros * 100) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "L'enregistrement a échoué.");
      toast.success(`${PORTAL_COLONNE[synthese.portal]} · coût du mois enregistré.`);
      setOuvert(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="adm-act adm-btn-focus tabular-nums underline decoration-dotted underline-offset-2"
        style={{ color: synthese.coutCents !== null ? T.text : T.muted }}
        title={`Saisir le coût ${PORTAL_COLONNE[synthese.portal]} du mois ${synthese.mois}`}
      >
        {synthese.coutCents !== null ? `${formatNumber(Math.round(synthese.coutCents / 100))} €` : "à saisir"}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void enregistrer();
          if (e.key === "Escape") setOuvert(false);
        }}
        aria-label={`Coût mensuel ${PORTAL_COLONNE[synthese.portal]} en euros`}
        className="w-16 px-1.5 py-0.5 text-right text-[12px] tabular-nums outline-none focus:border-[#6B9FEE]"
        style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.text }}
      />
      <button
        type="button"
        disabled={enCours}
        onClick={() => void enregistrer()}
        aria-label="Enregistrer le coût"
        className="adm-act adm-btn-focus inline-flex items-center justify-center h-6 w-6 disabled:opacity-50"
        style={{ color: T.success }}
      >
        {enCours ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
      </button>
    </span>
  );
}
