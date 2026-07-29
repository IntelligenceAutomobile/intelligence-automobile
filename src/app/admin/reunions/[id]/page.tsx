import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { parseAttachments, parseAttendees, parseSnapshot } from "@/lib/reunions";
import ReunionFiche from "./ReunionFiche";

export default async function ReunionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const row = await prisma.meeting.findUnique({
    where: { id },
    include: { items: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!row) notFound();

  // Réunions voisines : rejouer l'année de proche en proche sans repasser par la
  // liste. Le départage par date de création évite qu'un même jour boucle sur place.
  const [older, newer] = await Promise.all([
    prisma.meeting.findFirst({
      where: {
        id: { not: row.id },
        OR: [{ date: { lt: row.date } }, { date: row.date, createdAt: { lt: row.createdAt } }],
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    }),
    prisma.meeting.findFirst({
      where: {
        id: { not: row.id },
        OR: [{ date: { gt: row.date } }, { date: row.date, createdAt: { gt: row.createdAt } }],
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    }),
  ]);

  return (
    <ReunionFiche
      meeting={{
        id: row.id,
        date: row.date,
        title: row.title,
        kind: row.kind,
        attendees: parseAttendees(row.attendees),
        location: row.location,
        summary: row.summary,
        author: row.author,
        snapshot: parseSnapshot(row.snapshot),
        attachments: parseAttachments(row.attachments),
        items: row.items.map((i) => ({
          id: i.id,
          type: i.type,
          content: i.content,
          owner: i.owner,
          dueDate: i.dueDate,
          status: i.status,
          doneAt: i.doneAt,
        })),
      }}
      today={parisDay(new Date()).toISOString().slice(0, 10)}
      canDelete={can(asRole(session.admin.role), "delete")}
      olderId={older?.id ?? null}
      newerId={newer?.id ?? null}
    />
  );
}
