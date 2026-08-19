import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";

// Détail d'un projet : ses propositions complètes, pouces et commentaires inclus.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const projet = await prisma.projet.findUnique({
    where: { id },
    include: {
      propositions: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          reactions: { orderBy: { createdAt: "asc" } },
          comments: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!projet || projet.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json(projet);
}

const ALLOWED_FIELDS = ["title", "description", "status"];
const STATUSES = ["en_cours", "en_pause", "termine"];

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
  if (typeof data.title === "string" && !data.title.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }
  if (typeof data.status === "string" && !STATUSES.includes(data.status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const projet = await prisma.projet.update({ where: { id }, data });
  return NextResponse.json(projet);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const projet = await prisma.projet.findUnique({ where: { id } });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Suppression douce : le projet disparaît des écrans, l'historique reste en base.
  const deleted = await prisma.projet.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json(deleted);
}
