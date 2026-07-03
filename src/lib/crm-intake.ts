// Admission CRM : crée client + lead depuis les formulaires publics du site.
// Appelé en plus de l'email : ne doit JAMAIS faire échouer l'envoi (les
// appelants enveloppent dans un try/catch).
import { prisma } from "./prisma";
import type { Source } from "./crm";

export async function createLeadFromSite(input: {
  name: string;
  email?: string;
  phone?: string;
  source: Source;
  title: string;
  message?: string;
}) {
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";

  // Rattache au client existant par email, sinon crée la fiche.
  let client = email ? await prisma.client.findFirst({ where: { email } }) : null;
  if (!client) {
    client = await prisma.client.create({
      data: { name: input.name.trim() || "Prospect site", email, phone },
    });
  } else if (phone && !client.phone) {
    client = await prisma.client.update({ where: { id: client.id }, data: { phone } });
  }

  await prisma.lead.create({
    data: {
      clientId: client.id,
      stage: "nouveau",
      source: input.source,
      title: input.title.slice(0, 120),
      events: {
        create: {
          type: "creation",
          content: (input.message ?? "").trim().slice(0, 2000) || "Lead entrant du site",
          author: "Site web",
        },
      },
    },
  });
}
