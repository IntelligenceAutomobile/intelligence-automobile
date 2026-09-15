import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { genererFluxXml } from "@/lib/flux-xml";

// Bouton « Télécharger le flux XML » de l'écran Diffusion : le même fichier
// que l'adresse publique à clé (/api/flux/annonces.xml), servi ici en
// téléchargement à un compte connecté. La fabrication vit dans lib/flux-xml.

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new NextResponse("Non autorisé", { status: 401 });

  const xml = await genererFluxXml();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Le bouton de l'écran propose un téléchargement plutôt qu'un onglet de
      // balises : le fichier se transmet ensuite à l'agrégateur.
      "Content-Disposition": 'attachment; filename="stock-intelligence-automobile.xml"',
      "Cache-Control": "no-store",
    },
  });
}
