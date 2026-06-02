import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = ["status", "content", "tag"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );

  const note = await prisma.collabNote.update({ where: { id }, data });
  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const note = await prisma.collabNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (note.author !== session.name) {
    return NextResponse.json({ error: "Seul l'auteur peut supprimer cette note" }, { status: 403 });
  }

  const deleted = await prisma.collabNote.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(deleted);
}
