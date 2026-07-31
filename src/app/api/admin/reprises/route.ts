import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { trouverClientExistant, normaliserEmail } from "@/lib/crm-intake";
import { parisDay } from "@/lib/vehicules";
import { formatNumber } from "@/lib/format";
import { repriseLabel, VALIDITE_JOURS_DEFAUT } from "@/lib/reprises";
import { repriseFromBody, manquesAlaCreation } from "@/lib/reprise-serialize";

/** Référence lisible de l'estimation : REP-2026-014, remise à 1 chaque année. */
async function nextReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REP-${year}-`;
  const last = await prisma.reprise.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isFinite(seq) ? seq : 0) + 1).padStart(3, "0")}`;
}

/**
 * Enregistre une estimation de reprise.
 *
 * Trois écritures liées : la fiche du vendeur, l'affaire commerciale qui la
 * suit dans le pipeline, et l'estimation elle-même. Elles voyagent dans une
 * transaction en forme de fonction, la forme tableau construisant toutes les
 * promesses avant de connaître les identifiants dont elles ont besoin.
 *
 * Le rapprochement de client reste HORS transaction : il lit tout le carnet,
 * pas les lignes en cours d'écriture.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = repriseFromBody(body);

    const manques = manquesAlaCreation(input);
    if (manques.length > 0) {
      return NextResponse.json(
        { error: `Complétez ${manques.join(", ")} avant d'enregistrer.` },
        { status: 400 },
      );
    }

    // Rattachement par email normalisé puis par les derniers chiffres du
    // téléphone : « Jean.Dupont@Gmail.com » et « +33 6 12 34 56 78 » retrouvent
    // la fiche existante, au lieu de la dédoubler.
    const existant = await trouverClientExistant(input.ownerEmail, input.ownerPhone);

    // Une fiche retrouvée sous un autre nom mérite d'être annoncée : le vendeur
    // croyait créer « Martin Dupont » et atterrissait sur « Garage Leblanc »,
    // sans que rien le dise.
    if (existant && !body.forcerRattachement) {
      const memeNom =
        existant.name.trim().toLowerCase() === input.ownerName.toLowerCase() ||
        existant.company.trim().toLowerCase() === input.ownerName.toLowerCase();
      if (!memeNom) {
        return NextResponse.json(
          {
            error: "Une fiche client proche existe déjà.",
            doublon: {
              id: existant.id,
              name: existant.company || existant.name,
              email: existant.email,
              phone: existant.phone,
            },
          },
          { status: 409 },
        );
      }
    }

    const collab = await getCollabSession();
    const author = collab?.name ?? session.admin.email ?? "";
    const jour = parisDay(new Date()).toISOString().slice(0, 10);
    const titre = `Reprise ${repriseLabel(input)}`;
    // La référence se calcule AVANT la transaction : une lecture hors du
    // contexte transactionnel pendant qu'il tient la connexion se bloquerait
    // elle-même sur SQLite.
    const reference = await nextReference();

    const reprise = await prisma.$transaction(async (tx) => {
      let clientId: string;
      if (existant) {
        // Une fiche connue se complète de ce qui lui manquait, sans rien
        // écraser. La date d'activité remonte, sinon le vendeur évalué le matin
        // tombe en fin de carnet et devient introuvable le soir.
        await tx.client.update({
          where: { id: existant.id },
          data: {
            company: existant.company || input.ownerCompany,
            email: existant.email || normaliserEmail(input.ownerEmail),
            phone: existant.phone || input.ownerPhone,
            lastActivityAt: new Date(),
          },
        });
        clientId = existant.id;
      } else {
        const cree = await tx.client.create({
          data: {
            name: input.ownerName,
            company: input.ownerCompany,
            email: normaliserEmail(input.ownerEmail),
            phone: input.ownerPhone,
            lastActivityAt: new Date(),
          },
        });
        clientId = cree.id;
      }

      // L'affaire commerciale reste écrite : le pipeline, le compteur du
      // tableau de bord et le flux d'activité continuent d'être alimentés.
      // Son budget reste vide, lui : une reprise est de l'argent qui sort, et
      // l'additionner au pipeline de vente faussait les compteurs de la page
      // Clients. Le montant vit sur l'estimation, où il a un sens.
      // Le résumé déposé en note donne à la fiche client de quoi se relire
      // sans ouvrir l'estimation.
      const lead = await tx.lead.create({
        data: {
          clientId,
          source: "reprise",
          stage: "nouveau",
          title: titre.slice(0, 120),
          events: {
            create: [
              { type: "creation", content: "Estimation de reprise créée", author },
              { type: "note", content: resumeLisible(input), author },
            ],
          },
        },
      });

      return tx.reprise.create({
        data: {
          ...input,
          reference,
          status: "brouillon",
          clientId,
          leadId: lead.id,
          // La date d'offre se pose dès la création : c'est elle qui classe la
          // liste, et une colonne vide ferait plonger toutes les estimations
          // reprises en bas du tableau.
          offerDate: input.offerDate || jour,
          validityDays: input.validityDays || VALIDITE_JOURS_DEFAUT,
          author,
          events: { create: [{ type: "creation", content: "Estimation créée", author }] },
        },
      });
    });

    return NextResponse.json({ id: reprise.id, reference: reprise.reference, clientId: reprise.clientId });
  } catch (e) {
    // Deux enregistrements simultanés tombent sur la même référence : la
    // numérotation lit puis écrit sans verrou. Le message le dit, plutôt que de
    // renvoyer une panne muette.
    if (e instanceof Error && /unique/i.test(e.message) && /reference/i.test(e.message)) {
      return NextResponse.json(
        { error: "Une autre estimation vient d'être créée. Réessayez." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}

/** Résumé de l'évaluation, déposé dans le journal de l'affaire commerciale. */
function resumeLisible(input: ReturnType<typeof repriseFromBody>): string {
  const lignes = [
    repriseLabel(input),
    [
      input.mileageKm > 0 ? `${formatNumber(input.mileageKm)} km` : "",
      input.fuel,
      input.transmission,
      input.plate,
    ].filter(Boolean).join(" · "),
    input.condition ? `État : ${input.condition}` : "",
    input.notes,
  ];
  return lignes.filter(Boolean).join("\n");
}
