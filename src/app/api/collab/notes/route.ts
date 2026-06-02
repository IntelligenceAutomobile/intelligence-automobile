import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const notes = await prisma.collabNote.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: { replies: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { content, tag, imageUrl, category } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const note = await prisma.collabNote.create({
    data: {
      content: content.trim(),
      tag: tag ?? "général",
      category: category ?? "général",
      author: session.name,
      imageUrl: imageUrl ?? null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
