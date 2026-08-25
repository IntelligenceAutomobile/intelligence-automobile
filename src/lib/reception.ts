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
  /** Première ligne du message, pour la liste. */
  extrait: string;
};

export type MessageComplet = MessageResume & {
  to: string;
  /** Corps prêt à afficher dans un cadre isolé. */
  html: string;
  /** Texte brut du message, pour la citation dans une réponse. */
  text: string;
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

// ── Extraits ────────────────────────────────────────────────────────────────
// La liste montre la première ligne de chaque message, comme les messageries.
// Le corps texte est récupéré en un aller-retour groupé, puis décodé ici.

type PartieTexte = { part: string; encoding: string; charset: string; html: boolean; size: number };

type NoeudStructure = {
  type?: string;
  part?: string;
  encoding?: string;
  size?: number;
  parameters?: Record<string, string>;
  childNodes?: NoeudStructure[];
};

// Trouve la partie texte d'un message : le texte brut de préférence, le HTML à
// défaut (certains expéditeurs n'envoient que lui).
function trouvePartieTexte(node: NoeudStructure | undefined): PartieTexte | null {
  if (!node) return null;
  if (node.childNodes?.length) {
    let enHtml: PartieTexte | null = null;
    for (const enfant of node.childNodes) {
      const r = trouvePartieTexte(enfant);
      if (r) {
        if (!r.html) return r;
        enHtml = enHtml ?? r;
      }
    }
    return enHtml;
  }
  const t = (node.type ?? "").toLowerCase();
  if (t !== "text/plain" && t !== "text/html") return null;
  return {
    part: node.part || "1",
    encoding: (node.encoding ?? "").toLowerCase(),
    charset: (node.parameters?.charset ?? "utf-8").toLowerCase(),
    html: t === "text/html",
    size: node.size ?? 0,
  };
}

function decodePartie(brut: Buffer, p: PartieTexte): string {
  let octets: Buffer = brut;
  if (p.encoding === "base64") {
    octets = Buffer.from(brut.toString("ascii"), "base64");
  } else if (p.encoding === "quoted-printable") {
    const s = brut
      .toString("ascii")
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-Fa-f]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
    octets = Buffer.from(s, "latin1");
  }
  const latin = /iso-8859|windows-125/.test(p.charset);
  return octets.toString(latin ? "latin1" : "utf8");
}

function versExtrait(texte: string, html: boolean): string {
  let t = texte;
  if (html) {
    t = t
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"');
  }
  return t.replace(/\s+/g, " ").trim().slice(0, 140);
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
    const parties = new Map<number, PartieTexte>();
    for await (const msg of client.fetch(`${depart}:*`, { envelope: true, flags: true, uid: true, bodyStructure: true })) {
      const from = texteAdresse(msg.envelope?.from);
      messages.push({
        uid: msg.uid,
        fromName: from.name,
        fromAddress: from.address,
        subject: (msg.envelope?.subject ?? "").trim() || "(sans objet)",
        date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "",
        seen: msg.flags?.has("\\Seen") ?? false,
        extrait: "",
      });
      // Les pièces jointes volumineuses restent au port : au-delà de 128 Ko,
      // le message s'affiche sans extrait plutôt que de ralentir la liste.
      const p = trouvePartieTexte(msg.bodyStructure as NoeudStructure | undefined);
      if (p && p.size <= 131_072) parties.set(msg.uid, p);
    }

    // Un aller-retour par numéro de partie distinct (en pratique un ou deux) :
    // les corps arrivent groupés au lieu d'une requête par message.
    const groupes = new Map<string, number[]>();
    for (const [uid, p] of parties) {
      const liste = groupes.get(p.part) ?? [];
      liste.push(uid);
      groupes.set(p.part, liste);
    }
    const extraits = new Map<number, string>();
    for (const [part, uids] of groupes) {
      try {
        for await (const msg of client.fetch(uids.join(","), { uid: true, bodyParts: [part] }, { uid: true })) {
          const p = parties.get(msg.uid);
          const brut = msg.bodyParts?.get(part) ?? msg.bodyParts?.values().next().value;
          if (p && brut) extraits.set(msg.uid, versExtrait(decodePartie(brut, p), p.html));
        }
      } catch {
        /* une partie illisible prive d'extrait, jamais de liste */
      }
    }
    for (const m of messages) m.extrait = extraits.get(m.uid) ?? "";

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

/**
 * Les messages reçus d'une adresse donnée, du plus récent au plus ancien :
 * l'historique des échanges sur une fiche client.
 */
export async function messagesDe(adresse: string, limit = 20): Promise<MessageResume[]> {
  const c = config();
  if (!c) throw new Error("Boîte de réception non configurée sur ce serveur.");
  const a = adresse.trim().toLowerCase();
  if (!a.includes("@")) return [];
  const client = await connexion(c);
  try {
    await client.mailboxOpen("INBOX", { readOnly: true });
    const uids = await client.search({ from: a }, { uid: true });
    if (!uids || uids.length === 0) return [];
    const derniers = uids.slice(-limit);
    const messages: MessageResume[] = [];
    for await (const msg of client.fetch(derniers.join(","), { envelope: true, flags: true, uid: true }, { uid: true })) {
      const from = texteAdresse(msg.envelope?.from);
      messages.push({
        uid: msg.uid,
        fromName: from.name,
        fromAddress: from.address,
        subject: (msg.envelope?.subject ?? "").trim() || "(sans objet)",
        date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "",
        seen: msg.flags?.has("\\Seen") ?? false,
        extrait: "",
      });
    }
    messages.sort((x, y) => y.date.localeCompare(x.date));
    return messages;
  } finally {
    await client.logout().catch(() => {});
  }
}

export type PieceJointe = { filename: string; contentType: string; content: Buffer };

/**
 * Une pièce jointe d'un message, par sa position dans la liste affichée.
 * Null quand le message ou la pièce a disparu de la boîte.
 */
export async function pieceJointe(uid: number, index: number): Promise<PieceJointe | null> {
  const c = config();
  if (!c) throw new Error("Boîte de réception non configurée sur ce serveur.");
  const client = await connexion(c);
  try {
    await client.mailboxOpen("INBOX", { readOnly: true });
    const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
    if (!msg || !msg.source) return null;
    const parsed = await simpleParser(msg.source);
    const piece = (parsed.attachments ?? [])[index];
    if (!piece?.content) return null;
    return {
      filename: piece.filename ?? `piece-jointe-${index + 1}`,
      contentType: piece.contentType ?? "application/octet-stream",
      content: piece.content,
    };
  } finally {
    await client.logout().catch(() => {});
  }
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
      extrait: "",
      to: adressesEnTexte(parsed.to),
      html,
      text: (parsed.text ?? "").trim(),
      attachments: (parsed.attachments ?? []).map((a) => ({
        filename: a.filename ?? "pièce jointe",
        size: a.size ?? 0,
      })),
    };
  } finally {
    await client.logout().catch(() => {});
  }
}
