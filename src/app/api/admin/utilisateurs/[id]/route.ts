import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole, isRole } from "@/lib/roles";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "users")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: { role?: string; passwordHash?: string } = {};
    if (isRole(body.role)) data.role = body.role;
    if (typeof body.password === "string" && body.password) {
      if (body.password.length < 6) return NextResponse.json({ error: "Mot de passe : 6 caractères minimum." }, { status: 400 });
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Empêche de retirer le dernier patron (garde-fou anti-verrouillage).
    if (data.role && data.role !== "patron") {
      const target = await prisma.adminUser.findUnique({ where: { id } });
      if (target?.role === "patron") {
        const patrons = await prisma.adminUser.count({ where: { role: "patron" } });
        if (patrons <= 1) return NextResponse.json({ error: "Impossible : c'est le dernier patron." }, { status: 400 });
      }
    }

    const user = await prisma.adminUser.update({ where: { id }, data, select: { id: true, email: true, role: true } });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "users")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  if (id === session.admin.id) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });

  try {
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (target?.role === "patron") {
      const patrons = await prisma.adminUser.count({ where: { role: "patron" } });
      if (patrons <= 1) return NextResponse.json({ error: "Impossible : c'est le dernier patron." }, { status: 400 });
    }
    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
