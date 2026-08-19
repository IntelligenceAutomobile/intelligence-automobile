import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

// Supprime un commentaire : chacun efface les siens.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.propositionComment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (comment.author !== session.name) {
    return NextResponse.json({ error: "Réservé à l'auteur du commentaire" }, { status: 403 });
  }

  await prisma.propositionComment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
