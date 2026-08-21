// Le verrou de lancement des mandats, côté serveur.
//
// Les écrans du module le posaient déjà ; les adresses techniques, elles,
// s'ouvraient à toute session du back-office. Le module se pilotait donc par
// requête directe sans passer par la page. Ce garde-fou rassemble le contrôle
// en un seul endroit pour que les sept routes disent la même chose.
//
// Voir voitMandats() dans src/lib/roles.ts pour ce que ce verrou protège
// réellement : un rideau de lancement entre deux personnes qui partagent un
// compte, pas une porte blindée.
import { NextResponse } from "next/server";
import { requireAdmin } from "./auth";
import { getCollabSession } from "./collab-auth";
import { voitMandats } from "./roles";

type Session = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

export type AccesMandats =
  | { ok: true; session: Session; author: string }
  | { ok: false; refus: NextResponse };

/**
 * Session autorisée sur le module Mandats, avec la signature à porter au
 * journal. À appeler en tête de chaque route du module :
 *
 *   const acces = await requireMandats();
 *   if (!acces.ok) return acces.refus;
 */
export async function requireMandats(): Promise<AccesMandats> {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false, refus: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  const collab = await getCollabSession();
  if (!voitMandats(session.admin.email, collab?.name)) {
    return {
      ok: false,
      refus: NextResponse.json({ error: "Le module Mandats ouvre bientôt." }, { status: 403 }),
    };
  }
  return { ok: true, session, author: collab?.name ?? session.admin.email ?? "" };
}
