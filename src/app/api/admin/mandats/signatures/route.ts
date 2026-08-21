import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMandats } from "@/lib/mandats-acces";
import { mandatVehiculeLabel } from "@/lib/mandats";

// Mandats signés en ligne par le vendeur, du plus récent au plus ancien.
// Interrogée en boucle par le back-office pour annoncer une signature où que
// l'on soit dans l'outil, comme les acceptations de devis.
export async function GET(req: NextRequest) {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;

  // `signedAt` est un horodatage ISO : la comparaison de chaînes suit l'ordre
  // chronologique, aucune conversion nécessaire.
  const since = (req.nextUrl.searchParams.get("since") ?? "").trim();

  const rows = await prisma.mandat.findMany({
    where: { signedAt: since ? { gt: since } : { not: "" } },
    orderBy: { signedAt: "desc" },
    take: 20,
    select: {
      id: true, reference: true, ownerName: true, signerName: true, signedAt: true,
      make: true, model: true, version: true, priceCents: true, immediateExecution: true,
    },
  });

  const signatures = rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    vehicule: mandatVehiculeLabel(r),
    ownerName: r.ownerName,
    signerName: r.signerName,
    signedAt: r.signedAt,
    priceCents: r.priceCents,
    immediateExecution: r.immediateExecution,
  }));

  return NextResponse.json({ signatures });
}
