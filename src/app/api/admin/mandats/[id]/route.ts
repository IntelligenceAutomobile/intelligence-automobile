import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { formatEuroCents } from "@/lib/comptes";
import {
  isMandatStatus, MANDAT_STATUS_LABEL, MANDAT_CLOSED_STATUSES, lireDocuments,
} from "@/lib/mandats";
import { mandatChangesFromBody } from "@/lib/mandat-serialize";

/**
 * Modifie un mandat, champ par champ envoyé. La fiche enregistre d'un bloc et
 * passe tout ; un dépôt de pièce envoie le seul champ documents.
 *
 * Trois gestes écrivent une trace au journal, parce qu'ils se relisent des
 * mois plus tard : le changement de statut, la signature et les pièces
 * versées au dossier. C'est le début de la reddition de comptes.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = mandatChangesFromBody(body);

    const avant = await prisma.mandat.findUnique({
      where: { id },
      select: { type: true, status: true, signedOn: true, startDate: true, decidedOn: true, soldOn: true, vehicleId: true, documents: true },
    });
    if (!avant) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    const jour = parisDay(new Date()).toISOString().slice(0, 10);

    const data: Record<string, unknown> = { ...input };
    const traces: { type: string; content: string; author: string }[] = [];

    // Une pièce versée au dossier se raconte : le journal dit quand le mandat
    // signé, la carte grise ou le contrôle technique sont arrivés.
    if (input.documents !== undefined) {
      const anciennes = new Set(lireDocuments(avant.documents).map((d) => d.url));
      const ajoutees = lireDocuments(String(input.documents)).filter((d) => !anciennes.has(d.url));
      for (const d of ajoutees) {
        traces.push({ type: "document", content: `Pièce versée au dossier : ${d.label}`, author });
      }
    }

    let regimePose = false;
    if (isMandatStatus(body.status) && body.status !== avant.status) {
      data.status = body.status;

      if (body.status === "signe") {
        // La signature date le contrat : le jour signé prime, le jour de
        // Paris sert de repli. La date d'effet suit si elle manquait.
        const signeLe = (typeof input.signedOn === "string" && input.signedOn) || avant.signedOn || jour;
        data.signedOn = signeLe;
        if (!avant.startDate && !input.startDate) data.startDate = signeLe;
        traces.push({ type: "statut", content: `Mandat signé (effet au ${signeLe})`, author });
        // Seule la VENTE verrouille le régime de la fiche véhicule : une
        // recherche rattachée à une fiche de stock laisse le stock tranquille.
        regimePose = avant.type === "vente" && avant.vehicleId !== null;
      } else {
        traces.push({ type: "statut", content: `Statut : ${MANDAT_STATUS_LABEL[body.status]}`, author });
      }

      // Un statut qui referme le mandat pose le jour de décision ; un retour
      // en arrière l'efface, il aurait survécu à sa raison d'être.
      if (MANDAT_CLOSED_STATUSES.includes(body.status)) {
        data.decidedOn = avant.decidedOn || jour;
        if (body.status === "vendu" && !avant.soldOn && !input.soldOn) data.soldOn = jour;
      } else {
        data.decidedOn = "";
      }
    }

    if (typeof input.soldPriceCents === "number" && input.soldPriceCents > 0 && "status" in body && body.status === "vendu") {
      traces.push({ type: "statut", content: `Vente conclue à ${formatEuroCents(input.soldPriceCents)}`, author });
    }

    const mandat = await prisma.mandat.update({
      where: { id },
      data: { ...data, ...(traces.length > 0 ? { events: { create: traces } } : {}) },
    });

    // Un mandat de vente signé sur un véhicule du stock verrouille son régime :
    // la mention « vente réalisée pour le compte d'un particulier » suit alors
    // la fiche publique et les annonces diffusées, comme la loi le demande.
    if (regimePose && avant.vehicleId) {
      const touche = await prisma.vehicle.updateMany({
        where: { id: avant.vehicleId, saleRegime: { not: "mandat-client" } },
        data: { saleRegime: "mandat-client" },
      });
      if (touche.count > 0) {
        await prisma.mandatEvent.create({
          data: { mandatId: id, type: "statut", content: "Fiche véhicule passée en régime « Mandat client »", author },
        });
      }
    }

    return NextResponse.json({ id: mandat.id, reference: mandat.reference });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "delete")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    // Un contrat signé se conserve, la loi et le fisc le relisent des années
    // plus tard : seul un brouillon se supprime.
    const existant = await prisma.mandat.findUnique({ where: { id }, select: { status: true } });
    if (!existant) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });
    if (existant.status !== "brouillon") {
      return NextResponse.json(
        { error: "Ce mandat a été signé : il se clôt (retiré, échu, rétracté) et reste archivé." },
        { status: 409 },
      );
    }
    await prisma.mandat.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
