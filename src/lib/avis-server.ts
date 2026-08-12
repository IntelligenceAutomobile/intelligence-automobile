// Éligibilité à la demande d'avis, côté base.
//
// Partagée par l'écran /admin/avis et par la route d'envoi : la page affichée
// peut dater (un second onglet, une invitation partie entre-temps), donc le
// clic revérifie exactement ce que la liste avait calculé, comme le fait déjà
// le centre de relances.
import { prisma } from "./prisma";
import { meilleurAchat, MOTIF_LIVRAISON_FAITE, type AchatRef } from "./avis";
import { parisDay } from "./vehicules";

/**
 * L'opération la plus solide de chaque client ayant acheté.
 *
 * Trois portes, par ordre de fiabilité : une livraison inscrite au planning,
 * une facture réglée, une affaire passée en « gagné ». Restreindre la recherche
 * à quelques clients sert la revérification au clic.
 */
export async function achatsParClient(clientIds?: string[]): Promise<Map<string, AchatRef>> {
  const cible = clientIds?.length ? { in: clientIds } : undefined;

  const [livraisons, facturesPayees, leadsGagnes, reprises] = await Promise.all([
    prisma.appointment.findMany({
      where: { type: "livraison", clientId: cible ?? { not: null } },
      select: { clientId: true, date: true, vehicleId: true },
    }),
    prisma.quote.findMany({
      where: { docType: "facture", paymentStatus: "payee", clientId: cible ?? { not: null } },
      select: { clientId: true, number: true, paidDate: true, issueDate: true, vehicleId: true },
    }),
    prisma.lead.findMany({
      where: cible ? { stage: "gagne", clientId: cible } : { stage: "gagne" },
      select: { clientId: true, closedAt: true, updatedAt: true, vehicleId: true },
    }),
    // Une reprise acceptée puis payée est une opération menée à bien : le
    // vendeur est un client satisfait, et cette source d'avis restait
    // inexploitée. Le motif affiché laisse adapter le geste.
    prisma.reprise.findMany({
      where: { status: { in: ["acceptee", "au_stock"] }, clientId: cible ?? { not: null } },
      select: { clientId: true, make: true, model: true, stockedOn: true, updatedAt: true },
    }),
  ]);

  // Nom du véhicule : il s'affiche sur la ligne et se retrouve dans le message.
  const vehicleIds = new Set<string>();
  for (const a of livraisons) if (a.vehicleId) vehicleIds.add(a.vehicleId);
  for (const f of facturesPayees) if (f.vehicleId) vehicleIds.add(f.vehicleId);
  for (const l of leadsGagnes) if (l.vehicleId) vehicleIds.add(l.vehicleId);

  const vehicles = vehicleIds.size
    ? await prisma.vehicle.findMany({
        where: { id: { in: [...vehicleIds] } },
        select: { id: true, make: true, model: true },
      })
    : [];
  const nomVehicule = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`.trim()]));
  const nomDe = (id: string | null) => (id ? nomVehicule.get(id) ?? "" : "");

  const achats = new Map<string, AchatRef>();
  const retiens = (clientId: string, achat: AchatRef) => {
    achats.set(clientId, meilleurAchat(achats.get(clientId), achat));
  };

  for (const a of livraisons) {
    if (!a.clientId) continue;
    // Le motif reste court : la ligne affiche déjà le véhicule à côté, et le
    // répéter donnait « Volkswagen Golf 8 GTI · Volkswagen Golf 8 GTI livrée ».
    retiens(a.clientId, {
      kind: "livraison",
      reason: MOTIF_LIVRAISON_FAITE,
      date: a.date,
      vehicle: nomDe(a.vehicleId),
    });
  }
  for (const f of facturesPayees) {
    if (!f.clientId) continue;
    retiens(f.clientId, {
      kind: "facture",
      reason: `Facture ${f.number} réglée`,
      date: f.paidDate || f.issueDate,
      vehicle: nomDe(f.vehicleId),
    });
  }
  for (const r of reprises) {
    if (!r.clientId) continue;
    retiens(r.clientId, {
      kind: "facture",
      reason: "Reprise conclue",
      date: r.stockedOn || parisDay(r.updatedAt).toISOString().slice(0, 10),
      vehicle: `${r.make} ${r.model}`.trim(),
    });
  }
  for (const l of leadsGagnes) {
    if (!l.clientId) continue;
    // closedAt est posé au passage en gagné. Les affaires conclues avant ce
    // champ retombent sur la dernière retouche de la fiche.
    retiens(l.clientId, {
      kind: "vente",
      reason: "Vente conclue",
      date: l.closedAt || parisDay(l.updatedAt).toISOString().slice(0, 10),
      vehicle: nomDe(l.vehicleId),
    });
  }

  return achats;
}
