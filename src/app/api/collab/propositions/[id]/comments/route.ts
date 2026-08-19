import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { sanitizeAttachments } from "@/lib/collab-attachments";

// Ajoute un commentaire sous une proposition (texte, photos possibles).
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

  const { content, attachments } = await req.json();
  const attachmentList = sanitizeAttachments(attachments);
  const text = typeof content === "string" ? content.trim() : "";
  if (!text && attachmentList.length === 0) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const comment = await prisma.propositionComment.create({
    data: {
      propositionId: id,
      content: text,
      attachments: JSON.stringify(attachmentList),
      author: session.name,
    },
  });
  return NextResponse.json(comment, { status: 201 });
}
