import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { EFFACE } from "@/lib/rgpd";
import ClientDetail, { type ClientFull } from "./ClientDetail";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [client, vehicles, quotes] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        leads: {
          orderBy: { updatedAt: "desc" },
          include: { events: { orderBy: { createdAt: "desc" } } },
        },
      },
    }),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true },
    }),
    prisma.quote.findMany({
      where: { clientId: id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, number: true, status: true, issueDate: true },
    }),
  ]);
  if (!client) notFound();

  const full: ClientFull = {
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    leads: client.leads.map((l) => ({
      id: l.id,
      title: l.title,
      stage: l.stage,
      source: l.source,
      vehicleId: l.vehicleId,
      budget: l.budget,
      updatedAt: l.updatedAt.toISOString(),
      events: l.events.map((e) => ({
        id: e.id,
        type: e.type,
        content: e.content,
        author: e.author,
        createdAt: e.createdAt.toISOString(),
      })),
    })),
  };

  // Les deux verdicts sont rendus ici, côté serveur, plutôt que devinés à l'écran :
  // « effacée » se lisait jusqu'ici en comparant le nom à une chaîne recopiée à la
  // main, et les actions destructrices s'affichaient à des comptes que les routes
  // refusent ensuite (le message parlait alors de panne, pas de permission).
  return (
    <ClientDetail
      client={full}
      vehicles={vehicles}
      quotes={quotes}
      efface={client.name === EFFACE}
      canDelete={can(asRole(session.admin.role), "delete")}
    />
  );
}
