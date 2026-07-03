import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Marque une facture payée / impayée.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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
    return NextResponse.json({ paymentStatus: facture.paymentStatus, paidDate: facture.paidDate });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
