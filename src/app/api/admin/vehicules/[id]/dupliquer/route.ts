import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Duplique une fiche véhicule pour repartir d'une base au lieu de tout resaisir.
// La copie arrive masquée et disponible : elle n'apparaît sur le site public
// qu'une fois relue et publiée à la main.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    // Les trois colonnes gérées par la base sont écartées à la lecture : la copie
    // reçoit son propre identifiant et ses propres dates.
    const source = await prisma.vehicle.findUnique({
      where: { id },
      omit: { id: true, createdAt: true, updatedAt: true },
    });
    if (!source) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });

    const copy = await prisma.vehicle.create({
      data: {
        ...source,
        model: `${source.model} (copie)`,
        status: "disponible",
        isPublished: false,
        // Tout ce qui décrit UN exemplaire précis repart à vide : photos, état
        // constaté, carnet d'entretien et documents appartiennent à la voiture
        // d'origine. La description, les équipements et la fiche technique se
        // recopient, c'est le but de la duplication.
        images: "[]",
        conditionFacts: "[]",
        maintenanceHistory: "[]",
        maintenanceHighlights: "[]",
        documents: "[]",
      },
    });
    return NextResponse.json({ id: copy.id });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la duplication." }, { status: 500 });
  }
}
