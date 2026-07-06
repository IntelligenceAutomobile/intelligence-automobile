import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
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
    return NextResponse.json(vehicle);
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
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
