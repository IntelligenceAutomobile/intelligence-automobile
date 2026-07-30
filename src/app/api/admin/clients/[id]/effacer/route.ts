import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { can, asRole } from "@/lib/roles";
import { effacerPersonne } from "@/lib/rgpd";
import { parisDay } from "@/lib/vehicules";
import { formatDateFr } from "@/lib/devis";

// Droit à l'effacement (art. 17 du RGPD). Efface les données personnelles
// partout, en conservant ce que la loi comptable impose de garder dix ans.
// Voir src/lib/rgpd.ts pour la règle appliquée, pièce par pièce.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  // Un effacement est irréversible et touche les pièces comptables : même droit
  // que la suppression.
  if (!can(asRole(session.admin.role), "delete")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const collab = await getCollabSession();
    const auteur = collab?.name ?? session.admin.email ?? "";
    const jour = formatDateFr(parisDay(new Date()).toISOString().slice(0, 10));

    const bilan = await effacerPersonne(id, auteur, jour);
    if (!bilan) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

    return NextResponse.json({ ok: true, bilan });
  } catch {
    return NextResponse.json({ error: "L'effacement a échoué." }, { status: 500 });
  }
}
