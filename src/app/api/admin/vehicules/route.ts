import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const vehicle = await prisma.vehicle.create({
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
        status: body.status ?? "disponible",
      },
    });
    return NextResponse.json(vehicle);
  } catch {
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}
