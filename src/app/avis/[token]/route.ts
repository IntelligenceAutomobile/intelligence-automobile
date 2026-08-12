import { after, NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { AVIS_CHEMIN_MESURE, AVIS_SRC } from "@/lib/avis";
import { canalDe, domaineDe, estRobot, typeAppareil } from "@/lib/audience";

// Dernière étape avant Google.
//
// Le bouton du message, le QR code de la remise des clés et le SMS pointent
// tous ici. La route note le passage puis redirige vers la fiche Google en une
// fraction de seconde : le détour reste invisible pour le client, et l'écran
// des avis peut enfin dire combien de personnes ouvrent réellement le lien.
//
// Route publique, sans authentification : le jeton du client en tient lieu.
// Elle redirige dans tous les cas, y compris quand elle décide de rien
// enregistrer. Rien de ce qu'elle renvoie ne renseigne un curieux.

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const accueil = new URL("/", req.nextUrl.origin);

  try {
    const [client, theme] = await Promise.all([
      prisma.client.findUnique({
        where: { reviewToken: token },
        select: { id: true, name: true, company: true, reviewClickedAt: true },
      }),
      prisma.brandTheme.findUnique({ where: { id: "default" }, select: { reviewLink: true } }),
    ]);

    const cible = theme?.reviewLink?.trim();
    // Jeton inconnu ou fiche Google encore à renseigner : le visiteur atterrit
    // sur le site plutôt que sur une page d'erreur.
    if (!client || !cible) return NextResponse.redirect(accueil, 302);

    const reponse = NextResponse.redirect(cible, 302);

    // Les robots des messageries ouvrent les liens à la place du destinataire :
    // les compter gonflerait le taux de clic d'un chiffre imaginaire.
    const ua = req.headers.get("user-agent") ?? "";
    if (estRobot(ua)) return reponse;

    // L'écriture part APRÈS la réponse : le client est chez Google tout de suite.
    after(async () => {
      const jour = parisDay(new Date()).toISOString().slice(0, 10);
      try {
        // Le premier passage marque la fiche, les suivants laissent la date en
        // place : ce qui compte est qu'il ait ouvert, pas combien de fois.
        if (!client.reviewClickedAt) {
          await prisma.client.update({ where: { id: client.id }, data: { reviewClickedAt: jour } });
          await prisma.avisLog.create({
            data: {
              clientId: client.id,
              clientName: client.company || client.name,
              action: "clic",
              channel: "lien",
              sentDay: jour,
              detail: "Lien d'avis ouvert",
            },
          });
        }
      } catch (e) {
        console.error("[Avis] Échec d'enregistrement du clic:", e);
      }

      // Le passage rejoint la mesure d'audience, à côté des liens semés dans
      // les annonces : la collecte d'avis se lit sur le même tableau que les
      // autres campagnes. Le chemin enregistré omet le jeton, qui désigne
      // une personne.
      try {
        const referrer = domaineDe(req.headers.get("referer") ?? "", req.headers.get("host") ?? "");
        await prisma.pageView.create({
          data: {
            day: jour,
            path: AVIS_CHEMIN_MESURE,
            src: AVIS_SRC,
            referrer,
            channel: canalDe(AVIS_SRC, referrer),
            visitorId: "",
            sessionId: "",
            device: typeAppareil(ua),
            country: (req.headers.get("x-vercel-ip-country") ?? "").slice(0, 2).toUpperCase(),
            isEntry: true,
            isNew: false,
          },
        });
      } catch (e) {
        console.error("[Avis] Échec de mesure du passage:", e);
      }
    });

    return reponse;
  } catch {
    return NextResponse.redirect(accueil, 302);
  }
}
