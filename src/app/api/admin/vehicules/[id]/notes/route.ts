import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { isNoteType } from "@/lib/vehicle-tracking";

// Ajout d'une note d'enquête (problème, solution, observation, administratif).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });

    const body = await req.json();
    const content = String(body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "Le contenu est requis." }, { status: 400 });

    const collab = await getCollabSession();
    const note = await prisma.vehicleNote.create({
      data: {
        vehicleId: id,
        type: isNoteType(body.type) ? body.type : "info",
        content,
        author: collab?.name ?? "",
      },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'ajout." }, { status: 500 });
  }
}
