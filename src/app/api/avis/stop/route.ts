import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";

// Opposition à recevoir nos messages, depuis le pied d'une invitation d'avis.
//
// Route publique : le jeton du client tient lieu d'authentification. Elle
// répond « ok » dans tous les cas, jeton inconnu compris, pour que rien de ce
// qu'elle renvoie ne renseigne un curieux sur l'existence d'une fiche.
//
// L'adresse rejoint la liste rouge du site, qui devient ainsi le registre des
// oppositions : elle protège du même coup les devis et les relances, tous les
// envois passant par la même porte de sortie (src/lib/mailer.ts).
export async function POST(req: NextRequest) {
  const ok = () => NextResponse.json({ ok: true });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) return ok();

    const client = await prisma.client.findUnique({
      where: { reviewToken: token },
      select: { id: true, name: true, company: true, email: true },
    });
    if (!client) return ok();

    const jour = parisDay(new Date()).toISOString().slice(0, 10);
    const nom = client.company || client.name;

    await prisma.client.update({
      where: { id: client.id },
      data: { reviewOutcome: "stop", reviewOutcomeNote: `Opposition exprimée le ${jour}` },
    });

    if (client.email) {
      await prisma.emailBlock.upsert({
        where: { value: client.email },
        update: {},
        create: {
          value: client.email,
          reason: `Opposition exprimée depuis le lien d'un message, le ${jour}`,
          author: nom,
        },
      });
    }

    await prisma.avisLog.create({
      data: {
        clientId: client.id,
        clientName: nom,
        action: "arret",
        channel: "lien",
        sentDay: jour,
        detail: "Opposition exprimée par le client",
        author: "le client",
      },
    });

    return ok();
  } catch {
    return NextResponse.json({ error: "Réessayez dans un instant." }, { status: 500 });
  }
}
