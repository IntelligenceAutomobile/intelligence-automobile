import { NextResponse, type NextRequest } from "next/server";
import { cleFlux, cleValide, genererFluxXml } from "@/lib/flux-xml";

// Adresse publique du flux XML, protégée par une clé portée dans l'adresse :
//   https://intelligenceautomobile.fr/api/flux/annonces.xml?cle=…
// Un portail partenaire (Annonces-Automobile, un agrégateur) la lit lui-même
// à la fréquence de son choix, sans compte chez nous. Le contenu est celui du
// bouton « Télécharger le flux XML » de l'écran Diffusion.

export async function GET(req: NextRequest) {
  // Clé absente des réglages : le flux reste fermé, et le message le dit.
  if (!cleFlux()) return new NextResponse("Flux non configuré.", { status: 503 });

  if (!cleValide(req.nextUrl.searchParams.get("cle"))) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const xml = await genererFluxXml();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Toujours frais : le portail lit l'état du stock du moment.
      "Cache-Control": "no-store",
      // Hors des moteurs de recherche, même si l'adresse venait à circuler.
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
