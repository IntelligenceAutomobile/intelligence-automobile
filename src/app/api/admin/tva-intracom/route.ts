import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { EU_COUNTRIES, normalizeVat, vatIssue } from "@/lib/devis";

// Vérification d'un numéro de TVA intracommunautaire auprès de VIES, le service
// de la Commission européenne. C'est la diligence attendue du vendeur : exonérer
// une vente sur un numéro invalide fait retomber la TVA française sur lui.
//
// VIES tombe régulièrement, et certains États membres masquent le nom du
// titulaire. La réponse distingue donc trois cas : valide, invalide, et service
// indisponible. Le troisième ne bloque rien : le contrôle de forme reste fait.
const VIES = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pays = String(body.country ?? "").toUpperCase();
  const numero = normalizeVat(String(body.number ?? ""));

  const forme = vatIssue(pays, numero);
  if (forme) return NextResponse.json({ etat: "invalide", message: forme });

  // VIES attend le code de son propre référentiel : Grèce = EL.
  const prefixe = EU_COUNTRIES.find((c) => c.code === pays)?.vatPrefix ?? pays;
  const corps = numero.startsWith(prefixe) ? numero.slice(prefixe.length) : numero;

  try {
    // Délai court : la vérification est un confort, elle ne doit pas figer
    // l'écran quand le service européen répond au ralenti.
    const res = await fetch(VIES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: prefixe, vatNumber: corps }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) {
      return NextResponse.json({ etat: "indisponible", message: "Le service européen n'a pas répondu. Le format du numéro est correct." });
    }
    const j = await res.json();
    if (j.valid === true || j.isValid === true) {
      const nom = String(j.name ?? "").trim();
      const adresse = String(j.address ?? "").trim();
      return NextResponse.json({
        etat: "valide",
        // Certains États membres ne publient ni le nom ni l'adresse : le
        // marqueur « --- » de VIES ne doit pas s'afficher tel quel.
        nom: nom === "---" ? "" : nom,
        adresse: adresse === "---" ? "" : adresse,
      });
    }
    return NextResponse.json({ etat: "invalide", message: "Ce numéro est inconnu du registre européen." });
  } catch {
    return NextResponse.json({ etat: "indisponible", message: "Le service européen est injoignable. Le format du numéro est correct." });
  }
}
