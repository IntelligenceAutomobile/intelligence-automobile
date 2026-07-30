// Effets de bord d'un changement d'état de devis ou de facture.
// Le devis cessait d'être relié au reste : une voiture promise restait
// « disponible » et publiée sur le site, et le pipeline commercial du CRM
// n'apprenait jamais qu'un devis était parti ou signé.
import { prisma } from "./prisma";

type QuoteLike = {
  id: string;
  number: string;
  status: string;
  docType: string;
  clientId: string | null;
  vehicleId: string | null;
  leadId?: string | null;
};

// Un devis accepté réserve la voiture et la retire du site : sans cela, la même
// voiture pouvait être promise à un second client le lendemain.
export async function reserveVehicleForQuote(quote: QuoteLike): Promise<void> {
  if (!quote.vehicleId) return;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: quote.vehicleId },
      select: { id: true, status: true },
    });
    // Une voiture déjà vendue garde son statut : un devis accepté ne le dégrade pas.
    if (!vehicle || vehicle.status === "vendu") return;
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: "reserve", isPublished: false },
    });
  } catch {
    /* le devis reste enregistré même si la fiche véhicule résiste */
  }
}

// Une facture réglée solde la vente : la voiture passe vendue.
export async function markVehicleSold(vehicleId: string | null): Promise<void> {
  if (!vehicleId) return;
  try {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "vendu", isPublished: false },
    });
  } catch {
    /* idem : le paiement prime sur la mise à jour du stock */
  }
}

// Le pipeline suit le devis : envoyé le fait avancer, accepté le fait gagner.
// La frise de la fiche client existait et restait vide, faute d'appel.
export async function syncLeadForQuote(quote: QuoteLike, author: string): Promise<void> {
  if (!quote.clientId) return;
  const stage = quote.status === "accepte" ? "gagne" : quote.status === "envoye" ? "devis_envoye" : null;
  if (!stage) return;

  try {
    // Le devis désigne son opportunité quand le lien existe. À défaut, on
    // retombe sur « la dernière opportunité ouverte touchée », qui se trompe
    // chez un client suivant deux dossiers en même temps.
    const lead = quote.leadId
      ? await prisma.lead.findUnique({ where: { id: quote.leadId }, select: { id: true, stage: true } })
      : await prisma.lead.findFirst({
          where: { clientId: quote.clientId, stage: { notIn: ["gagne", "perdu"] } },
          orderBy: { updatedAt: "desc" },
          select: { id: true, stage: true },
        });
    if (!lead || lead.stage === stage) return;

    await prisma.lead.update({
      where: { id: lead.id },
      // Un devis accepté conclut l'affaire : elle mérite son jour de clôture,
      // comme si le geste avait été fait à la main depuis le pipeline.
      data: stage === "gagne"
        ? { stage, closedAt: new Date().toISOString().slice(0, 10), nextActionAt: "", nextActionLabel: "" }
        : { stage },
    });
    await prisma.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "etape",
        content: stage === "gagne" ? `Devis ${quote.number} accepté.` : `Devis ${quote.number} envoyé.`,
        author,
      },
    });
  } catch {
    /* le suivi commercial ne doit jamais bloquer l'enregistrement du devis */
  }
}
