import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { can, asRole } from "@/lib/roles";
import { LISTE_ROUGE_FIXE, oublierListeRouge } from "@/lib/mailer";

// Une entrée de liste rouge : adresse complète, ou domaine seul.
const ENTREE = /^(?:[^\s@]+@)?[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "settings")) {
    return NextResponse.json({ error: "Votre rôle ne permet pas de modifier la liste rouge." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const value = String(body.value ?? "").trim().toLowerCase().replace(/^@/, "");
    const reason = String(body.reason ?? "").trim().slice(0, 200);

    if (!ENTREE.test(value)) {
      return NextResponse.json({ error: "Indiquez une adresse email ou un domaine, par exemple exemple.fr." }, { status: 400 });
    }
    // Déjà couvert par le socle inscrit dans le code : rien à ajouter.
    if (LISTE_ROUGE_FIXE.includes(value as (typeof LISTE_ROUGE_FIXE)[number])) {
      return NextResponse.json({ error: `${value} est déjà bloqué de façon permanente.` }, { status: 409 });
    }

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";

    const existe = await prisma.emailBlock.findUnique({ where: { value } });
    if (existe) return NextResponse.json({ error: `${value} figure déjà dans la liste rouge.` }, { status: 409 });

    await prisma.emailBlock.create({ data: { value, reason, author } });
    oublierListeRouge();
    return NextResponse.json({ ok: true, value });
  } catch {
    return NextResponse.json({ error: "L'ajout à la liste rouge a échoué." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "settings")) {
    return NextResponse.json({ error: "Votre rôle ne permet pas de modifier la liste rouge." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Entrée introuvable." }, { status: 400 });

    const { count } = await prisma.emailBlock.deleteMany({ where: { id } });
    oublierListeRouge();
    if (count === 0) return NextResponse.json({ error: "Cette entrée a déjà été retirée." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Le retrait de la liste rouge a échoué." }, { status: 500 });
  }
}
