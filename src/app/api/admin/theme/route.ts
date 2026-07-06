import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";

export const THEME_DEFAULTS = {
  name: "Intelligence Automobile",
  tagline: "Back-office",
  accent: "#6B9FEE",
};

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const theme = await prisma.brandTheme.findUnique({ where: { id: "default" } });
  return NextResponse.json(theme ?? { id: "default", ...THEME_DEFAULTS });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "settings")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 40);
    const tagline = String(body.tagline ?? "").trim().slice(0, 40);
    const accent = String(body.accent ?? "").trim();
    if (!name) return NextResponse.json({ error: "Le nom de marque est requis." }, { status: 400 });
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
      return NextResponse.json({ error: "Couleur invalide (format #RRGGBB)." }, { status: 400 });
    }

    const theme = await prisma.brandTheme.upsert({
      where: { id: "default" },
      create: { id: "default", name, tagline, accent },
      update: { name, tagline, accent },
    });
    return NextResponse.json(theme);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}
