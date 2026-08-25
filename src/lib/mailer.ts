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

// ── Liste rouge ───────────────────────────────────────────────────────────
// Destinataires auxquels aucun message ne part, EN PRODUCTION COMME AILLEURS.
// Le mode atelier ne protège que le poste de développement : un envoi depuis le
// site en ligne, lui, passait tout droit. Une entrée vaut pour une adresse
// exacte (« achat@exemple.be ») ou pour un domaine entier et ses sous-domaines
// (« exemple.be »).
//
// La liste appartient à l'utilisateur : elle se tient depuis l'écran Réglages →
// Emails (table EmailBlock), et tout s'y débloque. Un partenaire suspendu
// aujourd'hui redevient joignable demain sans passer par le code.
//
// Ce tableau-ci reste vide à dessein. Il sert à épingler une valeur dans le code
// lorsqu'un blocage doit résister à tout, y compris à un clic depuis l'écran :
// une adresse d'essai récurrente, par exemple. Protéger un vrai client d'un
// envoi de test n'en a pas besoin, c'est le rôle du mode atelier ci-dessus.
export const LISTE_ROUGE_FIXE: readonly string[] = [];

function normalise(v: string): string {
  return String(v ?? "").trim().toLowerCase().replace(/^@/, "").replace(/\.$/, "");
}

// Une adresse simple, et rien d'autre : un caractère avant l'arobase, un
// domaine avec un point, aucun espace ni séparateur.
const ADRESSE_SIMPLE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

/**
 * Adresse réelle d'un destinataire, qu'il soit écrit « adresse »,
 * « <adresse> » ou « Nom <adresse> ». Renvoie "" quand la valeur ne contient
 * pas exactement une adresse : un carnet d'adresses colle volontiers
 * « Nom <adresse> », et cette forme traversait la liste rouge.
 */
export function adresseSeule(v: string): string {
  const brut = String(v ?? "").trim();
  const chevrons = brut.match(/<([^<>]*)>/);
  const candidat = (chevrons ? chevrons[1] : brut).trim().replace(/[.,;]+$/, "").toLowerCase();
  return ADRESSE_SIMPLE.test(candidat) ? candidat : "";
}

// Liste rouge complète : le socle du code, les ajouts de l'environnement
// (MAIL_BLOCKLIST) et ceux ajoutés depuis l'écran (passés en paramètre).
export function listeRouge(env: NodeJS.ProcessEnv = process.env, ajouts: string[] = []): string[] {
  // Virgule, point-virgule ou espace : une liste écrite à la main se sépare
  // comme son auteur l'entend.
  return [...LISTE_ROUGE_FIXE, ...(env.MAIL_BLOCKLIST ?? "").split(/[,;\s]+/), ...ajouts]
    .map(normalise)
    .filter(Boolean);
}

// Une entrée couvre l'adresse exacte, son domaine et les sous-domaines de
// celui-ci : « exemple.be » couvre « x@mail.exemple.be », jamais « exemple.be.fr ».
// L'adresse est d'abord dégagée de son éventuel emballage « Nom <adresse> ».
function correspond(adresse: string, entree: string): boolean {
  const a = adresseSeule(adresse);
  if (!a || !entree) return false;
  if (a === entree) return true;
  // Le domaine se lit après le dernier arobase.
  const domaine = a.slice(a.lastIndexOf("@") + 1);
  if (!domaine) return false;
  return domaine === entree || domaine.endsWith(`.${entree}`);
}

/** Destinataires refusés par la liste rouge, quel que soit le mode d'envoi. */
export function blockedByRedList(
  to: string | string[],
  env: NodeJS.ProcessEnv = process.env,
  ajouts: string[] = [],
): string[] {
  const liste = listeRouge(env, ajouts);
  return recipients(to).filter((a) => liste.some((e) => correspond(a, e)));
}

/**
 * Destinataires dont l'adresse ne se lit pas : deux adresses collées, texte
 * libre, arobase manquant… Ils sont refusés plutôt que devinés, sinon la liste
 * rouge se contourne avec « achat@bloque.be, moi@ailleurs.fr ».
 */
export function destinatairesIllisibles(to: string | string[]): string[] {
  return recipients(to).filter((a) => adresseSeule(a) === "");
}

// Ajouts de la base, relus au plus une fois par minute. Une base muette ne doit
// jamais ouvrir la porte : en cas d'échec, la dernière liste connue reste, et à
// défaut le socle du code s'applique seul.
let cacheRouge: { at: number; valeurs: string[] } | null = null;

// `frais` force une lecture : au moment d'envoyer, une adresse bloquée il y a
// dix secondes doit déjà être refusée (chaque instance du serveur a sa propre
// mémoire, vider le cache ici ne suffirait pas).
export async function ajoutsListeRouge(frais = false): Promise<string[]> {
  if (!frais && cacheRouge && Date.now() - cacheRouge.at < 60_000) return cacheRouge.valeurs;
  try {
    const { prisma } = await import("./prisma");
    const rows = await prisma.emailBlock.findMany({ select: { value: true } });
    cacheRouge = { at: Date.now(), valeurs: rows.map((r) => r.value) };
    return cacheRouge.valeurs;
  } catch {
    return cacheRouge?.valeurs ?? [];
  }
}

/** Vide le cache de la liste rouge, après un ajout ou un retrait à l'écran. */
export function oublierListeRouge(): void {
  cacheRouge = null;
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
export function blockReason(
  to: string | string[],
  env: NodeJS.ProcessEnv = process.env,
  ajoutsRouge: string[] = [],
): string | null {
  // La liste rouge passe avant tout, y compris en production.
  const rouge = blockedByRedList(to, env, ajoutsRouge);
  if (rouge.length > 0) return `liste rouge : aucun message ne part vers ${rouge.join(", ")}`;

  // Une valeur illisible pourrait cacher une adresse de la liste rouge : on
  // refuse au lieu de deviner.
  const illisibles = destinatairesIllisibles(to);
  if (illisibles.length > 0) {
    return `destinataire illisible : ${illisibles.join(", ")} (attendu une seule adresse simple)`;
  }

  if (mailMode(env) === "live") return null;
  const permis = allowlist(env);
  const risque = recipients(to)
    .map(adresseSeule)
    .filter((a) => SANS_DESTINATAIRE.test(a) === false && permis.includes(a) === false);
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
 * Motif de refus en tenant compte des ajouts enregistrés en base, ou null si
 * l'envoi peut se faire. À préférer dans les routes : c'est la même décision
 * que celle prise par sendMail().
 */
export async function refusEnvoi(to: string | string[]): Promise<string | null> {
  const reason = blockReason(to, process.env, await ajoutsListeRouge(true));
  if (reason) return reason;
  return resendClient() === null ? "aucune clé d'envoi configurée sur ce serveur" : null;
}

// Journal de tous les emails du site : ce qui est parti, ce qui a été retenu,
// ce que le service a refusé. « Est-ce que le message est parti ? » se lisait
// nulle part.
// Un message conservé au journal reste relisible depuis la Messagerie ; au-delà
// de cette taille, le corps est tronqué plutôt que d'alourdir la base.
const CORPS_MAX = 200_000;

async function journalise(entry: {
  to: string[];
  subject: string;
  outcome: "envoye" | "retenu" | "refuse";
  reason?: string;
  origin?: string;
  messageId?: string;
  body?: string;
  payload?: string;
}): Promise<void> {
  try {
    const { prisma } = await import("./prisma");
    await prisma.emailLog.create({
      data: {
        recipients: entry.to.join(", ").slice(0, 500),
        subject: (entry.subject ?? "").slice(0, 300),
        outcome: entry.outcome,
        reason: (entry.reason ?? "").slice(0, 400),
        origin: (entry.origin ?? "").slice(0, 60),
        messageId: entry.messageId ?? "",
        mode: mailMode(),
        body: (entry.body ?? "").slice(0, CORPS_MAX),
        payload: (entry.payload ?? "").slice(0, CORPS_MAX),
      },
    });
  } catch {
    /* le journal ne doit jamais empêcher ni faire échouer un envoi */
  }
}

/**
 * Inscrit au journal un envoi écarté avant même d'appeler sendMail (refus d'une
 * route : liste rouge, document plus éligible…). Sans cela, l'écran Emails
 * ignorait les refus les plus intéressants.
 */
export async function journaliseRefus(entry: {
  to: string | string[];
  subject: string;
  reason: string;
  origin?: string;
}): Promise<void> {
  await journalise({
    to: recipients(entry.to),
    subject: entry.subject,
    outcome: "retenu",
    reason: entry.reason,
    origin: entry.origin,
  });
}

/**
 * Envoie un email. Seul appel autorisé au service d'envoi dans tout le projet.
 * Ne lève jamais : l'échec se lit dans le résultat.
 */
export async function sendMail(opts: {
  to: string | string[];
  /** Copies visibles et cachées : la liste rouge s'applique à elles aussi. */
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  /**
   * Pièces jointes : le service d'envoi télécharge chaque fichier depuis son
   * adresse (`path`), déjà déposé sur le stockage de fichiers du site.
   */
  attachments?: { filename: string; path: string }[];
  /** Provenance, pour le journal : « relance », « envoi-devis », « contact »… */
  origin?: string;
  /**
   * Forme éditable du message (blocs JSON de la Messagerie), conservée au
   * journal pour rouvrir l'envoi en composition.
   */
  payload?: string;
}): Promise<MailResult> {
  const to = recipients(opts.to);
  const cc = recipients(opts.cc ?? []);
  const bcc = recipients(opts.bcc ?? []);
  if (to.length === 0) return { sent: false, blocked: true, reason: "aucun destinataire" };

  // La liste rouge et le mode atelier jugent TOUS les destinataires : une
  // adresse bloquée en copie cachée retient le message entier.
  const tous = [...to, ...cc, ...bcc];
  // Journal : les copies restent lisibles comme telles.
  const auJournal = [...to, ...cc.map((a) => `cc:${a}`), ...bcc.map((a) => `cci:${a}`)];

  // Le journal garde le message tel qu'il est parti (ou aurait dû partir).
  const memoire = { body: opts.html, payload: opts.payload };

  const reason = blockReason(tous, process.env, await ajoutsListeRouge(true));
  if (reason) {
    console.log(`[email retenu] « ${opts.subject} » → ${auJournal.join(", ")} · ${reason}`);
    await journalise({ to: auJournal, subject: opts.subject, outcome: "retenu", reason, origin: opts.origin, ...memoire });
    return { sent: false, blocked: true, reason };
  }

  const r = resendClient();
  if (!r) {
    const sansCle = "aucune clé d'envoi configurée sur ce serveur";
    console.log(`[email simulé] « ${opts.subject} » → ${auJournal.join(", ")} · ${sansCle}`);
    await journalise({ to: auJournal, subject: opts.subject, outcome: "retenu", reason: sansCle, origin: opts.origin, ...memoire });
    return { sent: false, blocked: true, reason: sansCle };
  }

  try {
    // Le service signale ses échecs dans la réponse, jamais en exception : sans
    // ce contrôle, un envoi refusé passe pour réussi. Les adresses partent
    // dégagées de leur emballage : le service ne reçoit que ce qui a été
    // confronté à la liste rouge.
    const { data, error } = await r.emails.send({
      from: opts.from ?? MAIL_FROM,
      to: to.map(adresseSeule),
      cc: cc.length > 0 ? cc.map(adresseSeule) : undefined,
      bcc: bcc.length > 0 ? bcc.map(adresseSeule) : undefined,
      replyTo: opts.replyTo || undefined,
      subject: opts.subject,
      html: opts.html,
      attachments:
        opts.attachments && opts.attachments.length > 0
          ? opts.attachments.slice(0, 10).map((a) => ({ filename: a.filename, path: a.path }))
          : undefined,
    });
    if (error) {
      const motif = error.message ?? "raison inconnue";
      await journalise({ to: auJournal, subject: opts.subject, outcome: "refuse", reason: motif, origin: opts.origin, ...memoire });
      return { sent: false, blocked: false, error: motif };
    }
    await journalise({ to: auJournal, subject: opts.subject, outcome: "envoye", origin: opts.origin, messageId: data?.id, ...memoire });
    return { sent: true, blocked: false, id: data?.id };
  } catch (e) {
    const motif = e instanceof Error ? e.message : "envoi impossible";
    await journalise({ to: auJournal, subject: opts.subject, outcome: "refuse", reason: motif, origin: opts.origin, ...memoire });
    return { sent: false, blocked: false, error: motif };
  }
}
