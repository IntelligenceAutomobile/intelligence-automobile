import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { seedShowroom } from "@/lib/showroom-seed";

// Réinitialisation des données de démonstration. Garde-fou absolu : ne
// s'exécute QUE sur l'instance showroom (SHOWROOM=1, base demo.db locale) —
// jamais sur l'instance réelle.
export async function POST() {
  if (process.env.SHOWROOM !== "1") {
    return NextResponse.json({ error: "Disponible uniquement sur l'instance de démonstration." }, { status: 403 });
  }
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    await seedShowroom(prisma);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la réinitialisation." }, { status: 500 });
  }
}
