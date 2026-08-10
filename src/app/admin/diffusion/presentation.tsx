// ────────────────────────────────────────────────────────────────────────────
// Habillage de l'écran de diffusion, partagé par le back-office et la
// démonstration publique /demopro.
//
// Raison d'être : la démo recopiait à la main l'écran de diffusion (160 lignes),
// et les deux avaient déjà divergé (la démo n'avait pas d'écran vide, et sa note
// de pied disait autre chose). Ce qui change ici change des deux côtés, comme
// pour le stock, les devis et les relances.
//
// Ce module ne connaît ni la base, ni les routes : il reçoit des valeurs à
// afficher et des blocs d'actions. Le back-office y met de vrais boutons, la
// démo y met des boutons de démonstration.
// ────────────────────────────────────────────────────────────────────────────
import { type ReactNode } from "react";
import Link from "next/link";
import { Radio, Check, CircleOff, Clock3, Loader2, AlertTriangle, Search } from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  PORTALS, PORTAL_LABEL, PORTAL_SHORT, PORTAL_COLONNE, PORTAL_MANUEL,
  ANCIENNETE_ALERTE_JOURS, FENETRE_ARRIVEES_JOURS, type EtatPortail, type Portal,
} from "@/lib/diffusion";
import { T, TONE, Thumb, StatusBadge, Tag, btnGhostClass, btnGhostStyle } from "../ui";

/** État transitoire d'une cellule, le temps de l'aller-retour serveur. */
export type TransitPortail = "en-file" | "en-cours";

/** Ce qu'une ligne de diffusion affiche, quel que soit l'écran qui l'utilise. */
export type LigneVue = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  /** disponible | reserve */
  status: string;
  image: string | null;
  /** État par portail, déjà arbitré par l'appelant. */
  etats: Record<Portal, EtatPortail>;
  /** Jours depuis la mise en ligne la plus ancienne encore active. */
  joursEnLigne: number | null;
  /** Jours depuis l'entrée en stock, pour montrer l'écart. */
  joursEnStock: number | null;
  /** Arrivées mesurées sur la fenêtre, toutes origines puis par portail. */
  arrivees: number;
  arriveesParPortail: Record<Portal, number>;
  /** Ce qui empêche de diffuser, et ce qui mériterait d'être complété. */
  bloquants: string[];
  aSignaler: string[];
  /** Un réservé reste visible ici mais sort du fichier envoyé aux portails. */
  dansLeFlux: boolean;
};

/* Paliers calés sur la largeur du CADRE, jamais sur celle de la fenêtre : la
   barre latérale apparaît justement à 1 024 px et vole 232 px, si bien qu'un
   palier calé sur la fenêtre ajoutait une colonne au moment où la place
   disparaissait. Sous 760 px, la ligne devient une carte à deux colonnes. */
export const GRILLE =
  "grid grid-cols-2 items-center gap-x-3 gap-y-2 " +
  "@[760px]:grid-cols-[minmax(130px,1fr)_repeat(4,76px)_78px_126px] " +
  "@[1040px]:grid-cols-[minmax(300px,1fr)_repeat(4,88px)_92px_126px]";

const COLONNES =
  "@[760px]:grid-cols-[minmax(130px,1fr)_repeat(4,76px)_78px_126px] " +
  "@[1040px]:grid-cols-[minmax(300px,1fr)_repeat(4,88px)_92px_126px]";

/** Classe commune aux cellules de portail et aux actions de ligne. */
export const celluleClass =
  "adm-chip adm-btn-focus relative z-[1] inline-flex items-center justify-center gap-1.5 min-h-[39px] w-full px-2 " +
  "text-[10px] tracking-[0.1em] uppercase whitespace-nowrap transition-colors aria-disabled:opacity-50";

export const actionLigneClass =
  "adm-act adm-btn-focus relative z-[1] inline-flex items-center gap-1.5 min-h-[39px] px-2 " +
  "text-[11px] tracking-widest uppercase whitespace-nowrap aria-disabled:opacity-50";

/** Tonalité d'une cellule : la couleur suit l'état, jamais l'inverse. */
export function tonDe(etat: EtatPortail, transit?: TransitPortail) {
  if (transit === "en-file") return TONE.warning;
  if (etat === "en-ligne") return TONE.success;
  if (etat === "a-republier") return TONE.warning;
  return TONE.muted;
}

/** Libellé lu à voix haute : il dit l'état ET ce que fait l'activation. */
export function libelleCellule(vehicule: string, portal: Portal, etat: EtatPortail): string {
  const suffixe =
    etat === "en-ligne"
      ? "en ligne, activer pour retirer l'annonce"
      : etat === "a-republier"
        ? "en ligne avec une fiche modifiée depuis, activer pour retirer l'annonce"
        : "retiré, activer pour mettre en ligne";
  return `${vehicule} · ${PORTAL_LABEL[portal]} · ${suffixe}`;
}

/** Le dedans d'une cellule : icône d'état puis nom du portail. */
export function ContenuCellule({
  portal,
  etat,
  transit,
}: {
  portal: Portal;
  etat: EtatPortail;
  transit?: TransitPortail;
}) {
  return (
    <>
      {transit === "en-file" ? (
        <Clock3 size={12} className="flex-shrink-0" />
      ) : transit === "en-cours" ? (
        <Loader2 size={12} className="animate-spin flex-shrink-0" />
      ) : etat === "en-ligne" ? (
        <Check size={12} className="flex-shrink-0" />
      ) : etat === "a-republier" ? (
        <AlertTriangle size={12} className="flex-shrink-0" />
      ) : (
        <CircleOff size={12} className="flex-shrink-0" />
      )}
      {/* En carte (sous 760 px) rien ne nomme les colonnes : la cellule porte le
          nom complet. En grille, la bande d'en-tête le nomme une fois pour
          toutes, et le sigle suffit — la place rendue va au nom du véhicule. */}
      <span className="@[760px]:hidden">{PORTAL_COLONNE[portal]}</span>
      <span className="hidden @[760px]:inline">{PORTAL_SHORT[portal]}</span>
    </>
  );
}

/* ── Bande d'en-tête : les quatre colonnes portent enfin un nom ── */
export function BandeColonnes() {
  return (
    <div
      className={`hidden @[760px]:grid items-center gap-x-3 px-4 py-2.5 ${COLONNES}`}
      style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}
    >
      <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
        Véhicule
      </span>
      {PORTALS.map((p) => (
        <span
          key={p}
          className="text-[10px] tracking-[0.14em] uppercase text-center truncate"
          style={{ color: T.muted }}
          title={PORTAL_MANUEL[p] ? `${PORTAL_LABEL[p]} · publication manuelle` : PORTAL_LABEL[p]}
        >
          <span className="@[900px]:hidden">{PORTAL_SHORT[p]}</span>
          <span className="hidden @[900px]:inline">{PORTAL_COLONNE[p]}</span>
        </span>
      ))}
      <span className="text-[10px] tracking-[0.14em] uppercase text-right whitespace-nowrap" style={{ color: T.muted }}>
        En ligne
      </span>
      <span className="text-[10px] tracking-[0.14em] uppercase text-right whitespace-nowrap" style={{ color: T.muted }}>
        Action
      </span>
    </div>
  );
}

/* ── Une ligne : véhicule, quatre cellules, ancienneté, action ── */
export function LigneDiffusion({
  vue,
  first,
  href,
  cellules,
  action,
  actionNom,
}: {
  vue: LigneVue;
  first: boolean;
  href: string;
  /** Les quatre cellules, construites par l'appelant (vrai bouton ou bouton de démo). */
  cellules: ReactNode;
  action: ReactNode;
  /** Action discrète posée contre le nom du véhicule (les liens tracés). */
  actionNom?: ReactNode;
}) {
  const ancien = vue.joursEnLigne !== null && vue.joursEnLigne >= ANCIENNETE_ALERTE_JOURS;
  const arriveesPortail = PORTALS.map((p) => ({ p, n: vue.arriveesParPortail[p] ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  return (
    <div
      className={`group relative ${GRILLE} px-4 py-3.5`}
      style={{
        borderTop: first ? "none" : `1px solid ${T.border}`,
        // Liseré toujours présent, transparent au repos : sans lui, la ligne
        // d'un réservé se décalait de deux pixels.
        borderLeft: `2px solid ${vue.status === "reserve" ? T.warning : "transparent"}`,
      }}
    >
      {/* Lien de couverture : la ligne mène à la fiche. Les commandes vivent
          au-dessus, avec pointer-events sur elles seules. */}
      <Link
        href={href}
        className="absolute inset-0 adm-btn-focus"
        aria-label={`Ouvrir la fiche ${vue.make} ${vue.model}`}
      />

      <div className="col-span-2 @[760px]:col-span-1 flex items-center gap-3 min-w-0 relative z-[1] pointer-events-none">
        <Thumb src={vue.image} alt={`${vue.make} ${vue.model}`} w={56} h={42} />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-[11px] tracking-widest uppercase flex-shrink-0" style={{ color: T.accent }}>
              {vue.make}
            </span>
            <span className="text-sm font-medium truncate" style={{ color: T.text }}>
              {vue.model}
            </span>
            {actionNom && <span className="pointer-events-auto flex-shrink-0">{actionNom}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-[11px] tabular-nums" style={{ color: T.muted }}>
              {vue.year} · {formatNumber(vue.price)} €
            </span>
            {vue.status === "reserve" && <StatusBadge status="reserve" />}
            {vue.bloquants.length > 0 ? (
              <Tag tone="danger">{vue.bloquants.length} élément{vue.bloquants.length > 1 ? "s" : ""} à compléter</Tag>
            ) : (
              // Second niveau du contrôle : ce qui mériterait d'être soigné se
              // signale, sans jamais empêcher le geste.
              vue.aSignaler.length > 0 && (
                <span
                  className="text-[10px] tracking-[0.12em] uppercase"
                  style={{ color: T.muted }}
                  title={`Pour une annonce plus forte : ${vue.aSignaler.join(", ")}`}
                >
                  À soigner · {vue.aSignaler.length}
                </span>
              )
            )}
          </div>
          {/* Deuxième ligne d'indices : arrivées mesurées, régime de flux. */}
          <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px]" style={{ color: T.muted }}>
            {vue.arrivees > 0 ? (
              <span className="tabular-nums">
                {formatNumber(vue.arrivees)} arrivée{vue.arrivees > 1 ? "s" : ""} sur {FENETRE_ARRIVEES_JOURS} j
                {arriveesPortail.length > 0 && (
                  <span>
                    {" · "}
                    {arriveesPortail
                      .slice(0, 2)
                      .map((x) => `${formatNumber(x.n)} depuis ${PORTAL_COLONNE[x.p]}`)
                      .join(" · ")}
                  </span>
                )}
              </span>
            ) : (
              <span>Arrivées mesurées dès qu&apos;un lien tracé sera en ligne.</span>
            )}
            {vue.dansLeFlux ? null : <span style={{ color: T.warning }}>· hors flux, réservé</span>}
          </div>
        </div>
      </div>

      {cellules}

      {/* Ancienneté : en ligne d'abord, en stock juste dessous. L'écart entre
          les deux se pilote autrement que leur somme. */}
      <span className="tabular-nums leading-tight @[760px]:text-right relative z-[1] pointer-events-none">
        <span className="@[760px]:hidden text-[10px] tracking-[0.12em] uppercase mr-1.5" style={{ color: T.muted }}>
          En ligne
        </span>
        <span className="text-[12px]" style={{ color: ancien ? T.warning : T.muted }}>
          {vue.joursEnLigne !== null ? `${formatNumber(vue.joursEnLigne)} j` : "—"}
        </span>
        {vue.joursEnStock !== null && (
          <span
            className="@[760px]:block text-[10px] ml-1.5 @[760px]:ml-0 @[760px]:mt-0.5"
            style={{ color: T.muted, opacity: 0.62 }}
            title={`En stock depuis ${vue.joursEnStock} jour${vue.joursEnStock > 1 ? "s" : ""}`}
          >
            stock {formatNumber(vue.joursEnStock)} j
          </span>
        )}
      </span>

      {/* Le bloc d'action se serre à droite pour laisser le reste de la colonne
          au lien de couverture. */}
      <div className="flex justify-end">{action}</div>
    </div>
  );
}

/* ── Écrans vides : trois messages distincts, à la forme affirmative ── */
export type FiltreVide = "tous" | "complet" | "a-completer" | "a-republier";

export function EtatVide({ filtre, onReset }: { filtre: FiltreVide; onReset?: () => void }) {
  let icone = <Radio size={26} />;
  let titre = "Vos annonces à diffuser s'afficheront ici.";
  let aide = "Rendez un véhicule visible sur le site, il rejoint aussitôt cette liste.";
  let action: ReactNode = (
    <Link href="/admin/vehicules" className={btnGhostClass} style={btnGhostStyle}>
      Ouvrir le stock
    </Link>
  );

  const bouton = (libelle: string) => (
    <button type="button" onClick={onReset} className={btnGhostClass} style={btnGhostStyle}>
      {libelle}
    </button>
  );

  if (filtre === "complet") {
    icone = <Search size={24} />;
    titre = "Vos véhicules attendent encore un portail ou deux.";
    aide = "Ce filtre reviendra utile dès qu'une voiture sera diffusée partout.";
    action = bouton("Tout afficher");
  } else if (filtre === "a-completer") {
    icone = <Check size={24} />;
    titre = "Tous vos véhicules sont diffusés partout.";
    aide = "Les quatre portails portent chacune de vos annonces.";
    action = bouton("Tout afficher");
  } else if (filtre === "a-republier") {
    icone = <Check size={24} />;
    titre = "Vos annonces en ligne reflètent vos fiches.";
    aide = "Ce filtre s'allumera dès qu'une fiche bougera après sa mise en ligne.";
    action = bouton("Tout afficher");
  }

  return (
    <div className="flex flex-col items-center text-center px-6 py-14 gap-3" style={{ border: `1px solid ${T.border}` }}>
      <span style={{ color: T.border }}>{icone}</span>
      <p className="text-sm" style={{ color: T.textDim }}>
        {titre}
      </p>
      <p className="text-[12px] max-w-sm" style={{ color: T.muted }}>
        {aide}
      </p>
      {onReset || filtre === "tous" ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ── Mentions de pied, identiques des deux côtés ── */
export function MentionArrivees() {
  return (
    <p className="text-[11px] mb-8 max-w-2xl" style={{ color: T.muted }}>
      {`Les arrivées comptent les visites qui ouvrent une fiche depuis un lien tracé, sur les ${FENETRE_ARRIVEES_JOURS} derniers jours. Le marqueur d'origine vit le temps de la visite : un visiteur qui revient trois jours plus tard compte en accès direct.`}
    </p>
  );
}

export function MentionPied() {
  return (
    <p className="text-[12px] mt-4 max-w-3xl leading-relaxed" style={{ color: T.muted }}>
      Module de démonstration pour la publication : elle demande un compte agrégateur (Ubiflow, Spider VO…) ou des
      comptes pro portails, et Facebook Marketplace se remplit à la main depuis septembre 2021. Le flux XML
      d&apos;export, l&apos;état que vous tenez ici, l&apos;ancienneté des annonces et les arrivées mesurées, eux, sont
      réels.
    </p>
  );
}
