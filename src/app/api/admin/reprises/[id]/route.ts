import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { formatEuroCents } from "@/lib/comptes";
import {
  isRepriseStatus, isRefusalReason, REPRISE_STATUS_LABEL, REPRISE_CLOSED_STATUSES,
} from "@/lib/reprises";
import { repriseFromBody } from "@/lib/reprise-serialize";

/**
 * Modifie une estimation. Le corps porte tous les champs métier : la fiche
 * enregistre d'un bloc, comme celle des dossiers d'immatriculation.
 *
 * Deux gestes écrivent une trace au journal, parce qu'ils se relisent des mois
 * plus tard : la révision du prix proposé et le changement de statut.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = repriseFromBody(body);

    const avant = await prisma.reprise.findUnique({
      where: { id },
      select: { offerCents: true, status: true, decidedOn: true },
    });
    if (!avant) return NextResponse.json({ error: "Estimation introuvable." }, { status: 404 });

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    const jour = parisDay(new Date()).toISOString().slice(0, 10);

    const data: Record<string, unknown> = { ...input };
    const traces: { type: string; content: string; author: string }[] = [];

    if (avant.offerCents !== input.offerCents) {
      // Une première mise à prix se raconte comme telle : « 0 € → 6 800 € »
      // laissait croire à une révision là où rien n'avait encore été proposé.
      traces.push({
        type: "revision",
        content: avant.offerCents === 0
          ? `Offre posée : ${formatEuroCents(input.offerCents)}`
          : `Offre revue : ${formatEuroCents(avant.offerCents)} → ${formatEuroCents(input.offerCents)}`,
        author,
      });
    }

    if (isRepriseStatus(body.status) && body.status !== avant.status) {
      data.status = body.status;
      // Un statut qui referme l'estimation pose le jour de décision et éteint
      // le rappel : une offre conclue cesse d'appeler une relance. Un retour en
      // arrière efface le motif de refus, qui aurait survécu à sa raison d'être.
      if (REPRISE_CLOSED_STATUSES.includes(body.status)) {
        data.decidedOn = avant.decidedOn || jour;
        data.nextActionAt = "";
        data.nextActionLabel = "";
      } else {
        data.decidedOn = "";
        data.refusalReason = "";
      }
      traces.push({ type: "statut", content: `Statut : ${REPRISE_STATUS_LABEL[body.status]}`, author });
    }

    // Le motif s'applique sur un refus seulement, et se vide partout ailleurs.
    const statutFinal = isRepriseStatus(data.status) ? data.status : avant.status;
    data.refusalReason = statutFinal === "refusee" && isRefusalReason(body.refusalReason) ? body.refusalReason : "";

    const reprise = await prisma.reprise.update({
      where: { id },
      data: { ...data, ...(traces.length > 0 ? { events: { create: traces } } : {}) },
    });
    return NextResponse.json({ id: reprise.id, reference: reprise.reference });
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
    // Une estimation passée au stock porte le prix d'achat de la fiche
    // véhicule : la retirer laisserait une marge de stock sans origine.
    const existante = await prisma.reprise.findUnique({ where: { id }, select: { stockedOn: true, vehicleId: true } });
    if (existante?.stockedOn || existante?.vehicleId) {
      return NextResponse.json(
        { error: "Cette estimation est passée au stock, elle reste attachée à la fiche véhicule." },
        { status: 409 },
      );
    }
    await prisma.reprise.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
