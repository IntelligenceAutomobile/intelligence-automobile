import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";

// Enregistre une estimation de reprise : (ré)utilise un client et crée un lead
// « reprise » avec le détail du véhicule évalué dans la timeline.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const c = (body.client ?? {}) as Record<string, unknown>;
    const v = (body.vehicle ?? {}) as Record<string, unknown>;
    const s = (x: unknown) => (typeof x === "string" ? x.trim() : "");

    const name = s(c.name);
    const make = s(v.make);
    const model = s(v.model);
    if (!name) return NextResponse.json({ error: "Le nom du client est requis." }, { status: 400 });
    if (!make || !model) return NextResponse.json({ error: "La marque et le modèle sont requis." }, { status: 400 });

    const email = s(c.email);
    const phone = s(c.phone);

    // Rattache au client existant (par email) ou le crée.
    let client = email ? await prisma.client.findFirst({ where: { email } }) : null;
    if (!client) {
      client = await prisma.client.create({ data: { name, company: s(c.company), email, phone } });
    } else if (phone && !client.phone) {
      client = await prisma.client.update({ where: { id: client.id }, data: { phone } });
    }

    const year = Number(v.year);
    const value = Number(body.value);
    const yearLabel = Number.isFinite(year) && year > 1950 ? ` (${year})` : "";

    // Résumé lisible du véhicule évalué (timeline du lead).
    const lines = [
      `${make} ${model}${yearLabel}`,
      [
        Number.isFinite(Number(v.mileage)) && Number(v.mileage) > 0 ? `${Number(v.mileage)} km` : "",
        s(v.fuel),
        s(v.transmission),
      ].filter(Boolean).join(" · "),
      s(v.condition) ? `État : ${s(v.condition)}` : "",
      Number.isFinite(value) && value > 0 ? `Estimation proposée : ${value.toLocaleString("fr-FR")} €` : "",
      s(body.notes),
    ].filter(Boolean).join("\n");

    const collab = await getCollabSession();
    const lead = await prisma.lead.create({
      data: {
        clientId: client.id,
        source: "reprise",
        stage: "nouveau",
        title: `Reprise ${make} ${model}${yearLabel}`,
        budget: Number.isFinite(value) && value > 0 ? Math.round(value) : null,
        events: {
          create: [
            { type: "creation", content: "Estimation de reprise créée", author: collab?.name ?? "" },
            { type: "note", content: lines, author: collab?.name ?? "" },
          ],
        },
      },
    });

    return NextResponse.json({ id: lead.id, clientId: client.id });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}
