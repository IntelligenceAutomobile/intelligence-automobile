import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvisClient, { type AvisRow } from "./AvisClient";

export default async function AvisPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [theme, wonLeads, paidFactures] = await Promise.all([
    prisma.brandTheme.findUnique({ where: { id: "default" }, select: { reviewLink: true } }),
    prisma.lead.findMany({ where: { stage: "gagne" }, select: { clientId: true } }),
    prisma.quote.findMany({ where: { docType: "facture", paymentStatus: "payee", clientId: { not: null } }, select: { clientId: true } }),
  ]);

  // Clients ayant acheté = lead gagné OU facture payée.
  const eligibleIds = new Set<string>();
  for (const l of wonLeads) if (l.clientId) eligibleIds.add(l.clientId);
  for (const f of paidFactures) if (f.clientId) eligibleIds.add(f.clientId);

  const clients = eligibleIds.size
    ? await prisma.client.findMany({
        where: { id: { in: [...eligibleIds] } },
        select: { id: true, name: true, company: true, email: true, reviewRequestedAt: true },
      })
    : [];

  const rows: AvisRow[] = clients.map((c) => ({
    id: c.id,
    name: c.company || c.name,
    email: c.email,
    requestedAt: c.reviewRequestedAt,
  }));

  const toSolicit = rows.filter((r) => !r.requestedAt);
  const done = rows.filter((r) => r.requestedAt);

  return <AvisClient toSolicit={toSolicit} done={done} reviewLinkSet={Boolean(theme?.reviewLink)} />;
}
