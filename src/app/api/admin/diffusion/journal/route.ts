import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Journal de diffusion d'un véhicule : les derniers gestes, du plus récent au
// plus ancien. Le panneau de l'écran le charge à l'ouverture, pour garder la
// page elle-même légère.
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const vehicleId = req.nextUrl.searchParams.get("vehicleId") ?? "";
  if (!vehicleId) return NextResponse.json({ error: "Véhicule manquant." }, { status: 400 });

  const entrees = await prisma.diffusionLog.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, portal: true, action: true, detail: true, author: true, createdAt: true },
  });

  return NextResponse.json({
    entrees: entrees.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
  });
}
