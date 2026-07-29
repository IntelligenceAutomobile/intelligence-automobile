import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { isMeetingKind, parseAttendees } from "@/lib/reunions";

import ReunionsClient, { type MeetingRow } from "./ReunionsClient";

const VALID_VIEWS = ["reunions", "decisions", "actions"] as const;

export default async function ReunionsPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; q?: string; annee?: string; type?: string; nouvelle?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;

  // Paramètres d'URL validés par liste blanche : le lien se partage, mais rien
  // de ce qu'il contient n'atteint la base sans contrôle.
  const view = (VALID_VIEWS as readonly string[]).includes(sp.vue ?? "") ? (sp.vue as (typeof VALID_VIEWS)[number]) : "reunions";
  const query = (sp.q ?? "").slice(0, 100);
  const year = /^\d{4}$/.test(sp.annee ?? "") ? (sp.annee as string) : "";
  const kind = isMeetingKind(sp.type) ? sp.type : "";

  const rows = await prisma.meeting.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { items: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });

  const meetings: MeetingRow[] = rows.map((m) => ({
    id: m.id,
    date: m.date,
    title: m.title,
    kind: m.kind,
    attendees: parseAttendees(m.attendees),
    location: m.location,
    summary: m.summary,
    author: m.author,
    items: m.items.map((i) => ({
      id: i.id,
      type: i.type,
      content: i.content,
      owner: i.owner,
      dueDate: i.dueDate,
      status: i.status,
      doneAt: i.doneAt,
    })),
  }));

  // Jour de Paris : le runtime tourne en UTC, un retard se calculerait sinon
  // avec un jour d'avance à partir de 22 h.
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  return (
    <ReunionsClient
      meetings={meetings}
      today={today}
      canDelete={can(asRole(session.admin.role), "delete")}
      initialView={view}
      initialQuery={query}
      initialYear={year}
      initialKind={kind}
      autoCreate={sp.nouvelle === "1"}
    />
  );
}
