import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { fetchLinkPreview, normalizeUrl } from "@/lib/link-preview";
import { sanitizeLinkTag } from "@/lib/collab-links";

export async function GET() {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const links = await prisma.collabLink.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { url: rawUrl, note, tag } = await req.json();
  const url = normalizeUrl(typeof rawUrl === "string" ? rawUrl : "");
  if (!url) {
    return NextResponse.json({ error: "Adresse invalide" }, { status: 400 });
  }

  // L'aperçu est récupéré maintenant puis figé en base : l'affichage reste
  // rapide et stable, même si le site visé change ou disparaît.
  const preview = await fetchLinkPreview(url);

  const link = await prisma.collabLink.create({
    data: {
      url,
      note: typeof note === "string" ? note.trim() : "",
      tag: sanitizeLinkTag(tag),
      title: preview.title,
      description: preview.description,
      imageUrl: preview.imageUrl,
      siteName: preview.siteName,
      domain: preview.domain,
      author: session.name,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
