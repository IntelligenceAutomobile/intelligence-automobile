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
    const reviewLink = String(body.reviewLink ?? "").trim().slice(0, 300);

    // Identité des documents. Un champ vide reprend la valeur de company.ts,
    // ce qui laisse le revendeur ne remplir que ce qui le concerne.
    const texte = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
    const docAccent = texte(body.docAccent, 7);
    if (docAccent && !/^#[0-9a-fA-F]{6}$/.test(docAccent)) {
      return NextResponse.json({ error: "Couleur du document invalide (format #RRGGBB)." }, { status: 400 });
    }
    const documents = {
      logoUrl: texte(body.logoUrl, 500),
      docAccent,
      docTheme: ["classic", "colored", "minimal"].includes(String(body.docTheme)) ? String(body.docTheme) : "classic",
      emitterName: texte(body.emitterName, 120),
      emitterAddress: texte(body.emitterAddress, 300),
      emitterRepresentative: texte(body.emitterRepresentative, 120),
      emitterEmail: texte(body.emitterEmail, 160),
      emitterPhone: texte(body.emitterPhone, 40),
      emitterSiret: texte(body.emitterSiret, 40),
      emitterTva: texte(body.emitterTva, 40),
      emitterIban: texte(body.emitterIban, 60),
      emitterBic: texte(body.emitterBic, 20),
      emitterBank: texte(body.emitterBank, 80),
      legalFootnote: texte(body.legalFootnote, 800),
    };
    if (!name) return NextResponse.json({ error: "Le nom de marque est requis." }, { status: 400 });
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
      return NextResponse.json({ error: "Couleur invalide (format #RRGGBB)." }, { status: 400 });
    }

    const theme = await prisma.brandTheme.upsert({
      where: { id: "default" },
      create: { id: "default", name, tagline, accent, reviewLink, ...documents },
      update: { name, tagline, accent, reviewLink, ...documents },
    });
    return NextResponse.json(theme);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}
