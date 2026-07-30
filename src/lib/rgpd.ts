// Droits de la personne sur ses données : accès (art. 15), portabilité (art. 20)
// et effacement (art. 17) du RGPD.
//
// Le point délicat est l'effacement. Supprimer la fiche client ne supprimait rien
// des devis et factures, qui gardent nom, adresse, email et téléphone recopiés au
// moment de leur émission : la personne restait identifiable dans le back-office
// après avoir demandé son effacement.
//
// L'effacement total est pourtant interdit sur une facture : le Code de commerce
// impose de conserver les pièces comptables DIX ANS, et le nom et l'adresse du
// client sont des mentions obligatoires de la facture. Le RGPD prévoit
// explicitement cette réserve (art. 17.3.b : traitement nécessaire au respect
// d'une obligation légale).
//
// La règle appliquée ici, et annoncée à l'écran :
//   • fiche client, pistes commerciales, rendez-vous, garanties → effacés
//   • devis jamais facturés → anonymisés en totalité
//   • factures et avoirs → nom et adresse CONSERVÉS (mention obligatoire),
//     email et téléphone effacés, car eux ne sont exigés par aucun texte
//   • une trace de la demande reste attachée à la fiche : c'est le registre.
import { prisma } from "@/lib/prisma";

export const EFFACE = "Personne effacée";

export type EffacementBilan = {
  clientName: string;
  devisAnonymises: number;
  facturesConservees: number;
  pistesSupprimees: number;
  rendezVousLiberes: number;
  garantiesAnonymisees: number;
  dossiersAnonymises: number;
};

/** Ce que le back-office détient sur une personne, pour lui remettre ou l'effacer. */
export async function dossierPersonnel(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { leads: { include: { events: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!client) return null;

  // Les documents se retrouvent par le lien CRM, et à défaut par l'email : un
  // devis saisi à la main avant la création de la fiche n'a pas de lien.
  const email = client.email.trim();
  const ouEmail = email ? [{ clientId }, { clientEmail: email }] : [{ clientId }];

  const [quotes, appointments, warranties, registrations] = await Promise.all([
    prisma.quote.findMany({ where: { OR: ouEmail }, orderBy: { issueDate: "asc" } }),
    prisma.appointment.findMany({ where: { clientId }, orderBy: { date: "asc" } }),
    email
      ? prisma.warranty.findMany({ where: { clientEmail: email }, orderBy: { startDate: "asc" } })
      : Promise.resolve([]),
    prisma.registration.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
  ]);

  return { client, quotes, appointments, warranties, registrations };
}

/**
 * Efface les données personnelles d'un client, en conservant ce que la loi
 * comptable impose. Renvoie le détail de ce qui a été fait, pour l'afficher et
 * pour la trace.
 */
export async function effacerPersonne(clientId: string, auteur: string, jour: string): Promise<EffacementBilan | null> {
  const dossier = await dossierPersonnel(clientId);
  if (!dossier) return null;
  const { client, quotes, appointments, warranties, registrations } = dossier;

  // Un devis converti en facture reste rattaché à une pièce comptable : son
  // anonymisation complète ferait perdre le lien entre la facture et son devis.
  const facturesIds = new Set(quotes.filter((q) => q.docType !== "devis").map((q) => q.sourceQuoteId).filter(Boolean) as string[]);

  let devisAnonymises = 0;
  let facturesConservees = 0;
  for (const q of quotes) {
    const comptable = q.docType !== "devis" || facturesIds.has(q.id);
    if (comptable) {
      // Nom et adresse restent : mentions obligatoires d'une facture, conservée
      // dix ans. Les moyens de contact, eux, ne sont exigés par aucun texte.
      await prisma.quote.update({
        where: { id: q.id },
        data: { clientEmail: "", clientPhone: "", clientId: null },
      });
      facturesConservees++;
    } else {
      await prisma.quote.update({
        where: { id: q.id },
        data: {
          clientName: EFFACE,
          clientCompany: "",
          clientAddress: "",
          clientEmail: "",
          clientPhone: "",
          clientVatNumber: "",
          clientId: null,
          // Le lien public devient inutilisable : un devis anonymisé ne doit plus
          // s'ouvrir depuis un email conservé par le destinataire.
          publicToken: null,
          signerName: "",
          signedIp: "",
          notes: "",
        },
      });
      devisAnonymises++;
    }
  }

  for (const g of warranties) {
    await prisma.warranty.update({ where: { id: g.id }, data: { clientName: EFFACE, clientEmail: "", notes: "" } });
  }
  for (const r of registrations) {
    await prisma.registration.update({
      where: { id: r.id },
      data: { holderName: EFFACE, holderAddress: "", clientId: null, notes: "" },
    });
  }
  for (const a of appointments) {
    await prisma.appointment.update({ where: { id: a.id }, data: { clientId: null, person: EFFACE, notes: "" } });
  }

  // Les pistes commerciales et leur journal partent en totalité : rien n'oblige
  // à les garder. La suppression en cascade emporte les événements.
  const pistes = client.leads.length;
  await prisma.lead.deleteMany({ where: { clientId } });

  // La fiche reste, vidée : elle porte la trace de la demande et garde le lien
  // avec les factures conservées. Elle n'identifie plus personne.
  const trace = [
    `Droit à l'effacement exercé le ${jour}${auteur ? ` (traité par ${auteur})` : ""}.`,
    `Devis anonymisés : ${devisAnonymises}.`,
    `Factures et avoirs conservés au titre de l'obligation comptable de dix ans : ${facturesConservees}.`,
    "Nom et adresse maintenus sur ces pièces (mentions obligatoires), email et téléphone effacés.",
  ].join(" ");

  await prisma.client.update({
    where: { id: clientId },
    data: { name: EFFACE, company: "", email: "", phone: "", notes: trace },
  });

  return {
    clientName: client.company || client.name,
    devisAnonymises,
    facturesConservees,
    pistesSupprimees: pistes,
    rendezVousLiberes: appointments.length,
    garantiesAnonymisees: warranties.length,
    dossiersAnonymises: registrations.length,
  };
}
