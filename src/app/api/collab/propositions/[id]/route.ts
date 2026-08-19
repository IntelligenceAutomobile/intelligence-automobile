import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { sanitizeAttachments } from "@/lib/collab-attachments";

// Modifie une proposition (titre, texte, visuels).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, string> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.content === "string") data.content = body.content.trim();
  if (Array.isArray(body.attachments)) {
    data.attachments = JSON.stringify(sanitizeAttachments(body.attachments));
  }

  const proposition = await prisma.proposition.update({
    where: { id },
    data,
    include: {
      reactions: { orderBy: { createdAt: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json(proposition);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const proposition = await prisma.proposition.findUnique({ where: { id } });
  if (!proposition) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Suppression douce, comme les notes de l'Atelier : l'historique reste en base.
  const deleted = await prisma.proposition.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json(deleted);
}
