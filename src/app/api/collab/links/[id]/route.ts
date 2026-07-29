import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { sanitizeLinkTag } from "@/lib/collab-links";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Seuls la note et l'étiquette se modifient après coup : l'adresse et son
  // aperçu restent ceux du moment de l'ajout.
  const data: { note?: string; tag?: string } = {};
  if (typeof body.note === "string") data.note = body.note.trim();
  if ("tag" in body) data.tag = sanitizeLinkTag(body.tag);

  const link = await prisma.collabLink.update({ where: { id }, data });
  return NextResponse.json(link);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const link = await prisma.collabLink.findUnique({ where: { id } });
  if (!link) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Suppression douce : le lien disparaît de l'écran mais reste en base,
  // récupérable à la main en cas de fausse manipulation.
  const deleted = await prisma.collabLink.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(deleted);
}
