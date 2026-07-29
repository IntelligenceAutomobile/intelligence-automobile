import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parisDay } from "@/lib/vehicules";
import { buildSnapshot } from "@/lib/reunions-server";
import { isDateKey, isMeetingKind } from "@/lib/reunions";

// Liste légère : alimente la recherche de la palette de commandes.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await prisma.meeting.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, date: true, title: true, kind: true },
  });
  return NextResponse.json(rows);
}

// Création en un clic : la fiche naît datée du jour, signée, avec sa photo de
// situation déjà figée. Aucun formulaire intermédiaire, le titre se saisit sur
// la fiche (patron « Nouveau devis »).
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    // Corps optionnel : le bouton de la liste n'envoie rien. Un corps qui n'est
    // pas un objet (« null », un nombre, une chaîne) reste du JSON valide : on le
    // ramène à une création nue plutôt que de laisser lire ses propriétés.
    let body: Record<string, unknown> = {};
    try {
      const parsed: unknown = await req.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      /* création nue */
    }

    // Jour de Paris : le runtime tourne en UTC, une réunion créée le soir
    // porterait sinon la date du lendemain.
    const today = parisDay(new Date()).toISOString().slice(0, 10);
    const date = isDateKey(body.date) ? body.date : today;
    const kind = isMeetingKind(body.kind) ? body.kind : "interne";

    // Signature lue côté serveur pour rester fidèle même si le client envoie
    // autre chose. Sert aussi de premier participant : le créateur était là.
    const author = (await cookies()).get("ia_collab_name")?.value?.trim() ?? "";

    // Une photo absente s'écrit « {} » : la carte « Où on en était » se replie
    // alors qu'une rangée de zéros ferait croire à une agence vide.
    const snapshot = await buildSnapshot();

    const meeting = await prisma.meeting.create({
      data: {
        date,
        kind,
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : "",
        attendees: JSON.stringify(author ? [author] : []),
        author,
        snapshot: JSON.stringify(snapshot ?? {}),
      },
      select: { id: true },
    });

    return NextResponse.json(meeting);
  } catch {
    return NextResponse.json({ error: "La réunion n'a pas pu être créée." }, { status: 500 });
  }
}
