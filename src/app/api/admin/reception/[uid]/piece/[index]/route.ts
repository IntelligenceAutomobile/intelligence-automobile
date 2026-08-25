import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { pieceJointe, receptionConfiguree } from "@/lib/reception";

export const maxDuration = 30;

// Téléchargement d'une pièce jointe d'un message reçu : le fichier est lu chez
// IONOS au moment du clic, rien n'est conservé côté site.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string; index: string }> },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "settings")) {
    return NextResponse.json({ error: "Votre rôle ne permet pas de lire la boîte de réception." }, { status: 403 });
  }
  if (!receptionConfiguree()) {
    return NextResponse.json({ error: "La boîte n'est pas encore reliée sur ce serveur." }, { status: 503 });
  }

  const { uid, index } = await params;
  const nUid = Number(uid);
  const nIndex = Number(index);
  if (!Number.isInteger(nUid) || nUid <= 0 || !Number.isInteger(nIndex) || nIndex < 0 || nIndex > 50) {
    return NextResponse.json({ error: "Pièce jointe introuvable." }, { status: 400 });
  }

  try {
    const piece = await pieceJointe(nUid, nIndex);
    if (!piece) return NextResponse.json({ error: "Cette pièce jointe a disparu de la boîte." }, { status: 404 });

    // Le nom de fichier voyage encodé : un accent ou une espace cassait l'en-tête.
    const nom = encodeURIComponent(piece.filename.replace(/[\r\n"]/g, " ").trim() || "piece-jointe");
    return new NextResponse(new Uint8Array(piece.content), {
      headers: {
        "Content-Type": piece.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${nom}`,
        "Content-Length": String(piece.content.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[reception] pièce jointe illisible :", e);
    return NextResponse.json({ error: "La boîte ne répond pas. Réessayez dans un instant." }, { status: 502 });
  }
}
