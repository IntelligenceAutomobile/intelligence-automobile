import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole, isRole } from "@/lib/roles";

// Gestion des utilisateurs (réservée à la capacité "users" = patron).
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "users")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "users")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = isRole(body.role) ? body.role : "vendeur";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Mot de passe : 6 caractères minimum." }, { status: 400 });

    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà." }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.adminUser.create({ data: { email, passwordHash, role } });
    return NextResponse.json({ id: user.id, email: user.email, role: user.role });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  }
}
