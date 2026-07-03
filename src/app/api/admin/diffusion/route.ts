import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PORTALS, isPortal } from "@/lib/diffusion";

// État de diffusion (démo) : publie/retire une annonce sur un ou tous les portails.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const listings = await prisma.listing.findMany();
  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const vehicleId = String(body.vehicleId ?? "");
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 400 });

    const action = body.action === "unpublish" ? "unpublish" : "publish";
    const portals = isPortal(body.portal) ? [body.portal] : [...PORTALS];

    for (const portal of portals) {
      await prisma.listing.upsert({
        where: { vehicleId_portal: { vehicleId, portal } },
        create: {
          vehicleId,
          portal,
          status: action === "publish" ? "publie" : "non_diffuse",
          publishedAt: action === "publish" ? new Date() : null,
        },
        update:
          action === "publish"
            ? { status: "publie", publishedAt: new Date() }
            : { status: "non_diffuse", publishedAt: null },
      });
    }

    const listings = await prisma.listing.findMany({ where: { vehicleId } });
    return NextResponse.json(listings);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
