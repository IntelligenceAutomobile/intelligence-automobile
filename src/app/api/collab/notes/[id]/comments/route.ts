import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: noteId } = await params;
  const { content, parentId } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const comment = await prisma.collabComment.create({
    data: {
      noteId,
      content: content.trim(),
      author: session.name,
      parentId: parentId ?? null,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
