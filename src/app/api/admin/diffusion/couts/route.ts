import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isPortal, moisParis } from "@/lib/diffusion";

// Coût mensuel d'un portail, saisi depuis la synthèse de l'écran de diffusion.
// Une valeur par portail et par mois : la ressaisie du même mois remplace.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const portal = body.portal;
  if (!isPortal(portal)) return NextResponse.json({ error: "Portail inconnu." }, { status: 400 });

  const montant = Math.round(Number(body.amountCents));
  if (!Number.isFinite(montant) || montant < 0 || montant > 100_000_00) {
    return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  }

  const month = moisParis(new Date());
  const cout = await prisma.portalCost.upsert({
    where: { portal_month: { portal, month } },
    create: { portal, month, amountCents: montant },
    update: { amountCents: montant },
  });

  return NextResponse.json({ portal: cout.portal, month: cout.month, amountCents: cout.amountCents });
}
