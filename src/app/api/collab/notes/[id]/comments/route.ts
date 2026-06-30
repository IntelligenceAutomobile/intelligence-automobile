import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { sanitizeAttachments } from "@/lib/collab-attachments";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: noteId } = await params;
  const { content, parentId, attachments } = await req.json();

  const attachmentList = sanitizeAttachments(attachments);
  const text = typeof content === "string" ? content.trim() : "";

  if (!text && attachmentList.length === 0) {
    return NextResponse.json({ error: "Contenu ou pièce jointe requis" }, { status: 400 });
  }

  const comment = await prisma.collabComment.create({
    data: {
      noteId,
      content: text,
      author: session.name,
      parentId: parentId ?? null,
      attachments: JSON.stringify(attachmentList),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
