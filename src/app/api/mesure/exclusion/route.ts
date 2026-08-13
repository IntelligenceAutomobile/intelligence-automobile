import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_EXCLUSION, RETENTION_JOURS } from "@/lib/audience";

// Exclusion d'un appareil de la mesure d'audience, déclenchée par la page /moi.
//
// La route pose le cookie d'exclusion, puis efface les visites déjà
// enregistrées pour cet appareil : le cookie visiteur (ia_vid) désigne
// exactement ses lignes, et lui seul les connaît. Un appareil range donc ses
// propres traces et rien d'autre — c'est aussi le droit d'opposition des
// mentions légales, ouvert à tout visiteur qui trouverait la page.

const VIE_EXCLUSION = RETENTION_JOURS * 24 * 60 * 60;

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Même règle que la pose du cookie : un identifiant sort de crypto.randomUUID().
// La suppression parcourt la table entière (colonne sans index) : elle se
// réserve aux valeurs qui ont pu être réellement posées.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function POST(req: NextRequest) {
  // Même origine seulement, comme la route de mesure : un site tiers perd la
  // possibilité de déclencher des suppressions à la chaîne.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== (req.headers.get("host") ?? "")) {
        return new NextResponse(null, { status: 204 });
      }
    } catch {
      return new NextResponse(null, { status: 204 });
    }
  }

  const dejaExclu = Boolean(req.cookies.get(COOKIE_EXCLUSION));
  const brut = req.cookies.get("ia_vid")?.value ?? "";
  const vid = UUID.test(brut) ? brut : "";

  // L'effacement se fait avant la réponse : le chiffre affiché par la page
  // /moi est celui des lignes réellement parties.
  let effacees = 0;
  if (vid) {
    try {
      const res = await prisma.pageView.deleteMany({ where: { visitorId: vid } });
      effacees = res.count;
    } catch {
      // L'exclusion vaut d'abord pour l'avenir : le cookie part quand même,
      // les anciennes lignes attendront un nouveau passage sur la page.
    }
  }

  const reponse = NextResponse.json({ dejaExclu, effacees });
  reponse.cookies.set(COOKIE_EXCLUSION, "1", { ...COOKIE, maxAge: VIE_EXCLUSION });
  // Les cookies de mesure ont fini de servir : l'appareil redevient vierge.
  for (const nom of ["ia_vid", "ia_vis", "ia_src", "ia_ref"]) {
    reponse.cookies.set(nom, "", { ...COOKIE, maxAge: 0 });
  }
  return reponse;
}
