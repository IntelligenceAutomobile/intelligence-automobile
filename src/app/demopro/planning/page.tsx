// Planning atelier de la démonstration /demopro.
// Vue semaine (lun→sam, 8h→19h) en LECTURE SEULE, alimentée par des données
// d'exemple figées (src/lib/demo-data.ts). Aucun accès base, aucun fetch : la
// résolution client/véhicule se fait ici, côté serveur, sur des données pures.
import { mondayOf, weekDays, toDateKey } from "@/lib/planning";
import { getDemoAppointments, getDemoClient, getDemoVehicle } from "@/lib/demo-data";
import PlanningBoard, { type DemoApptRow } from "./PlanningBoard";

export default function DemoPlanningPage() {
  const monday = mondayOf(new Date());
  const days = weekDays(monday);
  const weekKeys = days.map((d) => d.key);
  const todayKey = toDateKey(new Date());
  const weekLabel = monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const rows: DemoApptRow[] = getDemoAppointments()
    .filter((a) => weekKeys.includes(a.date))
    .map((a) => {
      const client = a.clientId ? getDemoClient(a.clientId) : undefined;
      const vehicle = a.vehicleId ? getDemoVehicle(a.vehicleId) : undefined;
      return {
        id: a.id,
        date: a.date,
        startMin: a.startMin,
        durationMin: a.durationMin,
        type: a.type,
        title: a.title,
        person: a.person,
        clientLabel: client ? client.company || client.name : null,
        vehicleLabel: vehicle ? `${vehicle.make} ${vehicle.model}` : null,
        vehicleYear: vehicle ? vehicle.year : null,
      };
    });

  return <PlanningBoard rows={rows} weekKeys={weekKeys} todayKey={todayKey} weekLabel={weekLabel} />;
}
