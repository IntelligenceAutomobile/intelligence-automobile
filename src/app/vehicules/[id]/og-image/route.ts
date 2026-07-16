// Image de partage (Open Graph) d'une fiche véhicule : la première photo du
// véhicule, recadrée en 1200×630 et compressée sous la barre des ~600 Ko que
// WhatsApp impose aux aperçus. Les photos d'origine pèsent plusieurs Mo.
//
// Référencée par le `generateMetadata` de la fiche. Servie à des robots anonymes
// (WhatsApp, LinkedIn…), donc jamais de photo d'annonce masquée : ici, une fiche
// non publiée répond 404, même pour un admin connecté.

import { readFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 82;

const PUBLIC_DIR = join(process.cwd(), "public");
// Repli quand la fiche est dépourvue de photo : le visuel de la page /vehicules.
const FALLBACK = join(PUBLIC_DIR, "og", "vehicules.jpg");

/**
 * Charge la source. Les fiches mélangent deux formes : URL Vercel Blob (uploads
 * récents) et chemin encodé sous /public (fiches d'origine).
 */
async function loadSource(image: string | undefined): Promise<Buffer> {
  if (!image) return readFile(FALLBACK);

  if (image.startsWith("http://") || image.startsWith("https://")) {
    const res = await fetch(image);
    if (!res.ok) return readFile(FALLBACK);
    return Buffer.from(await res.arrayBuffer());
  }

  // Chemin local : les URL stockées sont encodées ("/Audit%20TT%204/…").
  const relative = normalize(decodeURIComponent(image)).replace(/^[\\/]+/, "");
  const resolved = join(PUBLIC_DIR, relative);
  // Garde-fou : une valeur en base remontant hors de /public est ignorée.
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + sep)) {
    return readFile(FALLBACK);
  }
  return readFile(resolved);
}

export async function GET(
  _req: Request,
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

  let source: Buffer;
  try {
    source = await loadSource(first);
  } catch {
    source = await readFile(FALLBACK);
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
