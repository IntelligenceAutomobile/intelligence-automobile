import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const notes = await prisma.collabNote.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { content, tag, imageUrl } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const note = await prisma.collabNote.create({
    data: {
      content: content.trim(),
      tag: tag ?? "général",
      author: session.name,
      imageUrl: imageUrl ?? null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
