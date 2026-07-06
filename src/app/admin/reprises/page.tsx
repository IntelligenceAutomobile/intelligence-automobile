import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReprisesClient, { type RepriseRow } from "./ReprisesClient";

export default async function ReprisesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const leads = await prisma.lead.findMany({
    where: { source: "reprise" },
    orderBy: { updatedAt: "desc" },
    include: { client: { select: { id: true, name: true, company: true } } },
  });

  const reprises: RepriseRow[] = leads.map((l) => ({
    id: l.id,
    clientId: l.clientId,
    clientName: l.client.company || l.client.name,
    title: l.title,
    stage: l.stage,
    budget: l.budget,
    updatedAt: l.updatedAt.toISOString(),
  }));

  return <ReprisesClient reprises={reprises} />;
}
