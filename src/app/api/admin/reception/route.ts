import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { listeMessages, receptionConfiguree } from "@/lib/reception";
import { prisma } from "@/lib/prisma";

// La connexion à la boîte prend quelques secondes : on laisse de la marge.
export const maxDuration = 30;

// Pastille CRM d'un expéditeur connu : « client » quand un dossier a déjà été
// gagné avec lui, « lead » quand une demande est en cours, « contact » sinon.
export type ContactChip = { id: string; name: string; type: "client" | "lead" | "contact" };

async function pastilles(adresses: string[]): Promise<Record<string, ContactChip>> {
  const chips: Record<string, ContactChip> = {};
  if (adresses.length === 0) return chips;
  try {
    // La comparaison se fait en minuscules côté code : les fiches portent
    // l'adresse telle qu'elle a été saisie.
    const clients = await prisma.client.findMany({
      where: { email: { not: "" } },
      select: { id: true, name: true, email: true, leads: { select: { stage: true } } },
    });
    const parEmail = new Map(clients.map((c) => [c.email.trim().toLowerCase(), c]));
    for (const a of adresses) {
      const c = parEmail.get(a);
      if (!c) continue;
      chips[a] = {
        id: c.id,
        name: c.name,
        type: c.leads.some((l) => l.stage === "gagne") ? "client" : c.leads.length > 0 ? "lead" : "contact",
      };
    }
  } catch {
    /* la pastille est un plus : son échec ne prive pas de la liste */
  }
  return chips;
}

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
    const chips = await pastilles([...new Set(messages.map((m) => m.fromAddress.toLowerCase()).filter(Boolean))]);
    return NextResponse.json({
      messages: messages.map((m) => ({ ...m, contact: chips[m.fromAddress.toLowerCase()] ?? null })),
    });
  } catch (e) {
    console.error("[reception] lecture de la liste impossible :", e);
    return NextResponse.json(
      { error: "La boîte ne répond pas. Vérifiez les accès, puis réessayez dans un instant." },
      { status: 502 },
    );
  }
}
