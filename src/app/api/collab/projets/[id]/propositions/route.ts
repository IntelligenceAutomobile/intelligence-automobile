import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { sanitizeAttachments } from "@/lib/collab-attachments";

// Ajoute une proposition au projet : texte et/ou visuels, signée de son auteur.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const projet = await prisma.projet.findUnique({ where: { id } });
  if (!projet || projet.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const { title, content, attachments } = await req.json();
  const attachmentList = sanitizeAttachments(attachments);
  const text = typeof content === "string" ? content.trim() : "";
  if (!text && attachmentList.length === 0) {
    return NextResponse.json({ error: "Texte ou visuel requis" }, { status: 400 });
  }

  const proposition = await prisma.proposition.create({
    data: {
      projetId: id,
      title: typeof title === "string" ? title.trim() : "",
      content: text,
      attachments: JSON.stringify(attachmentList),
      author: session.name,
    },
    include: { reactions: true, comments: true },
  });

  // Remonte le projet en tête de liste : c'est lui qui vient de bouger.
  await prisma.projet.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json(proposition, { status: 201 });
}
