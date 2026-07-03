import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Bascule « réglé » d'un problème, ou édition du contenu.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { noteId } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.resolved === "boolean") data.resolved = body.resolved;
    if (typeof body.content === "string" && body.content.trim()) data.content = body.content.trim();

    const note = await prisma.vehicleNote.update({ where: { id: noteId }, data });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { noteId } = await params;
  try {
    await prisma.vehicleNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
