// Aperçu d'un lien pour l'espace Liens de l'atelier : le serveur va chercher la
// page au moment de l'ajout et en extrait titre, description, image et nom du
// site (balises Open Graph, puis Twitter Cards, puis <title>). Le résultat est
// figé en base : l'aperçu reste stable même si le site visé change.
// Tout est « meilleur effort » : un site qui refuse de répondre donne un aperçu
// vide, la carte affiche alors le domaine et la note. Rien ne casse.

export interface LinkPreview {
  title: string;
  description: string;
  imageUrl: string | null;
  siteName: string;
  domain: string;
}

const FETCH_TIMEOUT_MS = 6500;
// Les balises meta vivent dans le <head> : inutile de télécharger toute la page.
const MAX_HTML_BYTES = 600_000;
// Certains sites (annonces auto notamment) servent une page vide aux robots :
// on se présente comme un navigateur de bureau ordinaire.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Normalise la saisie : « lacentrale.fr » devient « https://lacentrale.fr/ ».
// Renvoie null si l'adresse est invalide ou d'un autre protocole que http(s).
export function normalizeUrl(raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Adresses qui vivent sur la machine ou le réseau local. Le serveur laisse ces
// pages tranquilles : le lien s'enregistre avec sa seule adresse, sans aperçu.
// (new URL ramène déjà les écritures détournées, « 2130706433 » ou
//  « 0177.0.0.1 », à la forme 127.0.0.1 : le test porte donc sur le nom
//  d'hôte normalisé.)
export function isLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80:")) return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function emptyPreview(url: string): LinkPreview {
  return { title: "", description: "", imageUrl: null, siteName: "", domain: domainOf(url) };
}

// Décode les entités HTML courantes des valeurs de balises meta.
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function clean(s: string, max: number): string {
  return decodeEntities(s).replace(/\s+/g, " ").trim().slice(0, max);
}

/* ── Lecture des balises du document ──
   Les motifs du type « <meta[^>]*…["']clé["'] » partaient en temps quadratique
   sur une page mal formée : une suite de « <meta » sans « > » occupait le
   serveur plusieurs dizaines de secondes, en bloquant tout le reste. Le
   document est donc découpé à la main, en une seule passe, et chaque balise
   est lue isolément (donc sur une chaîne courte). */

const ATTR_PROPERTY = /\bproperty\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
const ATTR_NAME     = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
const ATTR_CONTENT  = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

// Longueur au-delà de laquelle une balise est ignorée : une balise <meta>
// légitime tient très largement dedans.
const MAX_TAG_LENGTH = 8000;

function attrValue(tag: string, re: RegExp): string {
  const m = tag.match(re);
  if (!m) return "";
  return m[1] ?? m[2] ?? m[3] ?? "";
}

// Table clé → contenu de toutes les balises <meta> du document, lue une fois.
function collectMeta(html: string): Map<string, string> {
  const found = new Map<string, string>();
  const lower = html.toLowerCase();
  let from = 0;
  for (;;) {
    const start = lower.indexOf("<meta", from);
    if (start === -1) break;
    const end = lower.indexOf(">", start);
    if (end === -1) break;
    from = end + 1;
    if (end - start > MAX_TAG_LENGTH) continue;
    const tag = html.slice(start, end);
    const key = (attrValue(tag, ATTR_PROPERTY) || attrValue(tag, ATTR_NAME)).trim().toLowerCase();
    if (!key || found.has(key)) continue;
    const content = attrValue(tag, ATTR_CONTENT);
    if (content) found.set(key, content);
  }
  return found;
}

// Contenu du <title>, lu par découpage plutôt que par expression régulière.
function extractTitle(html: string): string {
  const lower = html.toLowerCase();
  const open = lower.indexOf("<title");
  if (open === -1) return "";
  const gt = lower.indexOf(">", open);
  if (gt === -1) return "";
  const close = lower.indexOf("</title", gt);
  if (close === -1) return "";
  return html.slice(gt + 1, close);
}

// Lit le début du corps de la réponse, borné à MAX_HTML_BYTES.
async function readHead(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let html = "";
  let received = 0;
  try {
    while (received < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return html;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const preview = emptyPreview(url);
  try {
    if (isLocalHost(new URL(url).hostname)) return preview;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.6",
      },
    });
    if (!res.ok) return preview;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("html")) return preview;

    // Une redirection peut mener sur le réseau local : la page ramenée est
    // alors abandonnée, rien de son contenu ne remonte à l'écran.
    const finalUrl = res.url || url;
    try {
      if (isLocalHost(new URL(finalUrl).hostname)) return preview;
    } catch {
      return preview;
    }

    const html = await readHead(res);
    if (!html) return preview;

    // Le domaine affiché suit les redirections (bit.ly → vrai site).
    preview.domain = domainOf(finalUrl) || preview.domain;

    const meta = collectMeta(html);
    const get = (key: string) => meta.get(key) ?? "";

    const title = get("og:title") || get("twitter:title") || extractTitle(html);
    const description =
      get("og:description") || get("twitter:description") || get("description");
    const image =
      get("og:image:secure_url") || get("og:image") || get("twitter:image");

    preview.title = clean(title, 300);
    preview.description = clean(description, 500);
    preview.siteName = clean(get("og:site_name"), 120);

    if (image) {
      try {
        const resolved = new URL(decodeEntities(image).trim(), finalUrl);
        if (resolved.protocol === "http:" || resolved.protocol === "https:") {
          preview.imageUrl = resolved.href;
        }
      } catch {}
    }
  } catch {
    // Site injoignable, trop lent ou aperçu illisible : la carte vivra sans.
  }
  return preview;
}
