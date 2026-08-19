import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { parseAttachments } from "@/lib/collab-attachments";

// Pose, change ou retire un pouce. Un pouce par personne et par cible :
// la proposition entière (imageUrl vide) ou un visuel précis (son adresse).
// value : 1 = j'aime, -1 = j'aime pas, 0 = retirer son pouce.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const proposition = await prisma.proposition.findUnique({ where: { id } });
  if (!proposition || proposition.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const value = body.value;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
  if (value !== 1 && value !== -1 && value !== 0) {
    return NextResponse.json({ error: "Valeur invalide" }, { status: 400 });
  }
  // Un pouce « visuel » vise forcément un visuel de la proposition.
  if (imageUrl) {
    const images = parseAttachments(proposition.attachments).filter(a => a.kind === "image");
    if (!images.some(a => a.url === imageUrl)) {
      return NextResponse.json({ error: "Visuel inconnu" }, { status: 400 });
    }
  }

  const where = {
    propositionId_imageUrl_author: {
      propositionId: id,
      imageUrl,
      author: session.name,
    },
  };

  if (value === 0) {
    await prisma.propositionReaction.deleteMany({
      where: { propositionId: id, imageUrl, author: session.name },
    });
  } else {
    await prisma.propositionReaction.upsert({
      where,
      update: { value },
      create: { propositionId: id, imageUrl, author: session.name, value },
    });
  }

  // Renvoie l'état complet des pouces de la proposition : l'écran remplace tout.
  const reactions = await prisma.propositionReaction.findMany({
    where: { propositionId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(reactions);
}
