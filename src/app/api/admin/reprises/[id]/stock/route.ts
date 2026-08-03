import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { parisDay } from "@/lib/vehicules";
import { formatEuroCents } from "@/lib/comptes";
import { repriseIssues, repriseLabel } from "@/lib/reprises";

/**
 * Fait entrer une reprise acceptée dans le parc.
 *
 * Quatre écritures liées : la fiche véhicule, ses deux lignes de frais, et
 * l'estimation qui mémorise ce qu'elle est devenue. Elles voyagent dans une
 * transaction en forme de fonction, les frais ayant besoin de l'identifiant du
 * véhicule. Un échec en cours laisse la situation d'avant, plutôt qu'une fiche
 * véhicule orpheline sans prix d'achat.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const r = await prisma.reprise.findUnique({ where: { id } });
    if (!r) return NextResponse.json({ error: "Estimation introuvable." }, { status: 404 });

    // Le doublon se refuse d'abord : un second clic renvoie une phrase claire
    // plutôt qu'une deuxième voiture au parc.
    if (r.vehicleId) {
      return NextResponse.json({ error: "Cette estimation a déjà sa fiche véhicule." }, { status: 409 });
    }

    const manques = repriseIssues(r);
    if (manques.length > 0) {
      return NextResponse.json(
        { error: `Complétez ${manques.join(", ")} avant le passage au stock.` },
        { status: 400 },
      );
    }

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    const jour = parisDay(new Date()).toISOString().slice(0, 10);
    const libelle = repriseLabel(r);

    const vehicle = await prisma.$transaction(async (tx) => {
      const v = await tx.vehicle.create({
        data: {
          make: r.make,
          model: [r.model, r.version].filter(Boolean).join(" ").trim(),
          year: r.year,
          mileage: r.mileageKm,
          // Le prix de départ part de la revente visée, à défaut de l'offre :
          // une fiche de parc réclame un prix, et zéro se lirait comme un don.
          price: Math.round((r.resaleCents > 0 ? r.resaleCents : r.offerCents) / 100),
          color: r.color,
          transmission: r.transmission,
          fuel: r.fuel,
          origin: "France",
          status: "disponible",
          // Posé EXPLICITEMENT : le défaut du schéma publie la fiche, et une
          // voiture tout juste reprise se retrouverait sur la page d'accueil du
          // site avant d'être photographiée et décrite.
          isPublished: false,
        },
      });

      // La catégorie « achat » est celle que la liste du stock exige pour
      // afficher une marge : sans cette ligne, la fiche resterait sans marge.
      await tx.vehicleCost.create({
        data: {
          vehicleId: v.id,
          category: "achat",
          label: `Reprise client ${r.reference}`,
          amountCents: r.offerCents,
          date: jour,
        },
      });

      if (r.reconditionCents > 0) {
        await tx.vehicleCost.create({
          data: {
            vehicleId: v.id,
            category: "preparation",
            label: "Remise en état estimée",
            amountCents: r.reconditionCents,
            date: jour,
          },
        });
      }

      await tx.reprise.update({
        where: { id },
        data: {
          vehicleId: v.id,
          status: "au_stock",
          stockedOn: jour,
          nextActionAt: "",
          nextActionLabel: "",
          events: {
            create: [{
              type: "statut",
              content: `Passée au stock · fiche véhicule créée, prix d'achat ${formatEuroCents(r.offerCents)}`,
              author,
            }],
          },
        },
      });

      // L'affaire commerciale se referme du même geste : la voiture est
      // achetée, l'opportunité est conclue.
      if (r.leadId) {
        await tx.lead.updateMany({
          where: { id: r.leadId },
          data: { stage: "gagne", closedAt: jour, nextActionAt: "", nextActionLabel: "" },
        });
      }

      return v;
    });

    return NextResponse.json({ vehicleId: vehicle.id, label: libelle });
  } catch {
    return NextResponse.json({ error: "Le passage au stock a échoué." }, { status: 500 });
  }
}
