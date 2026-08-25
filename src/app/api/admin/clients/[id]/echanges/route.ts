import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messagesDe, receptionConfiguree } from "@/lib/reception";

export const maxDuration = 30;

export type Echange = {
  /** « recu » vient de la boîte IONOS, « envoye » du journal du site. */
  sens: "recu" | "envoye";
  /** uid IMAP pour un reçu, id du journal pour un envoyé. */
  ref: string;
  subject: string;
  date: string;
  /** Envoyé : état de remise. Reçu : lu ou non dans la boîte. */
  etat: string;
};

// Historique des échanges d'un client : ses messages reçus (boîte IONOS, lus en
// direct) et tout ce que le site lui a envoyé (journal), fondus par date.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id }, select: { email: true } });
  if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  const email = client.email.trim().toLowerCase();
  if (!email) return NextResponse.json({ echanges: [], boite: receptionConfiguree() });

  const envoyes = await prisma.emailLog.findMany({
    where: { recipients: { contains: email } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, subject: true, createdAt: true, outcome: true, deliveredAt: true, openedAt: true, bouncedAt: true },
  });

  let recus: Echange[] = [];
  let boiteEnPanne = false;
  if (receptionConfiguree()) {
    try {
      recus = (await messagesDe(email, 20)).map((m) => ({
        sens: "recu",
        ref: String(m.uid),
        subject: m.subject,
        date: m.date,
        etat: m.seen ? "lu" : "non lu",
      }));
    } catch (e) {
      console.error("[echanges] boîte injoignable :", e);
      boiteEnPanne = true;
    }
  }

  const echanges: Echange[] = [
    ...recus,
    ...envoyes.map<Echange>((l) => ({
      sens: "envoye",
      ref: l.id,
      subject: l.subject || "(sans objet)",
      date: l.createdAt.toISOString(),
      etat:
        l.outcome !== "envoye"
          ? l.outcome === "retenu" ? "retenu" : "refusé"
          : l.bouncedAt ? "injoignable" : l.openedAt ? "ouvert" : l.deliveredAt ? "remis" : "envoyé",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ echanges, boite: receptionConfiguree() && !boiteEnPanne });
}
