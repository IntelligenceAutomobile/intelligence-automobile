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
  // Le reste à faire des réunions ANTÉRIEURES ouvre le point : c'est le premier
  // geste d'une réunion récurrente. Les lignes restent chez leur réunion d'origine
  // plutôt que d'être recopiées, sans quoi elles compteraient double partout.
  const [older, newer, pending] = await Promise.all([
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
    prisma.meetingItem.findMany({
      where: { type: "action", status: { not: "fait" }, meeting: { date: { lt: row.date } } },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        content: true,
        owner: true,
        dueDate: true,
        status: true,
        doneAt: true,
        meeting: { select: { id: true, title: true, date: true } },
      },
    }),
  ]);

  // Les échéances d'abord, de la plus ancienne à la plus lointaine ; les actions
  // sans date ferment la marche, comme partout ailleurs dans le module. Trié en
  // base, la chaîne vide se classait AVANT les dates et les retards se retrouvaient
  // en bas du bloc censé les mettre en avant.
  const pendingSorted = [...pending]
    .sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"))
    .slice(0, 20);

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
      pending={pendingSorted.map((p) => ({
        id: p.id,
        type: "action",
        content: p.content,
        owner: p.owner,
        dueDate: p.dueDate,
        status: p.status,
        doneAt: p.doneAt,
        meetingId: p.meeting.id,
        meetingTitle: p.meeting.title,
        meetingDate: p.meeting.date,
      }))}
    />
  );
}
