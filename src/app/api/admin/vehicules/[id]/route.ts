import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { isVehicleStatus } from "@/lib/vehicules";
import { normalizeSaleRegime } from "@/lib/sale-regime";
import { effacerAnnonces, quitteLaVitrine, recapRetrait, retirerDesPortails } from "@/lib/diffusion-server";

// Écriture partielle : seules les clés présentes dans le corps sont écrites.
// Le PUT voisin réécrit la fiche entière et ne sait donc pas changer un seul
// champ depuis la liste : lui envoyer { status } faisait échouer la requête.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!isVehicleStatus(body.status)) return NextResponse.json({ error: "Statut inconnu." }, { status: 400 });
      data.status = body.status;
    }
    if (body.saleRegime !== undefined) data.saleRegime = normalizeSaleRegime(body.saleRegime);
    if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);
    if (body.price !== undefined) {
      const price = Math.round(Number(body.price));
      if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
      data.price = price;
    }
    if (body.mileage !== undefined) {
      const mileage = Math.round(Number(body.mileage));
      if (!Number.isFinite(mileage) || mileage < 0) return NextResponse.json({ error: "Kilométrage invalide." }, { status: 400 });
      data.mileage = mileage;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune modification." }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data });

    // Vendu ou masqué : les annonces passent au repos du même geste. Sans cela,
    // la voiture quittait l'écran de diffusion en y laissant quatre portails
    // verts, hors d'atteinte de l'interface.
    const retirees = quitteLaVitrine(
      data.status as string | undefined,
      data.isPublished as boolean | undefined,
    )
      ? await retirerDesPortails(id)
      : 0;

    return NextResponse.json({ ...vehicle, retirees, retraitMessage: recapRetrait(retirees) });
  } catch {
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    // Le PUT écrivait n'importe quelle chaîne de statut : la liste affichait
    // alors une valeur brute sans couleur ni libellé.
    if (body.status !== undefined && !isVehicleStatus(body.status)) {
      return NextResponse.json({ error: "Statut inconnu." }, { status: 400 });
    }
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        make: body.make,
        model: body.model,
        year: parseInt(body.year),
        mileage: parseInt(body.mileage),
        price: parseInt(body.price),
        color: body.color,
        transmission: body.transmission,
        fuel: body.fuel,
        power: body.power ? parseInt(body.power) : null,
        origin: body.origin,
        // Absent du corps : la valeur en place est conservée.
        saleRegime: body.saleRegime !== undefined ? normalizeSaleRegime(body.saleRegime) : undefined,
        description: body.description ?? "",
        features: JSON.stringify(body.features ?? []),
        images: JSON.stringify(body.images ?? []),
        conditionFacts: JSON.stringify(body.conditionFacts ?? []),
        maintenanceHistory: JSON.stringify(body.maintenanceHistory ?? []),
        maintenanceHighlights: JSON.stringify(body.maintenanceHighlights ?? []),
        documents: JSON.stringify(body.documents ?? []),
        status: body.status,
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
      },
    });

    const retirees = quitteLaVitrine(
      body.status,
      body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
    )
      ? await retirerDesPortails(id)
      : 0;

    return NextResponse.json({ ...vehicle, retirees, retraitMessage: recapRetrait(retirees) });
  } catch {
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "delete")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    // Les annonces partent avant la fiche : la table vit sans lien de parenté
    // déclaré, donc sans effacement en cascade.
    await effacerAnnonces(id);
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
