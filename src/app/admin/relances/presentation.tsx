// ────────────────────────────────────────────────────────────────────────────
// Habillage du centre de relances, partagé par le back-office et la
// démonstration publique /demopro.
//
// Raison d'être : la démo recopiait à la main l'écran des relances (250 lignes),
// et les deux avaient déjà divergé. Ce qui change ici change des deux côtés,
// comme pour le stock et la liste des devis qui réutilisent déjà leur composant.
//
// Ce module ne connaît ni la base, ni les routes : il reçoit des valeurs à
// afficher et un bloc d'actions. Le back-office y met de vrais boutons, la démo
// y met des boutons de démonstration.
// ────────────────────────────────────────────────────────────────────────────
import { type ReactNode } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, MailPlus, type LucideIcon } from "lucide-react";
import { formatEuro, formatDateFr } from "@/lib/devis";
import { DEVIS_RELANCE_DAYS, FACTURE_RELANCE_DAYS } from "@/lib/relances";
import { T, Tag } from "../ui";

/** Ce qu'une ligne de relance affiche, quel que soit l'écran qui l'utilise. */
export type RelanceView = {
  id: string;
  number: string;
  client: string;
  clientEmail: string;
  amount: number;
  kind: "devis" | "facture";
  // Jours sans réponse (devis) ou jours de retard après échéance (facture).
  sinceDays: number;
  relanceCount: number;
  lastRelanceDate: string;
  // Envoi réel du devis, émission de la facture.
  startDate: string;
  // Validité du devis dépassée : un renvoi vaut mieux qu'une relance.
  expired: boolean;
  // Destinataire en liste rouge : aucun email ne peut partir vers lui.
  blocked: boolean;
};

/** Une entrée du journal des actions. */
export type HistoryView = {
  id: string;
  quoteId: string;
  number: string;
  client: string;
  action: string;
  detail: string;
  author: string;
  at: string;
  /** Lien vers la fiche : calculé par l'appelant, jamais par une fonction passée
   *  en propriété (une page serveur ne peut transmettre que des valeurs). */
  href: string;
};

export const ghostBtnClass =
  "adm-btn-focus inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 border transition-colors hover:border-[#6B9FEE] disabled:opacity-50";
export const ghostBorder = "rgba(159,179,212,0.45)";
export const primaryBtnClass =
  "adm-btn-focus inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50";

/** Tonalité et libellé de l'ancienneté : l'urgence doit se voir. */
export function ageOf(it: Pick<RelanceView, "kind" | "sinceDays">): { tone: "warning" | "danger"; text: string; title: string } {
  const isFacture = it.kind === "facture";
  const tone = isFacture
    ? it.sinceDays >= FACTURE_RELANCE_DAYS ? "danger" : "warning"
    : it.sinceDays >= DEVIS_RELANCE_DAYS * 2 ? "danger" : "warning";
  const jours = `${it.sinceDays} jour${it.sinceDays > 1 ? "s" : ""}`;
  return {
    tone,
    text: isFacture ? `retard ${it.sinceDays} j` : `${it.sinceDays} j`,
    title: isFacture ? `Échéance dépassée depuis ${jours}` : `Sans réponse depuis ${jours}`,
  };
}

/* ── Une ligne : numéro, client, montant, ancienneté, puis les actions ── */
export function RelanceLine({
  it,
  first,
  href,
  faded = false,
  actions,
}: {
  it: RelanceView;
  first: boolean;
  href: string;
  /** Ligne déjà traitée : elle reste affichée, en retrait. */
  faded?: boolean;
  actions: ReactNode;
}) {
  const isFacture = it.kind === "facture";
  const age = ageOf(it);

  const montant = (
    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
      {formatEuro(it.amount)}
    </span>
  );

  return (
    <div
      className="group relative grid items-center px-4 py-3 gap-x-3 gap-y-2
                 grid-cols-[1fr_auto]
                 @[800px]:grid-cols-[96px_minmax(120px,1fr)_110px_118px_auto]"
      style={{ borderTop: first ? "none" : `1px solid ${T.border}`, opacity: faded ? 0.55 : 1 }}
    >
      {/* Lien de couverture : toute la ligne ouvre la fiche, sauf les actions */}
      <Link
        href={href}
        className="absolute inset-0 adm-btn-focus"
        aria-label={`Ouvrir ${isFacture ? "la facture" : "le devis"} ${it.number}`}
        style={{ zIndex: 0 }}
      />

      <span className="text-xs tracking-widest uppercase whitespace-nowrap" style={{ color: T.accent }}>
        {it.number}
      </span>

      {/* Ancienneté, calée à droite sur téléphone */}
      <span className="@[800px]:hidden justify-self-end" title={age.title}>
        <Tag tone={age.tone}>{age.text}</Tag>
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
            <Link href={href} className="adm-act relative z-10 inline-flex items-center gap-1 whitespace-nowrap" style={{ color: T.warning }}>
              <MailPlus size={11} />
              Ajouter un email
            </Link>
          )}
          {it.blocked && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap" style={{ color: T.danger }}>
              <Ban size={11} />
              Liste rouge
            </span>
          )}
          {it.expired && <span className="whitespace-nowrap" style={{ color: T.danger }}>Validité dépassée</span>}
          {it.relanceCount > 0 && (
            <span className="whitespace-nowrap" style={{ color: T.warning }}>
              {isFacture ? "Relancée" : "Relancé"} ×{it.relanceCount}
              {it.lastRelanceDate ? ` le ${formatDateFr(it.lastRelanceDate)}` : ""}
            </span>
          )}
        </div>
      </div>

      <span className="hidden @[800px]:block text-right">{montant}</span>

      <span className="hidden @[800px]:block" title={age.title}>
        <Tag tone={age.tone}>{age.text}</Tag>
      </span>

      {/* Actions : une barre à part sur téléphone (montant inclus), en fin de ligne ensuite */}
      <div
        className="flex flex-wrap @[800px]:flex-nowrap items-center gap-x-3 gap-y-2 col-span-2 @[800px]:col-span-1
                   justify-between @[800px]:justify-end border-t @[800px]:border-t-0 pt-2 @[800px]:pt-0"
        style={{ borderColor: T.border }}
      >
        <span className="@[800px]:hidden">{montant}</span>
        {actions}
      </div>
    </div>
  );
}

/* ── Une section : titre, compteur, somme en jeu, puis les lignes ── */
export function RelanceSection({
  title,
  hint,
  icon: Icon,
  count,
  sum,
  empty,
  children,
}: {
  title: string;
  hint: string;
  icon: LucideIcon;
  count: number;
  sum: number;
  /** Vrai quand il n'y a aucune ligne à montrer, même traitée. */
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</h2>
        <span className="text-xs" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          · {count}
          {count > 0 && ` · ${formatEuro(sum)}`}
        </span>
      </div>
      {empty ? (
        <div className="p-6 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={15} style={{ color: T.success }} />
          {hint}
        </div>
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── En-tête : nombre de relances et somme en attente ── */
export function relancesSubtitle(count: number, sum: number): string {
  if (count === 0) return "Tout est à jour.";
  return `${count} relance${count > 1 ? "s" : ""} à faire · ${formatEuro(sum)} en attente.`;
}

export const RELANCES_VIDE =
  "Tout est à jour. Le centre se remplit tout seul dès qu'un devis attend une réponse ou qu'une facture dépasse son échéance.";

export const HINT_DEVIS = "Tous vos devis ont reçu une réponse ou une relance récente.";
export const HINT_FACTURES = "Toutes vos factures sont réglées ou relancées récemment.";
