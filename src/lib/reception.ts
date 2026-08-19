// Réception : lecture de la boîte IONOS depuis le back-office.
// Le site va chercher les messages en direct (IMAP), sans rien copier en
// base : les emails restent chez IONOS, l'écran n'est qu'une fenêtre.
// La connexion s'ouvre en lecture seule : consulter un message ici ne le
// marque pas comme lu dans la boîte.

import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";

export type MessageResume = {
  uid: number;
  fromName: string;
  fromAddress: string;
  subject: string;
  /** ISO complet. */
  date: string;
  /** Déjà ouvert dans la boîte (webmail, téléphone…). */
  seen: boolean;
};

export type MessageComplet = MessageResume & {
  to: string;
  /** Corps prêt à afficher dans un cadre isolé. */
  html: string;
  attachments: { filename: string; size: number }[];
};

type ImapConfig = { host: string; port: number; user: string; pass: string };

function config(env: NodeJS.ProcessEnv = process.env): ImapConfig | null {
  const user = (env.IMAP_USER ?? "").trim();
  const pass = (env.IMAP_PASSWORD ?? "").trim();
  if (!user || !pass) return null;
  return {
    host: (env.IMAP_HOST ?? "imap.ionos.fr").trim(),
    port: Number(env.IMAP_PORT ?? 993) || 993,
    user,
    pass,
  };
}

/** Vrai quand les accès à la boîte sont renseignés sur ce serveur. */
export function receptionConfiguree(): boolean {
  return config() !== null;
}

async function connexion(c: ImapConfig): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: c.host,
    port: c.port,
    secure: true,
    auth: { user: c.user, pass: c.pass },
    logger: false,
    // Un serveur qui ne répond pas doit rendre la main vite : l'écran
    // affiche une erreur claire plutôt qu'une page qui charge sans fin.
    socketTimeout: 20_000,
    greetingTimeout: 10_000,
  });
  await client.connect();
  return client;
}

function texteAdresse(a: { name?: string; address?: string }[] | undefined): { name: string; address: string } {
  const p = a?.[0];
  return { name: (p?.name ?? "").trim(), address: (p?.address ?? "").trim() };
}

/** Les derniers messages de la boîte, du plus récent au plus ancien. */
export async function listeMessages(limit = 50): Promise<MessageResume[]> {
  const c = config();
  if (!c) throw new Error("Boîte de réception non configurée sur ce serveur.");
  const client = await connexion(c);
  try {
    const boite = await client.mailboxOpen("INBOX", { readOnly: true });
    if (boite.exists === 0) return [];
    const depart = Math.max(1, boite.exists - limit + 1);
    const messages: MessageResume[] = [];
    for await (const msg of client.fetch(`${depart}:*`, { envelope: true, flags: true, uid: true })) {
      const from = texteAdresse(msg.envelope?.from);
      messages.push({
        uid: msg.uid,
        fromName: from.name,
        fromAddress: from.address,
        subject: (msg.envelope?.subject ?? "").trim() || "(sans objet)",
        date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "",
        seen: msg.flags?.has("\\Seen") ?? false,
      });
    }
    messages.sort((a, b) => b.date.localeCompare(a.date));
    return messages;
  } finally {
    await client.logout().catch(() => {});
  }
}

function adressesEnTexte(a: AddressObject | AddressObject[] | undefined): string {
  if (!a) return "";
  const liste = Array.isArray(a) ? a : [a];
  return liste.map((x) => x.text).filter(Boolean).join(", ");
}

/** Un message complet, corps compris. Null si l'uid a disparu de la boîte. */
export async function lireMessage(uid: number): Promise<MessageComplet | null> {
  const c = config();
  if (!c) throw new Error("Boîte de réception non configurée sur ce serveur.");
  const client = await connexion(c);
  try {
    await client.mailboxOpen("INBOX", { readOnly: true });
    const msg = await client.fetchOne(String(uid), { source: true, envelope: true, flags: true }, { uid: true });
    if (!msg || !msg.source) return null;

    const parsed = await simpleParser(msg.source);
    const from = texteAdresse(msg.envelope?.from);

    // Corps : le HTML du message s'il existe, sinon son texte mis en page.
    // L'affichage se fait dans un cadre isolé (sandbox) : aucun script du
    // message ne s'exécute dans le back-office.
    const html =
      (typeof parsed.html === "string" && parsed.html) ||
      `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${parsed.textAsHtml ?? ""}</div>`;

    return {
      uid,
      fromName: from.name,
      fromAddress: from.address,
      subject: (msg.envelope?.subject ?? "").trim() || "(sans objet)",
      date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "",
      seen: msg.flags?.has("\\Seen") ?? false,
      to: adressesEnTexte(parsed.to),
      html,
      attachments: (parsed.attachments ?? []).map((a) => ({
        filename: a.filename ?? "pièce jointe",
        size: a.size ?? 0,
      })),
    };
  } finally {
    await client.logout().catch(() => {});
  }
}
