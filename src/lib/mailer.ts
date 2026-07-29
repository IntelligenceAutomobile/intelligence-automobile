import { Resend } from "resend";

// ────────────────────────────────────────────────────────────────────────────
// Porte de sortie UNIQUE de tous les emails du site.
//
// Raison d'être : sur un poste de développement, un test automatisé envoie de
// vrais emails dès que la clé d'envoi de production traîne dans un fichier
// d'environnement. Des messages d'essai sont ainsi partis vers l'adresse d'un
// vrai prospect. Ce module rend la chose impossible : hors production, seules
// les adresses réservées par les normes internationales (donc incapables
// d'atteindre qui que ce soit) sortent d'ici.
//
// Le garde-fou eslint (voir eslint.config.mjs) interdit d'importer « resend »
// ailleurs que dans ce fichier : il ne peut donc exister aucun contournement.
// ────────────────────────────────────────────────────────────────────────────

export type MailMode = "live" | "atelier";

export type MailResult = {
  /** Un vrai email est parti. */
  sent: boolean;
  /** Retenu avant l'envoi (mode atelier, ou service d'envoi absent). */
  blocked: boolean;
  /** Référence du message chez le service d'envoi. */
  id?: string;
  /** Le service d'envoi a refusé le message. */
  error?: string;
  /** Pourquoi le message a été retenu. */
  reason?: string;
};

export const MAIL_FROM =
  process.env.RESEND_FROM ?? "Intelligence Automobile <contact@intelligenceautomobile.com>";

/**
 * Mode d'envoi courant.
 * « live » : les emails partent réellement. Uniquement en production.
 * « atelier » : tout ce qui pourrait atteindre une vraie personne est retenu.
 *
 * MAIL_MODE force la valeur. Toute valeur autre que « live » vaut « atelier » :
 * une faute de frappe penche du côté prudent.
 */
export function mailMode(env: NodeJS.ProcessEnv = process.env): MailMode {
  const forced = (env.MAIL_MODE ?? "").trim().toLowerCase();
  if (forced === "live") return "live";
  if (forced) return "atelier";
  // Vercel renseigne VERCEL_ENV : production | preview | development.
  // Un déploiement d'essai (preview) travaille sur la vraie base : il ne doit
  // écrire à personne.
  if (env.VERCEL_ENV) return env.VERCEL_ENV === "production" ? "live" : "atelier";
  return env.NODE_ENV === "production" ? "live" : "atelier";
}

// Domaines qui n'atteignent personne, par construction :
//   .invalid, .test, .localhost, .example  → réservés (RFC 2606 et RFC 6761)
//   example.com / .net / .org              → réservés à la documentation
// Aucun serveur de messagerie ne peut exister derrière : un message adressé là
// s'arrête sur place.
const SANS_DESTINATAIRE = /@(?:[a-z0-9-]+\.)*(?:invalid|test|localhost|example)$|@example\.(?:com|net|org)$/i;

// Adresses autorisées à recevoir hors production, séparées par des virgules.
// Sert à valider une chaîne d'envoi de bout en bout avec sa propre boîte.
function allowlist(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.MAIL_ALLOWLIST ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

export function recipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((a) => String(a ?? "").trim()).filter(Boolean);
}

/**
 * Raison pour laquelle ces destinataires sont refusés, ou null si l'envoi peut
 * se faire. Exporté pour être vérifiable directement par un test.
 */
export function blockReason(to: string | string[], env: NodeJS.ProcessEnv = process.env): string | null {
  if (mailMode(env) === "live") return null;
  const permis = allowlist(env);
  const risque = recipients(to).filter(
    (a) => SANS_DESTINATAIRE.test(a) === false && permis.includes(a.toLowerCase()) === false,
  );
  if (risque.length === 0) return null;
  return `mode atelier : ${risque.join(", ")} peut appartenir à une vraie personne`;
}

// Client construit à la demande : le construire au chargement du module lève
// une exception quand la clé manque, et fait tomber la route entière.
let client: Resend | null | undefined;
function resendClient(): Resend | null {
  if (client === undefined) {
    const key = (process.env.RESEND_API_KEY ?? "").trim();
    client = key ? new Resend(key) : null;
  }
  return client;
}

/** Vrai quand un email peut réellement partir vers cette adresse. */
export function canSendTo(to: string | string[]): boolean {
  return blockReason(to) === null && resendClient() !== null;
}

/**
 * Envoie un email. Seul appel autorisé au service d'envoi dans tout le projet.
 * Ne lève jamais : l'échec se lit dans le résultat.
 */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}): Promise<MailResult> {
  const to = recipients(opts.to);
  if (to.length === 0) return { sent: false, blocked: true, reason: "aucun destinataire" };

  const reason = blockReason(to);
  if (reason) {
    console.log(`[email retenu] « ${opts.subject} » → ${to.join(", ")} · ${reason}`);
    return { sent: false, blocked: true, reason };
  }

  const r = resendClient();
  if (!r) {
    console.log(`[email simulé] « ${opts.subject} » → ${to.join(", ")} · aucune clé d'envoi`);
    return { sent: false, blocked: true, reason: "aucune clé d'envoi configurée sur ce serveur" };
  }

  try {
    // Le service signale ses échecs dans la réponse, jamais en exception : sans
    // ce contrôle, un envoi refusé passe pour réussi.
    const { data, error } = await r.emails.send({
      from: opts.from ?? MAIL_FROM,
      to,
      replyTo: opts.replyTo || undefined,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) return { sent: false, blocked: false, error: error.message ?? "raison inconnue" };
    return { sent: true, blocked: false, id: data?.id };
  } catch (e) {
    return { sent: false, blocked: false, error: e instanceof Error ? e.message : "envoi impossible" };
  }
}
