"use client";

// Planning atelier de la démonstration /demopro.
//
// Rend le MÊME composant que le back-office, entièrement manipulable : créer un
// rendez-vous, le glisser d'un jour à l'autre, changer sa durée, le supprimer.
// Les écritures vont dans le bac à sable du visiteur, jamais en base.
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { mondayOf, weekDays, toDateKey } from "@/lib/planning";
import PlanningClient, { type ApptRow, type ApptWriter } from "@/app/admin/planning/PlanningClient";
import { useDemoStore, demoId } from "../store";
import { DEMO_BASE } from "../demo";

export default function DemoPlanningPage() {
  const params = useSearchParams();
  const { appointments, clients, vehicles, actions } = useDemoStore();

  const semaine = params.get("semaine");
  const ref = semaine && /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? new Date(`${semaine}T00:00:00`) : new Date();
  const monday = mondayOf(ref);
  const days = weekDays(monday);

  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const weekKeys = days.map((d) => d.key);

  // Quelques rendez-vous par semaine : la conversion se refait à chaque rendu,
  // le compilateur React s'occupe lui-même de la mise en cache.
  const rows: ApptRow[] = appointments
    .filter((a) => weekKeys.includes(a.date))
    .map((a) => ({
      id: a.id,
      date: a.date,
      startMin: a.startMin,
      durationMin: a.durationMin,
      type: a.type,
      title: a.title,
      person: a.person ?? "",
      author: a.person ?? "",
      clientId: a.clientId ?? null,
      vehicleId: a.vehicleId ?? null,
      notes: "",
    }));

  // Carnet d'écriture du bac à sable : même contrat que l'API, sans réseau.
  const writer: ApptWriter = useMemo(() => ({
    create: async (payload) => {
      const p = payload as Partial<ApptRow>;
      const row: ApptRow = {
        id: (p.id as string) || demoId("rdv"),
        date: p.date ?? toDateKey(new Date()),
        startMin: p.startMin ?? 9 * 60,
        durationMin: p.durationMin ?? 60,
        type: p.type ?? "essai",
        title: p.title ?? "",
        person: p.person ?? "",
        author: p.author || p.person || "Compte démo",
        clientId: p.clientId ?? null,
        vehicleId: p.vehicleId ?? null,
        notes: p.notes ?? "",
      };
      actions.addAppointment({
        id: row.id,
        date: row.date,
        startMin: row.startMin,
        durationMin: row.durationMin,
        type: row.type,
        title: row.title,
        person: row.person || row.author,
        clientId: row.clientId,
        vehicleId: row.vehicleId,
      });
      return row;
    },
    update: async (id, delta) => {
      actions.updateAppointment(id, delta as Record<string, never>);
    },
    remove: async (id) => {
      actions.removeAppointment(id);
    },
  }), [actions]);

  return (
    <PlanningClient
      key={weekKeys[0]}
      appointments={rows}
      clients={clients.map((c) => ({ id: c.id, name: c.name, company: c.company }))}
      vehicles={vehicles.map((v) => ({ id: v.id, make: v.make, model: v.model, year: v.year }))}
      weekKeys={weekKeys}
      mondayKey={weekKeys[0]}
      prevWeek={toDateKey(prevMonday)}
      nextWeek={toDateKey(nextMonday)}
      todayKey={toDateKey(new Date())}
      defaultPerson="Compte démo"
      writer={writer}
      base={`${DEMO_BASE}/planning`}
    />
  );
}
