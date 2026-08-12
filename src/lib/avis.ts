// Règles de la demande d'avis : à partir de quand elle porte, et sur quoi elle
// s'appuie. Module neutre (aucun accès base, aucun hook) : l'écran du
// back-office et la démonstration publique /demopro le partagent.
import { addDays, daysSince } from "./relances";

/** Le meilleur moment se situe trois jours après la remise des clés. */
export const AVIS_DELAI_JOURS = 3;

/** Au-delà, la demande arrive tiède : l'étiquette d'ancienneté s'éteint. */
export const AVIS_FENETRE_JOURS = 60;

/** Liste active. Les ventes plus anciennes se rangent dans un bloc repliable. */
export const AVIS_LISTE_JOURS = 183;

/** Délai avant que le rappel se propose. */
export const AVIS_RAPPEL_JOURS = 15;

/** Durée d'un report, quand la ligne se met de côté. */
export const AVIS_REPORT_JOURS = 7;

/**
 * Nombre total d'envois vers un même achat : l'invitation, puis un rappel.
 * Au-delà, l'insistance se retourne contre l'enseigne.
 */
export const AVIS_ENVOIS_MAX = 2;

/** D'où vient l'éligibilité, du plus solide au plus approximatif. */
export type AchatKind = "livraison" | "facture" | "vente";

const RANG: Record<AchatKind, number> = { livraison: 3, facture: 2, vente: 1 };

export type AchatRef = {
  kind: AchatKind;
  /** Motif affiché sur la ligne : « Livraison effectuée », « Facture F-… réglée ». */
  reason: string;
  /** Jour de référence, YYYY-MM-DD. */
  date: string;
  /** Véhicule concerné, nommé dans le message quand il est connu. */
  vehicle: string;
};

/**
 * Retient l'attache la plus solide.
 *
 * Une livraison inscrite au planning prime sur une facture réglée, qui prime
 * sur la bascule du lead en « gagné ». Cette dernière se produit dès
 * l'acceptation du devis, donc bien avant que le client ait ses clés : s'y
 * fier seul faisait remonter dans la liste un acheteur qui attendait encore sa
 * voiture, et l'invitation lui parlait d'un véhicule qu'il n'avait pas vu.
 *
 * À rang égal, la plus récente gagne : un client qui rachète repart de sa
 * dernière opération.
 */
export function meilleurAchat(connu: AchatRef | undefined, candidat: AchatRef): AchatRef {
  if (!connu) return candidat;
  if (RANG[candidat.kind] !== RANG[connu.kind]) {
    return RANG[candidat.kind] > RANG[connu.kind] ? candidat : connu;
  }
  return candidat.date > connu.date ? candidat : connu;
}

/** Jour à partir duquel la demande porte. */
export function pretLe(dateAchat: string): string {
  return addDays(dateAchat, AVIS_DELAI_JOURS);
}

/** Issue posée à la main sur une ligne. */
export type AvisIssue = "" | "avis" | "ecarte" | "stop";

/** Où ranger une ligne dans la file de travail. */
export type AvisEtat = "bientot" | "pret" | "ancien" | "attente" | "avis" | "ecarte" | "stop";

export type AvisSuivi = {
  /** Jour du dernier envoi, vide tant qu'il reste à faire. */
  requestedAt: string;
  /** Jour de l'opération qui rend le client éligible. */
  reasonDate: string;
  /** Issue posée à la main. */
  outcome: string;
};

export function etatAvis(row: AvisSuivi, today: string): AvisEtat {
  // Un client qui a demandé le calme le reste, même s'il rachète.
  if (row.outcome === "stop") return "stop";

  // Rachat : une opération postérieure au dernier envoi rouvre le dossier. Sans
  // cette règle, un client fidèle sorti une fois de la liste n'y revenait
  // jamais, et son deuxième avis restait impossible à demander.
  const rouvert = Boolean(row.requestedAt) && row.reasonDate > row.requestedAt;
  if (!rouvert) {
    if (row.outcome === "avis") return "avis";
    if (row.outcome === "ecarte") return "ecarte";
    if (row.requestedAt) return "attente";
  }

  // Une vente sans date de référence reste à traiter : mieux vaut la montrer
  // que la ranger dans un repli où elle s'oublierait.
  if (!row.reasonDate) return "pret";
  if (pretLe(row.reasonDate) > today) return "bientot";
  if (daysSince(row.reasonDate, today) > AVIS_LISTE_JOURS) return "ancien";
  return "pret";
}

/** États qui attendent encore un geste. */
export function estAFaire(etat: AvisEtat): boolean {
  return etat === "pret" || etat === "ancien";
}

/**
 * Le rappel se propose quinze jours après l'invitation, une seule fois, et le
 * report le repousse d'autant que demandé.
 */
export function rappelDu(
  row: { requestedAt: string; count: number; snoozeUntil: string },
  today: string,
): boolean {
  if (row.count >= AVIS_ENVOIS_MAX) return false;
  if (row.snoozeUntil && row.snoozeUntil > today) return false;
  if (!row.requestedAt) return false;
  return daysSince(row.requestedAt, today) >= AVIS_RAPPEL_JOURS;
}

/** Ce qui empêche un envoi, écrit pour être lu tel quel à l'écran. */
export function motifRefusEnvoi(
  row: { etat: AvisEtat; requestedAt: string; count: number; snoozeUntil: string },
  today: string,
  jourFr: (iso: string) => string,
): string {
  if (row.etat === "stop") return "Ce client a demandé à ne plus recevoir de messages.";
  if (row.count >= AVIS_ENVOIS_MAX) {
    return "Ce client a déjà reçu son invitation et son rappel.";
  }
  if (row.etat === "attente") {
    if (row.snoozeUntil && row.snoozeUntil > today) {
      return `Cette ligne est mise de côté jusqu'au ${jourFr(row.snoozeUntil)}.`;
    }
    if (!rappelDu({ requestedAt: row.requestedAt, count: row.count, snoozeUntil: row.snoozeUntil }, today)) {
      return `Le rappel se propose ${AVIS_RAPPEL_JOURS} jours après l'invitation, soit le ${jourFr(
        addDays(row.requestedAt, AVIS_RAPPEL_JOURS),
      )}.`;
    }
  }
  return "";
}

export const MOTIF_LIVRAISON_FAITE = "Livraison effectuée";
const MOTIF_LIVRAISON_PREVUE = "Livraison prévue";

/**
 * Motif affiché sur la ligne. Une livraison inscrite au planning pour la
 * semaine prochaine s'annonçait « effectuée », ce que la date qui suit
 * démentait aussitôt : elle se dit au futur tant qu'elle reste à venir.
 */
export function motifAffiche(kind: AchatKind, reason: string, etat: AvisEtat): string {
  if (kind !== "livraison") return reason;
  return etat === "bientot" ? MOTIF_LIVRAISON_PREVUE : MOTIF_LIVRAISON_FAITE;
}

/** Phrase d'aide sous le bloc des acheteurs qui arrivent. */
export const AVIS_CONSEIL_MOMENT =
  "Le meilleur moment se situe trois jours après la remise des clés, du mardi au jeudi.";

/**
 * La règle Google, écrite à l'écran. Google range la sollicitation sélective
 * des clients satisfaits dans ses contenus interdits, et sanctionne par la
 * suppression de tous les avis de la fiche.
 */
export const AVIS_REGLE_GOOGLE =
  "Chaque acheteur reçoit la même invitation et le même lien, ce qui garde votre fiche Google saine.";

/* ── Liens portés par le jeton du client ──
   Le message renvoie vers le site, qui enregistre le passage puis redirige vers
   Google en une fraction de seconde. Le détour reste invisible pour le client,
   et il répond à la seule question qui compte : combien de clients ouvrent
   réellement le lien. Le même jeton sert au QR code, au SMS et à l'opposition. */

/** Chemin mesuré, sans le jeton : une adresse mesurable désigne un écran, jamais une personne. */
export const AVIS_CHEMIN_MESURE = "/avis";

/** Marqueurs d'origine des passages, à côté des liens semés dans les annonces. */
export const AVIS_SRC = "avis";
/** Le QR code du comptoir, le lien court et la carte de livraison. */
export const AVIS_SRC_COMPTOIR = "avis-comptoir";

/** Lien sans destinataire : QR code, lien court, carte de livraison. */
export function lienAvisComptoir(origin: string): string {
  return `${origin.replace(/\/$/, "")}/avis`;
}

export function lienAvis(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/avis/${token}`;
}

export function lienStop(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/avis/stop/${token}`;
}

/** Texte de SMS prêt à coller, sous la limite d'un message simple. */
export function texteSms(brandName: string, vehicle: string, lien: string): string {
  const voiture = vehicle ? `votre ${vehicle}` : "votre véhicule";
  return `Bonjour, merci de votre confiance pour ${voiture}. Votre avis nous aide beaucoup : ${lien} — ${brandName}`;
}

/** Phrase d'accroche du message, personnalisée dès que la voiture est connue. */
export function phraseSatisfaction(vehicle: string): string {
  return vehicle
    ? `Nous espérons que votre ${vehicle} vous donne entière satisfaction.`
    : "Nous espérons que votre nouveau véhicule vous donne entière satisfaction.";
}
