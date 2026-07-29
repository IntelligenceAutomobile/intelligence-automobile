import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Actions décidées en réunion, à plat et avec le contexte de leur réunion.
// Alimente la section « Réunions » de l'atelier, où l'équipe travaille au
// quotidien : les décisions restent dans le module Réunions, les actions
// remontent là où elles seront réellement traitées.
//
// Le segment « actions » est fixe : il prime sur /api/admin/reunions/[id], et
// aucun identifiant cuid ne peut valoir « actions ».
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await prisma.meetingItem.findMany({
    where: { type: "action" },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      content: true,
      owner: true,
      dueDate: true,
      status: true,
      doneAt: true,
      meeting: { select: { id: true, title: true, date: true } },
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      content: r.content,
      owner: r.owner,
      dueDate: r.dueDate,
      status: r.status,
      doneAt: r.doneAt,
      meetingId: r.meeting.id,
      meetingTitle: r.meeting.title,
      meetingDate: r.meeting.date,
    })),
  );
}
