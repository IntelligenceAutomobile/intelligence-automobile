import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Bibliothèque des visuels composés dans /admin/visuels. Les deux images vivent
// sur le stockage de fichiers ; la fiche ne garde que leurs adresses et les
// réglages qui ont servi à les composer.

/** Longueur au-delà de laquelle un champ trahit autre chose qu'un usage normal. */
const NOM_MAX = 120;
const URL_MAX = 600;
const REGLAGES_MAX = 4000;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await prisma.visuel.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      nom: true,
      imageUrl: true,
      photoUrl: true,
      largeur: true,
      hauteur: true,
      reglages: true,
      createdAt: true,
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0);

  const imageUrl = texte(body.imageUrl, URL_MAX);
  if (!imageUrl) return NextResponse.json({ error: "Image manquante" }, { status: 400 });

  const visuel = await prisma.visuel.create({
    data: {
      nom: texte(body.nom, NOM_MAX) || "Visuel",
      imageUrl,
      photoUrl: texte(body.photoUrl, URL_MAX),
      largeur: nombre(body.largeur),
      hauteur: nombre(body.hauteur),
      // Les réglages voyagent déjà en JSON : ils sont rangés tels quels, bornés
      // en longueur, et relus par l'écran qui les a écrits.
      reglages: texte(body.reglages, REGLAGES_MAX) || "{}",
      author: session.admin.email,
    },
    select: {
      id: true,
      nom: true,
      imageUrl: true,
      photoUrl: true,
      largeur: true,
      hauteur: true,
      reglages: true,
      createdAt: true,
    },
  });

  return NextResponse.json(visuel);
}
