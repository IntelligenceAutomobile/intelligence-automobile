import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { listeMessages, receptionConfiguree } from "@/lib/reception";

// La connexion à la boîte prend quelques secondes : on laisse de la marge.
export const maxDuration = 30;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "settings")) {
    return NextResponse.json({ error: "Votre rôle ne permet pas de lire la boîte de réception." }, { status: 403 });
  }

  if (!receptionConfiguree()) {
    return NextResponse.json(
      { error: "La boîte n'est pas encore reliée : les accès IMAP manquent sur ce serveur." },
      { status: 503 },
    );
  }

  try {
    const messages = await listeMessages(50);
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("[reception] lecture de la liste impossible :", e);
    return NextResponse.json(
      { error: "La boîte ne répond pas. Vérifiez les accès, puis réessayez dans un instant." },
      { status: 502 },
    );
  }
}
