import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { markVehicleSold } from "@/lib/devis-effets";

// Marque une facture payée / impayée.
// Solder une créance touche aux comptes : réservé aux rôles qui y ont accès.
// Sans ce contrôle, un vendeur pouvait faire disparaître un impayé du suivi.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "finances")) {
    return NextResponse.json({ error: "Le suivi des paiements est réservé au patron et au gestionnaire." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const paid = body.paid === true;
    const facture = await prisma.quote.update({
      where: { id },
      data: {
        paymentStatus: paid ? "payee" : "impayee",
        paidDate: paid ? new Date().toISOString().slice(0, 10) : "",
      },
    });
    if (paid) await markVehicleSold(facture.vehicleId);

    return NextResponse.json({ paymentStatus: facture.paymentStatus, paidDate: facture.paidDate });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
