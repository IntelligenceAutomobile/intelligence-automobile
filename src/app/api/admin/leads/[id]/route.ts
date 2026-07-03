import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { STAGE_LABEL, isStage } from "@/lib/crm";

// Mise à jour d'un lead ; un changement d'étape est journalisé dans la timeline.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.vehicleId === "string" || body.vehicleId === null) data.vehicleId = body.vehicleId || null;
    if (typeof body.budget === "number" || body.budget === null) {
      data.budget = typeof body.budget === "number" && body.budget > 0 ? Math.round(body.budget) : null;
    }
    if (isStage(body.stage) && body.stage !== existing.stage) {
      data.stage = body.stage;
    }

    const lead = await prisma.lead.update({ where: { id }, data });

    if (data.stage) {
      const collab = await getCollabSession();
      await prisma.leadEvent.create({
        data: {
          leadId: id,
          type: "etape",
          content: `${STAGE_LABEL[existing.stage as keyof typeof STAGE_LABEL] ?? existing.stage} → ${STAGE_LABEL[lead.stage as keyof typeof STAGE_LABEL] ?? lead.stage}`,
          author: collab?.name ?? "",
        },
      });
    }

    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
