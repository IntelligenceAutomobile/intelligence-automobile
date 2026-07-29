import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isDateKey, isItemStatus, isItemType } from "@/lib/reunions";

// Ajout d'une décision ou d'une action. Chaque « Entrée » dans la ligne de
// saisie appelle cette route : la ligne est en base avant que le curseur ne
// reparte, donc rien ne peut être perdu en quittant la page.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const body = parsed as Record<string, unknown>;

    const content = String(body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "Le texte est vide." }, { status: 400 });

    const type = isItemType(body.type) ? body.type : "decision";
    const dueDate = isDateKey(body.dueDate) ? body.dueDate : "";
    const owner = String(body.owner ?? "").trim().slice(0, 60);

    // Statut et date de réalisation acceptés à la création : le rétablissement
    // après une suppression annulée doit rendre une action cochée telle quelle,
    // au lieu de la ressusciter en travail à faire.
    const status = type === "action" && isItemStatus(body.status) ? body.status : "a_faire";
    const doneAt = status === "fait" && isDateKey(body.doneAt) ? body.doneAt : "";

    // La réunion doit exister : sans ce contrôle, une fiche supprimée dans un
    // autre onglet renverrait une erreur de contrainte illisible.
    const meeting = await prisma.meeting.findUnique({ where: { id }, select: { id: true } });
    if (!meeting) return NextResponse.json({ error: "Cette réunion a été supprimée." }, { status: 404 });

    // Position : à la suite des lignes du même type.
    const last = await prisma.meetingItem.findFirst({
      where: { meetingId: id, type },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const item = await prisma.meetingItem.create({
      data: {
        meetingId: id,
        type,
        content: content.slice(0, 2000),
        owner: type === "action" ? owner : "",
        dueDate: type === "action" ? dueDate : "",
        status,
        doneAt,
        position: (last?.position ?? 0) + 1,
      },
    });

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "L'ajout a échoué." }, { status: 500 });
  }
}
