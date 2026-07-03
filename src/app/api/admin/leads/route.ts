import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { isSource, isStage } from "@/lib/crm";

// Création d'un lead pour un client existant.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const clientId = String(body.clientId ?? "");
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 400 });

    const collab = await getCollabSession();
    const lead = await prisma.lead.create({
      data: {
        clientId,
        title: String(body.title ?? "").trim(),
        stage: isStage(body.stage) ? body.stage : "nouveau",
        source: isSource(body.source) ? body.source : "manuel",
        vehicleId: typeof body.vehicleId === "string" && body.vehicleId ? body.vehicleId : null,
        budget: typeof body.budget === "number" && body.budget > 0 ? Math.round(body.budget) : null,
        events: { create: { type: "creation", content: "Lead créé", author: collab?.name ?? "" } },
      },
      include: { events: true },
    });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  }
}
