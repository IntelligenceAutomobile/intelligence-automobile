// Image de partage (Open Graph) d'une fiche véhicule : la première photo du
// véhicule, recadrée en 1200×630 et compressée sous la barre des ~600 Ko que
// WhatsApp impose aux aperçus. Les photos d'origine pèsent plusieurs Mo.
//
// Référencée par le `generateMetadata` de la fiche. Servie à des robots anonymes
// (WhatsApp, LinkedIn…), donc jamais de photo d'annonce masquée : ici, une fiche
// non publiée répond 404, même pour un admin connecté.
//
// Tout se charge en HTTP, y compris les photos rangées sous /public (servies par
// le CDN sur la même origine). Une lecture disque avec chemin variable pousserait
// Vercel à embarquer les 430 Mo de public/ dans la fonction, au-delà de sa
// limite de 250 Mo : c'est précisément ce qui a rejeté le premier déploiement.

import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 82;

// Repli quand la fiche est dépourvue de photo : le visuel de la page /vehicules.
const FALLBACK_PATH = "/og/vehicules.jpg";

/**
 * Résout la source à télécharger. Les fiches mélangent deux formes : URL Vercel
 * Blob (uploads récents) et chemin encodé sous /public (fiches d'origine), que
 * l'origine de la requête suffit à servir.
 */
function sourceUrl(image: string | undefined, origin: string): URL {
  if (!image) return new URL(FALLBACK_PATH, origin);
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return new URL(image);
  }
  return new URL(image, origin);
}

async function fetchImage(url: URL): Promise<ArrayBuffer | undefined> {
  const res = await fetch(url).catch(() => undefined);
  if (!res?.ok) return undefined;
  return res.arrayBuffer();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { images: true, isPublished: true },
  });

  if (!vehicle?.isPublished) {
    return new Response("Not found", { status: 404 });
  }

  let first: string | undefined;
  try {
    first = (JSON.parse(vehicle.images) as string[])[0];
  } catch {
    first = undefined;
  }

  const { origin } = new URL(req.url);
  const source =
    (await fetchImage(sourceUrl(first, origin))) ??
    (await fetchImage(new URL(FALLBACK_PATH, origin)));
  if (!source) {
    return new Response("Not found", { status: 404 });
  }

  const body = await sharp(source)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/jpeg",
      // Les robots des messageries rappellent souvent la même URL : on sert
      // depuis le cache CDN, avec revalidation en tâche de fond après 24 h.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
