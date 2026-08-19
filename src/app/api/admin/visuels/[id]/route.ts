import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/** Renomme un visuel de la bibliothèque. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  let nom = "";
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === "object" && "nom" in parsed) {
      const brut = (parsed as { nom: unknown }).nom;
      nom = typeof brut === "string" ? brut.trim().slice(0, 120) : "";
    }
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }
  if (!nom) return NextResponse.json({ error: "Nom manquant" }, { status: 400 });

  const visuel = await prisma.visuel.update({ where: { id }, data: { nom }, select: { id: true, nom: true } });
  return NextResponse.json(visuel);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const visuel = await prisma.visuel.findUnique({
    where: { id },
    select: { imageUrl: true, photoUrl: true },
  });
  if (!visuel) return NextResponse.json({ ok: true });

  await prisma.visuel.delete({ where: { id } });

  // Les deux fichiers partent avec la fiche : sans ce ménage, chaque visuel
  // effacé laisserait une photo pleine taille sur le stockage, à la charge du
  // site pour toujours. L'échec reste sans conséquence pour l'utilisateur, la
  // fiche est déjà partie.
  const fichiers = [visuel.imageUrl, visuel.photoUrl].filter(Boolean);
  if (fichiers.length > 0) {
    try {
      await del(fichiers);
    } catch {
      /* stockage indisponible ou jeton absent en local : la fiche est effacée */
    }
  }

  return NextResponse.json({ ok: true });
}
