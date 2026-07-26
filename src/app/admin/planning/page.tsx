import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mondayOf, weekDays, toDateKey } from "@/lib/planning";
import PlanningClient, { type ApptRow } from "./PlanningClient";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { semaine } = await searchParams;
  const ref = semaine && /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? new Date(`${semaine}T00:00:00`) : new Date();
  const monday = mondayOf(ref);
  const days = weekDays(monday);

  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const cookieStore = await cookies();
  const collabName = cookieStore.get("ia_collab_name")?.value?.trim() || "";

  const [appointments, clients, vehicles] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: days[0].key, lte: days[days.length - 1].key } },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true } }),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true },
    }),
  ]);

  const rows: ApptRow[] = appointments.map((a) => ({
    id: a.id,
    date: a.date,
    startMin: a.startMin,
    durationMin: a.durationMin,
    type: a.type,
    title: a.title,
    person: a.person,
    author: a.author,
    clientId: a.clientId,
    vehicleId: a.vehicleId,
    notes: a.notes,
  }));

  return (
    <PlanningClient
      appointments={rows}
      clients={clients}
      vehicles={vehicles}
      weekKeys={days.map((d) => d.key)}
      mondayKey={days[0].key}
      prevWeek={toDateKey(prevMonday)}
      nextWeek={toDateKey(nextMonday)}
      todayKey={toDateKey(new Date())}
      defaultPerson={collabName}
    />
  );
}
