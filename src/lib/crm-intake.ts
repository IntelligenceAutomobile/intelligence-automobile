// Admission CRM : crée client + lead depuis les formulaires publics du site.
// Appelé en plus de l'email : ne doit JAMAIS faire échouer l'envoi (les
// appelants enveloppent dans un try/catch).
import { prisma } from "./prisma";
import type { Source } from "./crm";

// Une adresse se compare en minuscules : SQLite compare octet par octet, donc
// « Jean.Dupont@Gmail.com » puis « jean.dupont@gmail.com » créaient deux fiches
// pour la même personne, avec ses opportunités éclatées entre les deux.
export function normaliserEmail(v: string | undefined | null): string {
  return (v ?? "").trim().toLowerCase();
}

// Un numéro se compare sans espaces ni ponctuation, et sur ses derniers
// chiffres : « 06 12 34 56 78 », « 06.12.34.56.78 » et « +33612345678 »
// désignent le même téléphone.
export function normaliserTelephone(v: string | undefined | null): string {
  return (v ?? "").replace(/[^0-9]/g, "");
}

/** Fiche existante correspondant à ces coordonnées, par email puis téléphone. */
export async function trouverClientExistant(email: string, phone: string) {
  const mail = normaliserEmail(email);
  if (mail) {
    const parMail = await prisma.client.findFirst({ where: { email: mail } });
    if (parMail) return parMail;
  }
  const tel = normaliserTelephone(phone);
  // Les huit derniers chiffres suffisent à distinguer deux numéros français et
  // absorbent l'indicatif : +33 6 12 34 56 78 et 06 12 34 56 78 se rejoignent.
  if (tel.length >= 8) {
    const fin = tel.slice(-8);
    const candidats = await prisma.client.findMany({
      where: { phone: { not: "" } },
      select: { id: true, phone: true },
      take: 500,
    });
    const trouve = candidats.find((c) => normaliserTelephone(c.phone).endsWith(fin));
    if (trouve) return prisma.client.findUnique({ where: { id: trouve.id } });
  }
  return null;
}

export async function createLeadFromSite(input: {
  name: string;
  email?: string;
  phone?: string;
  source: Source;
  title: string;
  message?: string;
  /** Véhicule du stock à l'origine de la demande, quand elle en vise un seul. */
  vehicleId?: string;
  /** Marqueur d'origine du visiteur (?src=), tel que la mesure l'enregistre.
   *  C'est lui qui rattachera plus tard un contact au portail qui l'a amené. */
  srcMarker?: string;
}) {
  const email = normaliserEmail(input.email);
  const phone = input.phone?.trim() ?? "";

  // Rattache au client existant par email ou téléphone, sinon crée la fiche.
  let client = await trouverClientExistant(email, phone);
  if (!client) {
    client = await prisma.client.create({
      data: { name: input.name.trim() || "Prospect site", email, phone, lastActivityAt: new Date() },
    });
  } else {
    // Une fiche connue se complète de ce qui lui manquait, sans rien écraser.
    await prisma.client.update({
      where: { id: client.id },
      data: {
        phone: client.phone || phone,
        email: client.email || email,
        lastActivityAt: new Date(),
      },
    });
  }

  await prisma.lead.create({
    data: {
      clientId: client.id,
      stage: "nouveau",
      source: input.source,
      srcMarker: (input.srcMarker ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24),
      title: input.title.slice(0, 120),
      vehicleId: input.vehicleId || null,
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
