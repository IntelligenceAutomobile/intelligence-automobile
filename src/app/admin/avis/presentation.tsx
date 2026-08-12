// ────────────────────────────────────────────────────────────────────────────
// Habillage de l'écran des avis clients, partagé par le back-office et la
// démonstration publique /demopro.
//
// Raison d'être : la démo recopiait à la main l'écran des avis, et les deux
// avaient divergé au point que la vitrine montrait plus que le produit (la démo
// affichait le motif d'éligibilité et une date en français, l'écran réel ni
// l'un ni l'autre). Ce qui change ici change des deux côtés, comme pour les
// relances et la diffusion.
//
// Ce module ne connaît ni la base, ni les routes : il reçoit des valeurs à
// afficher et un bloc d'actions. Le back-office y met de vrais boutons, la démo
// y met des boutons de démonstration.
// ────────────────────────────────────────────────────────────────────────────
import { type ReactNode } from "react";
import Link from "next/link";
import {
  Ban,
  Check,
  ChevronDown,
  Hand,
  Mail,
  MailPlus,
  MousePointerClick,
  PauseCircle,
  ShieldCheck,
  Star,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { formatDateFr } from "@/lib/devis";
import { formatNumber } from "@/lib/format";
import {
  AVIS_FENETRE_JOURS,
  AVIS_REGLE_GOOGLE,
  type AchatKind,
  type AvisEtat,
} from "@/lib/avis";
import { T, Tag, type Tone } from "../ui";

/** Ce qu'une ligne d'avis affiche, quel que soit l'écran qui l'utilise. */
export type AvisView = {
  id: string;
  /** Raison sociale à défaut du nom. */
  name: string;
  email: string;
  /** D'où vient l'éligibilité : livraison, facture réglée, ou vente conclue. */
  kind: AchatKind;
  /** Ce qui rend le client éligible : « Livraison effectuée », « Facture F-… réglée ». */
  reason: string;
  /** Jour de l'achat, YYYY-MM-DD. Sert au tri et à la ligne de contexte. */
  reasonDate: string;
  /** Véhicule concerné, nommé dans le message quand il est connu. */
  vehicle: string;
  /** Jour du dernier envoi, YYYY-MM-DD. Vide tant qu'il reste à faire. */
  requestedAt: string;
  /** Nombre d'envois partis : l'invitation, puis son rappel. */
  count: number;
  /** Ligne mise de côté jusqu'à ce jour. */
  snoozeUntil: string;
  /** Motif court d'un écart ou d'un arrêt. */
  note: string;
  /** Jour où le client a ouvert le lien d'avis. Vide tant qu'il reste fermé. */
  clickedAt: string;
  /** Jours depuis l'achat, ou depuis l'envoi sur une ligne déjà traitée. */
  sinceDays: number;
  /** Où ranger la ligne. */
  etat: AvisEtat;
  /** Jour à partir duquel la demande porte, pour les lignes à venir. */
  readyOn: string;
  /** Le rappel se propose, calculé par l'appelant. */
  rappelDu: boolean;
  /** Destinataire en liste rouge : la ligne l'annonce avant tout clic. */
  blocked: boolean;
};

/** Une entrée du journal des invitations. */
export type AvisLogView = {
  id: string;
  clientId: string;
  clientName: string;
  action: string;
  channel: string;
  step: number;
  detail: string;
  author: string;
  at: string;
  /** Lien vers la fiche : calculé par l'appelant, jamais par une fonction passée
   *  en propriété (une page serveur ne peut transmettre que des valeurs). */
  href: string;
};

export const primaryBtnClass =
  "adm-btn-focus inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50";
export const ghostBtnClass =
  "adm-btn-focus inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 border transition-colors hover:border-[#6B9FEE] disabled:opacity-50";
export const ghostBorder = "rgba(159,179,212,0.45)";

/** « il y a 9 jours », et le cas du jour même, qui rendait « il y a 0 jour ». */
function anciennete(jours: number): string {
  if (jours <= 0) return "aujourd'hui";
  return `il y a ${formatNumber(jours)} jour${jours > 1 ? "s" : ""}`;
}

/** « 18 août » : sur quelques jours d'écart, l'année n'apporte rien. */
function jourCourt(iso: string): string {
  return formatDateFr(iso).replace(/\s\d{4}$/, "");
}

/**
 * Étiquette de droite. Elle dit la seule chose qui décide du geste : une ligne
 * à venir donne son jour d'ouverture, une ligne prête donne la fraîcheur de
 * l'achat, une ligne traitée donne son sort.
 */
export function ageOf(it: AvisView): { tone: Tone; text: string; title: string } {
  if (it.etat === "avis") {
    return { tone: "success", text: "Avis reçu", title: `Avis noté, invitation du ${formatDateFr(it.requestedAt)}` };
  }
  if (it.etat === "stop") {
    return { tone: "muted", text: "Arrêt demandé", title: it.note || "Ce client souhaite rester tranquille" };
  }
  if (it.etat === "ecarte") {
    return { tone: "muted", text: "Écarté", title: it.note || "Ligne mise de côté à la main" };
  }
  if (it.etat === "attente") {
    if (it.snoozeUntil && it.snoozeUntil > it.requestedAt && !it.rappelDu && it.count < 2) {
      return {
        tone: "warning",
        text: `de côté jusqu'au ${jourCourt(it.snoozeUntil)}`,
        title: `Reprise le ${formatDateFr(it.snoozeUntil)}`,
      };
    }
    return {
      tone: "success",
      text: it.count > 1 ? `Relancé le ${formatDateFr(it.requestedAt)}` : `Invité le ${formatDateFr(it.requestedAt)}`,
      title: `${it.count > 1 ? "Rappel envoyé" : "Invitation envoyée"} ${anciennete(it.sinceDays)}`,
    };
  }
  if (it.etat === "bientot") {
    return {
      tone: "muted",
      text: `prêt le ${jourCourt(it.readyOn)}`,
      title: `Prêt à solliciter le ${formatDateFr(it.readyOn)}`,
    };
  }
  return {
    tone: it.sinceDays <= AVIS_FENETRE_JOURS ? "accent" : "muted",
    text: it.sinceDays <= 0 ? "aujourd'hui" : `il y a ${formatNumber(it.sinceDays)} j`,
    title: `${it.reason} ${anciennete(it.sinceDays)}`,
  };
}

/* ── Une ligne : le client, son achat, son état, puis les actions ── */
export function AvisLine({
  it,
  first,
  href,
  actions,
}: {
  it: AvisView;
  first: boolean;
  href: string;
  /** Absent sur une ligne à venir : la colonne d'actions disparaît. */
  actions?: ReactNode;
}) {
  const age = ageOf(it);
  const colonnes = actions
    ? "grid-cols-[1fr_auto] @[680px]:grid-cols-[minmax(160px,1fr)_auto_auto]"
    : "grid-cols-[1fr_auto] @[680px]:grid-cols-[minmax(160px,1fr)_auto]";

  return (
    <div
      className={`group relative grid items-center px-4 py-3 gap-x-3 gap-y-2 ${colonnes}`}
      style={{ borderTop: first ? "none" : `1px solid ${T.border}` }}
    >
      {/* Lien de couverture : toute la ligne ouvre la fiche, sauf les actions */}
      <Link
        href={href}
        className="absolute inset-0 adm-btn-focus"
        aria-label={`Ouvrir la fiche de ${it.name}`}
        style={{ zIndex: 0 }}
      />

      <div className="min-w-0">
        <div className="text-sm truncate" style={{ color: T.text }}>
          {it.name}
        </div>
        <div className="text-[11px] flex flex-wrap items-center gap-x-2 min-w-0" style={{ color: T.muted }}>
          {it.vehicle && (
            <span className="truncate" style={{ color: T.textDim }}>
              {it.vehicle}
            </span>
          )}
          <span className="whitespace-nowrap">
            {it.reason}
            {it.reasonDate ? ` le ${formatDateFr(it.reasonDate)}` : ""}
          </span>
          {it.email ? (
            <span className="truncate">{it.email}</span>
          ) : (
            <Link
              href={href}
              className="adm-act relative z-10 inline-flex items-center gap-1 whitespace-nowrap"
              style={{ color: T.warning }}
            >
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
          {it.clickedAt && (
            <span
              className="inline-flex items-center gap-1 whitespace-nowrap"
              style={{ color: T.success }}
              title={`Lien ouvert le ${formatDateFr(it.clickedAt)}`}
            >
              <MousePointerClick size={11} />
              lien ouvert
            </span>
          )}
          {it.note && <span className="truncate italic">{it.note}</span>}
        </div>
      </div>

      <span className="justify-self-end" title={age.title}>
        <Tag tone={age.tone}>{age.text}</Tag>
      </span>

      {actions && (
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-2 col-span-2 @[680px]:col-span-1
                     justify-end border-t @[680px]:border-t-0 pt-2 @[680px]:pt-0"
          style={{ borderColor: T.border }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/* ── Une section : icône colorée par son sens, titre, compteur, puis les lignes ── */
export function AvisSection({
  title,
  icon: Icon,
  iconColor = T.accent,
  count,
  hint,
  empty,
  children,
}: {
  title: string;
  icon: LucideIcon;
  /** La couleur porte le sens : l'accent pour du travail à faire, le vert pour du fait. */
  iconColor?: string;
  count: number;
  /** Ligne d'aide sous le titre. */
  hint?: string;
  /** Affiché à la place de la liste quand elle est vide. Absent, la section
   *  disparaît : pendant une recherche, un titre suivi de rien laissait croire
   *  qu'un bloc s'était vidé. */
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (count === 0 && !empty) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: iconColor }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>
          {title}
        </h2>
        <span className="text-xs" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          · {formatNumber(count)}
        </span>
      </div>
      {hint && count > 0 && (
        <p className="text-[12px] mb-3" style={{ color: T.muted }}>
          {hint}
        </p>
      )}
      {count === 0 ? (
        empty
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Bloc replié : ce qui reste consultable sans encombrer la liste de travail ── */
export function AvisRepli({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <details className="mb-8 group/repli">
      <summary
        className="adm-btn-focus flex items-center gap-2 cursor-pointer list-none select-none py-1"
        style={{ color: T.muted }}
      >
        <ChevronDown size={15} className="transition-transform group-open/repli:rotate-180" />
        <span className="text-[15px] font-semibold" style={{ color: T.textDim }}>
          {title}
        </span>
        <span className="text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
          · {formatNumber(count)}
        </span>
      </summary>
      <div className="@container mt-3" style={{ border: `1px solid ${T.border}` }}>
        {children}
      </div>
    </details>
  );
}

/* ── Journal des invitations : « est-ce que le message est parti ? » ── */
const JOURNAL_STYLE: Record<string, { icon: LucideIcon; label: string; tone: Tone }> = {
  invitation: { icon: Mail, label: "Invitation envoyée", tone: "accent" },
  rappel: { icon: Mail, label: "Rappel envoyé", tone: "warning" },
  manuel: { icon: Hand, label: "Demandé sur place", tone: "accent" },
  avis: { icon: Star, label: "Avis reçu", tone: "success" },
  report: { icon: PauseCircle, label: "Reporté", tone: "warning" },
  arret: { icon: Ban, label: "Arrêt demandé", tone: "muted" },
  ecart: { icon: Ban, label: "Écarté", tone: "muted" },
  reprise: { icon: Undo2, label: "Remis dans la liste", tone: "accent" },
  clic: { icon: MousePointerClick, label: "Lien ouvert", tone: "success" },
};

export function AvisJournal({ entries }: { entries: AvisLogView[] }) {
  if (entries.length === 0) return null;
  return (
    <AvisRepli title="Journal des invitations" count={entries.length}>
      {entries.map((e, i) => {
        const style = JOURNAL_STYLE[e.action] ?? { icon: Mail, label: e.action, tone: "muted" as Tone };
        const Icon = style.icon;
        const quand = new Date(e.at);
        return (
          <div
            key={e.id}
            className="relative flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
          >
            <Link href={e.href} className="absolute inset-0 adm-btn-focus" aria-label={`Ouvrir la fiche de ${e.clientName}`} style={{ zIndex: 0 }} />
            <Icon size={13} style={{ color: TONE_FG[style.tone], flexShrink: 0 }} />
            <span className="text-[12px] whitespace-nowrap" style={{ color: T.textDim }}>
              {style.label}
              {e.step > 1 ? ` ×${e.step}` : ""}
            </span>
            <span className="text-[12px] truncate min-w-0 flex-1" style={{ color: T.text }}>
              {e.clientName}
            </span>
            {e.detail && (
              <span className="text-[11px] truncate hidden @[560px]:inline" style={{ color: T.muted }}>
                {e.detail}
              </span>
            )}
            {e.author && (
              <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted }}>
                {e.author}
              </span>
            )}
            <span
              className="text-[11px] whitespace-nowrap"
              style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}
            >
              {quand.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        );
      })}
    </AvisRepli>
  );
}

const TONE_FG: Record<Tone, string> = {
  accent: T.accent,
  success: T.success,
  warning: T.warning,
  danger: T.danger,
  muted: T.muted,
};

/* ── Rangée de chiffres : ce que la démarche donne, en tête d'écran ── */
export type AvisTuile = {
  cle: string;
  label: string;
  valeur: string;
  hint: string;
  /** La tuile pose un filtre sur la liste quand elle est cliquable. */
  filtrable?: boolean;
};

export function AvisTuiles({
  tuiles,
  actif,
  onFiltre,
}: {
  tuiles: AvisTuile[];
  actif: string;
  onFiltre?: (cle: string) => void;
}) {
  return (
    <div className="grid gap-px mb-8 grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: T.border, border: `1px solid ${T.border}` }}>
      {tuiles.map((t) => {
        const pose = actif === t.cle;
        const contenu = (
          <>
            <div style={{ width: 24, height: 2, backgroundColor: pose ? T.accent : T.border }} className="mb-3" />
            <div className="text-2xl sm:text-3xl font-light mb-1 break-words" style={{ color: T.accent, fontVariantNumeric: "tabular-nums" }}>
              {t.valeur}
            </div>
            <div className="text-[11px] tracking-widest uppercase" style={{ color: T.textDim }}>
              {t.label}
            </div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>
              {t.hint}
            </div>
          </>
        );
        if (!t.filtrable || !onFiltre) {
          return (
            <div key={t.cle} className="p-5" style={{ backgroundColor: T.surface }}>
              {contenu}
            </div>
          );
        }
        return (
          <button
            key={t.cle}
            type="button"
            aria-pressed={pose}
            onClick={() => onFiltre(pose ? "" : t.cle)}
            className="adm-btn-focus p-5 text-left transition-colors hover:border-[#6B9FEE]"
            style={{ backgroundColor: pose ? T.surfaceAlt : T.surface }}
          >
            {contenu}
          </button>
        );
      })}
    </div>
  );
}

/* ── Bloc d'état vide, du même dessin que celui du centre de relances ── */
export function AvisVide({ icon: Icon, tone = T.success, children }: { icon: LucideIcon; tone?: string; children: ReactNode }) {
  return (
    <div
      className="p-6 text-sm flex items-start gap-2.5"
      style={{ border: `1px solid ${T.border}`, color: T.textDim }}
    >
      <Icon size={15} style={{ color: tone, flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

/* ── La règle Google, écrite en pied d'écran ── */
export function AvisRegle() {
  return (
    <p className="text-[12px] flex items-start gap-2 pt-5" style={{ color: T.muted, borderTop: `1px solid ${T.border}` }}>
      <ShieldCheck size={14} style={{ color: T.success, flexShrink: 0, marginTop: 2 }} />
      <span>{AVIS_REGLE_GOOGLE}</span>
    </p>
  );
}

/* ── En-tête : ce qui reste à faire, ce qui attend, ce qui est revenu ── */
export function avisSubtitle(aFaire: number, enAttente: number, avis: number): string {
  const bouts: string[] = [];
  if (aFaire > 0) bouts.push(`${formatNumber(aFaire)} invitation${aFaire > 1 ? "s" : ""} à envoyer`);
  if (enAttente > 0) bouts.push(`${formatNumber(enAttente)} en attente de réponse`);
  if (avis > 0) bouts.push(`${formatNumber(avis)} avis obtenu${avis > 1 ? "s" : ""}`);
  if (bouts.length === 0) return "Invitez vos acheteurs à vous noter sur Google, après la livraison.";
  return `${bouts.join(" · ")}.`;
}

/** Première visite : la liste se remplira toute seule. */
export const AVIS_PREMIERE_VISITE =
  "Vos acheteurs apparaîtront ici dès qu'une vente est conclue ou qu'une facture est réglée.";

/** Travail terminé : tout le monde a reçu son invitation. */
export const AVIS_TRAVAIL_FAIT = "Vos acheteurs ont tous reçu leur invitation.";

/** Icônes des sections, partagées entre le back-office et la démonstration. */
export const AVIS_ICONES = { pret: Star, attente: Mail, avis: Check };
