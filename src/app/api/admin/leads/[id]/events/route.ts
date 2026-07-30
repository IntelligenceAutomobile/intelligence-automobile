import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { isEventType } from "@/lib/crm";

// Ajout d'une interaction (note, appel, email, RDV) à la timeline d'un lead.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const content = String(body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "Le contenu est requis." }, { status: 400 });

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const collab = await getCollabSession();
    const event = await prisma.leadEvent.create({
      data: {
        leadId: id,
        type: isEventType(body.type) ? body.type : "note",
        content,
        author: collab?.name ?? "",
      },
    });
    // Remonte le lead ET sa fiche client dans les tris « activité récente ».
    await prisma.lead.update({ where: { id }, data: { updatedAt: new Date() } });
    await prisma.client
      .update({ where: { id: lead.clientId }, data: { lastActivityAt: new Date() } })
      .catch(() => {
        /* noter l'échange prime sur la mise à jour du classement */
      });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'ajout." }, { status: 500 });
  }
}
