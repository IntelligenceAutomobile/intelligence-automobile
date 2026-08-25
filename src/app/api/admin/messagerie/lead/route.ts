import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { can, asRole } from "@/lib/roles";
import { createLeadFromSite } from "@/lib/crm-intake";

// « Créer le lead » depuis un message reçu : l'expéditeur entre au CRM en un
// clic, fiche client + lead source « email », sans ressaisie.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "settings")) {
    return NextResponse.json({ error: "Votre rôle ne permet pas de créer un lead depuis la messagerie." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const name = String(body.name ?? "").trim().slice(0, 120);
    const subject = String(body.subject ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 2000);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "L'expéditeur n'a pas d'adresse exploitable." }, { status: 400 });
    }

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "Messagerie";

    const { clientId } = await createLeadFromSite({
      name: name || email,
      email,
      source: "email",
      title: subject ? `Email reçu : ${subject}` : "Email reçu",
      message: message || `Message reçu sur contact@ (objet : ${subject || "sans objet"}).`,
      author,
    });

    return NextResponse.json({ ok: true, clientId });
  } catch (e) {
    console.error("[messagerie] création de lead impossible :", e);
    return NextResponse.json({ error: "La création du lead a échoué." }, { status: 500 });
  }
}
