import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { isSource, isStage } from "@/lib/crm";
import { normaliserEmail, trouverClientExistant } from "@/lib/crm-intake";

// Liste des clients avec leurs leads (pipeline + palette de commandes).
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
    include: { leads: { orderBy: { updatedAt: "desc" } } },
  });
  return NextResponse.json(clients);
}

// Création d'un client, avec lead initial optionnel.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });

    const email = normaliserEmail(body.email);
    const phone = String(body.phone ?? "").trim();

    // La création manuelle ne cherchait aucun doublon : le même prospect
    // finissait en deux fiches, ses opportunités éclatées entre les deux.
    // On prévient, on ne bloque pas : `force` permet de passer outre.
    if (!body.force) {
      const existant = await trouverClientExistant(email, phone);
      if (existant) {
        return NextResponse.json(
          {
            error: "Une fiche proche existe déjà.",
            doublon: { id: existant.id, name: existant.name, email: existant.email, phone: existant.phone },
          },
          { status: 409 },
        );
      }
    }

    const collab = await getCollabSession();
    const author = collab?.name ?? "";

    const client = await prisma.client.create({
      data: {
        name,
        company: String(body.company ?? "").trim(),
        email,
        phone,
        notes: String(body.notes ?? "").trim(),
        lastActivityAt: new Date(),
      },
    });

    if (body.lead && typeof body.lead === "object") {
      const l = body.lead as Record<string, unknown>;
      await prisma.lead.create({
        data: {
          clientId: client.id,
          title: String(l.title ?? "").trim(),
          stage: isStage(l.stage) ? l.stage : "nouveau",
          source: isSource(l.source) ? l.source : "manuel",
          vehicleId: typeof l.vehicleId === "string" && l.vehicleId ? l.vehicleId : null,
          budget: typeof l.budget === "number" && l.budget > 0 ? Math.round(l.budget) : null,
          events: {
            create: { type: "creation", content: "Lead créé", author },
          },
        },
      });
    }

    const full = await prisma.client.findUnique({ where: { id: client.id }, include: { leads: true } });
    return NextResponse.json(full);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  }
}
