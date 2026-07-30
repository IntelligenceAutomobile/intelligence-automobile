import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import {
  STAGE_LABEL, LOST_REASON_LABEL, CLOSED_STAGES,
  isStage, isSource, isLostReason, isDay, type Stage, type LostReason,
} from "@/lib/crm";

// Mise à jour d'un lead ; un changement d'étape est journalisé dans la timeline.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.vehicleId === "string" || body.vehicleId === null) data.vehicleId = body.vehicleId || null;
    if (typeof body.budget === "number" || body.budget === null) {
      data.budget = typeof body.budget === "number" && body.budget > 0 ? Math.round(body.budget) : null;
    }
    // L'origine se corrigeait nulle part : un lead entré au téléphone puis saisi
    // à la main gardait « Saisie manuelle » pour toujours.
    if (isSource(body.source)) data.source = body.source;

    // Prochaine action. Une chaîne vide efface le rappel, ce qui est un geste
    // volontaire : « c'est fait, rien de prévu ensuite ».
    if (isDay(body.nextActionAt) || body.nextActionAt === "") data.nextActionAt = body.nextActionAt;
    if (typeof body.nextActionLabel === "string") data.nextActionLabel = body.nextActionLabel.trim().slice(0, 80);

    const nouvelleEtape = isStage(body.stage) && body.stage !== existing.stage ? body.stage : null;
    if (nouvelleEtape) {
      data.stage = nouvelleEtape;
      const ferme = CLOSED_STAGES.includes(nouvelleEtape);
      // Le jour de clôture se pose ici et nulle part ailleurs : c'est lui qui
      // rend mesurable un délai de vente et un compteur « sur 30 jours ».
      data.closedAt = ferme ? parisDay(new Date()).toISOString().slice(0, 10) : "";
      // Une affaire remise au pipeline repart sans motif de perte ni clôture.
      if (!ferme) data.lostReason = "";
      // Elle n'a plus non plus de rappel en attente une fois conclue.
      if (ferme) {
        data.nextActionAt = "";
        data.nextActionLabel = "";
      }
    }
    // Le motif accompagne une perte, jamais autre chose.
    if (isLostReason(body.lostReason)) {
      const etapeFinale = (nouvelleEtape ?? existing.stage) as Stage;
      if (etapeFinale === "perdu") data.lostReason = body.lostReason;
    }

    const lead = await prisma.lead.update({ where: { id }, data });

    if (nouvelleEtape) {
      const collab = await getCollabSession();
      const motif = isLostReason(lead.lostReason) ? ` (${LOST_REASON_LABEL[lead.lostReason as LostReason]})` : "";
      await prisma.leadEvent.create({
        data: {
          leadId: id,
          type: "etape",
          content: `${STAGE_LABEL[existing.stage as Stage] ?? existing.stage} → ${STAGE_LABEL[lead.stage as Stage] ?? lead.stage}${motif}`,
          author: collab?.name ?? "",
        },
      });
    }

    await toucherClient(lead.clientId);
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  // Supprimer un lead emporte tout son journal d'interactions, en cascade et sans
  // retour : même droit que la suppression d'un client ou d'un effacement RGPD.
  if (!can(asRole(session.admin.role), "delete")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}

// Toute écriture commerciale remonte la fiche client dans le carnet. Sans cela
// le tri se faisait sur la date de retouche des coordonnées, donc un client
// dont on venait de noter un appel restait tout en bas de la liste.
async function toucherClient(clientId: string) {
  try {
    await prisma.client.update({ where: { id: clientId }, data: { lastActivityAt: new Date() } });
  } catch {
    /* le suivi d'activité ne doit jamais faire échouer l'écriture principale */
  }
}
