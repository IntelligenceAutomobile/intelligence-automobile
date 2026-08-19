import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { lireMessage, receptionConfiguree } from "@/lib/reception";

export const maxDuration = 30;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
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

  const { uid } = await params;
  const n = Number(uid);
  if (!Number.isInteger(n) || n <= 0) {
    return NextResponse.json({ error: "Message introuvable." }, { status: 400 });
  }

  try {
    const message = await lireMessage(n);
    if (!message) return NextResponse.json({ error: "Ce message a été déplacé ou supprimé de la boîte." }, { status: 404 });
    return NextResponse.json({ message });
  } catch (e) {
    console.error("[reception] lecture du message impossible :", e);
    return NextResponse.json(
      { error: "La boîte ne répond pas. Vérifiez les accès, puis réessayez dans un instant." },
      { status: 502 },
    );
  }
}
