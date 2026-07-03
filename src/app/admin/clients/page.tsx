import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClientsClient, { type ClientRow } from "./ClientsClient";

export default async function ClientsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [clients, vehicles] = await Promise.all([
    prisma.client.findMany({
      orderBy: { updatedAt: "desc" },
      include: { leads: { orderBy: { updatedAt: "desc" } } },
    }),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true },
    }),
  ]);

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    updatedAt: c.updatedAt.toISOString(),
    leads: c.leads.map((l) => ({
      id: l.id,
      title: l.title,
      stage: l.stage,
      source: l.source,
      vehicleId: l.vehicleId,
      budget: l.budget,
      updatedAt: l.updatedAt.toISOString(),
    })),
  }));

  return <ClientsClient clients={rows} vehicles={vehicles} />;
}
