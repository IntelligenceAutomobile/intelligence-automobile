import { after, NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import {
  RETENTION_JOURS,
  canalDe,
  cheminMesurable,
  domaineDe,
  estRobot,
  nettoieSrc,
  typeAppareil,
} from "@/lib/audience";

// Collecte des visites du site public. Route publique et sans authentification :
// elle est appelée par le navigateur de chaque visiteur.
//
// Elle répond 204 dans tous les cas, y compris quand elle décide de rien
// enregistrer : rien de ce qu'elle renvoie ne renseigne un curieux.

// Un corps de mesure tient en trois cents octets. Au-delà, la requête part au
// panier sans être lue.
const TAILLE_MAX = 1000;

// Treize mois, la durée annoncée dans les mentions légales.
const VIE_VISITEUR = RETENTION_JOURS * 24 * 60 * 60;

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  const vide = () => new NextResponse(null, { status: 204 });

  const hote = req.headers.get("host") ?? "";

  // Même origine seulement : une page posée sur un autre domaine perd la
  // possibilité de gonfler les chiffres d'un simple appel.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== hote) return vide();
    } catch {
      return vide();
    }
  }

  // Le back-office cesse de se compter lui-même. La présence du cookie de
  // session suffit : aller vérifier la session en base coûterait une lecture
  // à chaque page vue du site.
  if (req.cookies.get("ia_session")) return vide();

  const ua = req.headers.get("user-agent") ?? "";
  if (estRobot(ua)) return vide();

  // sendBeacon envoie du text/plain : le corps se lit en texte puis se décode.
  const brut = await req.text();
  if (brut.length > TAILLE_MAX) return vide();

  let corps: { path?: unknown; referrer?: unknown; src?: unknown };
  try {
    corps = JSON.parse(brut) as typeof corps;
  } catch {
    return vide();
  }

  const path = cheminMesurable(typeof corps.path === "string" ? corps.path : "");
  if (!path) return vide();

  // Première page de la visite : c'est là que l'origine se décide, et c'est
  // cette ligne qui comptera pour une visite.
  const visiteEnCours = req.cookies.get("ia_vis")?.value ?? "";
  const isEntry = visiteEnCours === "";

  // L'origine de la première page suit le visiteur jusqu'à la dernière : un clic
  // venu de Leboncoin reste attribué sur la fiche ouverte trois pages plus loin.
  // Un ?src= explicite reprend la main, c'est un lien fraîchement emprunté.
  const srcExplicite = nettoieSrc(typeof corps.src === "string" ? corps.src : "");
  const src = srcExplicite || nettoieSrc(req.cookies.get("ia_src")?.value ?? "");
  const referrer = isEntry
    ? domaineDe(typeof corps.referrer === "string" ? corps.referrer : "", hote)
    : (req.cookies.get("ia_ref")?.value ?? "").slice(0, 60);

  const vid = req.cookies.get("ia_vid")?.value ?? "";
  const isNew = vid === "";
  const visitorId = vid || crypto.randomUUID();
  const sessionId = visiteEnCours || crypto.randomUUID();

  const maintenant = new Date();
  // Jour civil de Paris : le runtime tourne en UTC, une visite de 23 h
  // basculerait sinon sur le lendemain et « aujourd'hui » deviendrait faux.
  const day = parisDay(maintenant).toISOString().slice(0, 10);

  const reponse = vide();
  reponse.cookies.set("ia_vid", visitorId, { ...COOKIE, maxAge: VIE_VISITEUR });
  // Sans échéance : ces trois-là meurent avec l'onglet, donc avec la visite.
  reponse.cookies.set("ia_vis", sessionId, COOKIE);
  if (src) reponse.cookies.set("ia_src", src, COOKIE);
  if (referrer) reponse.cookies.set("ia_ref", referrer, COOKIE);

  // L'écriture part APRÈS la réponse : le visiteur qui referme aussitôt est
  // compté quand même, et rien ne le fait attendre.
  after(async () => {
    try {
      await prisma.pageView.create({
        data: {
          day,
          path,
          src,
          referrer,
          channel: canalDe(src, referrer),
          visitorId,
          sessionId,
          device: typeAppareil(ua),
          // Le pays vient de l'hébergeur ; l'adresse IP reste à l'écart.
          country: (req.headers.get("x-vercel-ip-country") ?? "").slice(0, 2).toUpperCase(),
          isEntry,
          isNew,
        },
      });
    } catch (e) {
      // La mesure complète le site, elle ne le bloque jamais.
      console.error("[Audience] Échec d'enregistrement de la visite:", e);
    }

    // Ménage : une visite de plus de treize mois cesse d'exister. Le tirage
    // évite une suppression à chaque page vue, la table se tient toute seule.
    if (Math.random() < 0.002) {
      const limite = new Date(maintenant.getTime() - RETENTION_JOURS * 86_400_000)
        .toISOString()
        .slice(0, 10);
      try {
        await prisma.pageView.deleteMany({ where: { day: { lt: limite } } });
      } catch {
        // Le ménage reprendra à la prochaine visite.
      }
    }
  });

  return reponse;
}
