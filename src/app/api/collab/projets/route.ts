import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

// Liste des projets d'équipe, avec le minimum utile par proposition pour que
// l'écran calcule « en attente de retour » (auteurs des pouces et commentaires)
// et compose la couverture de chaque carte (visuels, du plus récent au plus ancien).
export async function GET() {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const projets = await prisma.projet.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      propositions: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          author: true,
          createdAt: true,
          attachments: true,
          reactions: { select: { author: true } },
          comments: { select: { author: true } },
        },
      },
    },
  });

  return NextResponse.json(projets);
}

export async function POST(req: NextRequest) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  const projet = await prisma.projet.create({
    data: {
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      author: session.name,
    },
  });

  return NextResponse.json(projet, { status: 201 });
}
