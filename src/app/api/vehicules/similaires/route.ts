import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Véhicules du stock proposés en regard d'une annonce que le client a repérée
// ailleurs (formulaire de recherche personnalisée). Publique et volontairement
// avare : trois fiches publiées et disponibles, rien de plus.
const MAX_CARDS = 3;

type Card = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  image: string | null;
};

function firstImage(images: string): string | null {
  try {
    const list = JSON.parse(images) as unknown;
    return Array.isArray(list) && typeof list[0] === "string" ? list[0] : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const make = (req.nextUrl.searchParams.get("make") ?? "").trim();
  const model = (req.nextUrl.searchParams.get("model") ?? "").trim().toLowerCase();

  if (make.length < 2) return NextResponse.json({ vehicles: [] });

  try {
    const rows = await prisma.vehicle.findMany({
      where: { isPublished: true, status: "disponible", make: { contains: make } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, make: true, model: true, year: true,
        mileage: true, price: true, images: true,
      },
    });

    // Le champ « modèle » de la base porte la finition complète (« 911 Carrera 4S ») :
    // les fiches qui contiennent ce que le client a saisi passent devant, les
    // autres fiches de la marque complètent la rangée. Le tri est stable, donc
    // l'ordre par date de création est conservé à l'intérieur de chaque groupe.
    const ranked =
      model.length >= 2
        ? [...rows].sort(
            (a, b) =>
              Number(b.model.toLowerCase().includes(model)) -
              Number(a.model.toLowerCase().includes(model)),
          )
        : rows;

    const vehicles: Card[] = ranked.slice(0, MAX_CARDS).map((v) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      mileage: v.mileage,
      price: v.price,
      image: firstImage(v.images),
    }));

    return NextResponse.json({ vehicles });
  } catch (e) {
    // Le bandeau reste masqué : il complète le formulaire, il ne le bloque pas.
    console.error("[Similaires] Échec de la recherche:", e);
    return NextResponse.json({ vehicles: [] });
  }
}
