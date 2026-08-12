import { after, NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { AVIS_CHEMIN_MESURE, AVIS_SRC_COMPTOIR } from "@/lib/avis";
import { canalDe, domaineDe, estRobot, typeAppareil } from "@/lib/audience";

// Lien d'avis sans destinataire : celui du QR code tendu à la remise des clés,
// du lien court copié dans une signature, et de la carte glissée dans la
// pochette avec les papiers.
//
// Même détour que le lien nominatif : le passage se compte, puis la fiche
// Google s'ouvre. Sans jeton, la fiche d'un client reste hors de portée, donc
// rien n'y est marqué : seul le comptage a lieu.
export async function GET(req: NextRequest) {
  const accueil = new URL("/", req.nextUrl.origin);

  try {
    const theme = await prisma.brandTheme.findUnique({ where: { id: "default" }, select: { reviewLink: true } });
    const cible = theme?.reviewLink?.trim();
    if (!cible) return NextResponse.redirect(accueil, 302);

    const reponse = NextResponse.redirect(cible, 302);

    const ua = req.headers.get("user-agent") ?? "";
    if (estRobot(ua)) return reponse;

    after(async () => {
      try {
        const referrer = domaineDe(req.headers.get("referer") ?? "", req.headers.get("host") ?? "");
        await prisma.pageView.create({
          data: {
            day: parisDay(new Date()).toISOString().slice(0, 10),
            path: AVIS_CHEMIN_MESURE,
            src: AVIS_SRC_COMPTOIR,
            referrer,
            channel: canalDe(AVIS_SRC_COMPTOIR, referrer),
            visitorId: "",
            sessionId: "",
            device: typeAppareil(ua),
            country: (req.headers.get("x-vercel-ip-country") ?? "").slice(0, 2).toUpperCase(),
            isEntry: true,
            isNew: false,
          },
        });
      } catch (e) {
        console.error("[Avis] Échec de mesure du passage au comptoir:", e);
      }
    });

    return reponse;
  } catch {
    return NextResponse.redirect(accueil, 302);
  }
}
