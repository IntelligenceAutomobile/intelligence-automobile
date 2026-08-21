import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMandats } from "@/lib/mandats-acces";
import { trouverClientExistant, normaliserEmail } from "@/lib/crm-intake";
import { parisDay } from "@/lib/vehicules";
import { formatNumber } from "@/lib/format";
import {
  MANDAT_TYPE_LABEL, mandatVehiculeLabel,
  mandatPrefix, prochaineReference, nettoyerReference, type MandatType,
} from "@/lib/mandats";
import { mandatFromBody, manquesAlaCreation } from "@/lib/mandat-serialize";

/** Référence proposée : MV-2026-001, une série par type, remise à 1 chaque
    année. L'année est celle de Paris : le 31 décembre au soir, un serveur en
    temps universel aurait déjà changé de série. */
async function referenceProposee(type: MandatType): Promise<string> {
  const annee = parisDay(new Date()).toISOString().slice(0, 4);
  const prefix = mandatPrefix(type, annee);
  const prises = await prisma.mandat.findMany({
    where: { reference: { startsWith: prefix } },
    select: { reference: true },
  });
  return prochaineReference(prefix, prises.map((m) => m.reference));
}

/**
 * Enregistre un mandat.
 *
 * Trois écritures liées, sur le modèle des reprises : la fiche du vendeur,
 * l'affaire commerciale qui suit la mission dans le pipeline, et le mandat.
 * Le rapprochement de client reste HORS transaction : il lit tout le carnet,
 * pas les lignes en cours d'écriture.
 */
export async function POST(req: NextRequest) {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = mandatFromBody(body);

    const manques = manquesAlaCreation(input);
    if (manques.length > 0) {
      return NextResponse.json(
        { error: `Complétez ${manques.join(", ")} avant d'enregistrer.` },
        { status: 400 },
      );
    }

    // Rattachement par email normalisé puis par les derniers chiffres du
    // téléphone : la fiche existante est retrouvée au lieu d'être dédoublée.
    const existant = await trouverClientExistant(input.ownerEmail, input.ownerPhone);

    // Une fiche retrouvée sous un autre nom mérite d'être annoncée avant
    // d'écrire quoi que ce soit.
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

    // Le rattachement à une fiche de stock arrive de la page de création
    // (« partir d'un véhicule ») : une simple trace, jamais une relation.
    const vehicleId = typeof body.vehicleId === "string" && body.vehicleId.trim() !== "" ? body.vehicleId : null;

    const author = acces.author;
    const jour = parisDay(new Date()).toISOString().slice(0, 10);
    const titre = `${MANDAT_TYPE_LABEL[input.type]} ${mandatVehiculeLabel(input)}`;

    // La référence se calcule AVANT la transaction : une lecture hors du
    // contexte transactionnel pendant qu'il tient la connexion se bloquerait
    // elle-même sur SQLite.
    //
    // Celle saisie à la main prime sur la proposition : un dossier se retient
    // parfois mieux sous le nom du client que sous un numéro. La collision se
    // vérifie ici pour pouvoir la dire clairement, l'index unique de la base
    // restant le dernier mot en cas de simultanéité.
    const voulue = nettoyerReference(body.reference);
    const reference = voulue || (await referenceProposee(input.type));
    if (voulue) {
      const prise = await prisma.mandat.findUnique({ where: { reference: voulue }, select: { id: true } });
      if (prise) {
        return NextResponse.json(
          { error: `La référence « ${voulue} » est déjà portée par un autre mandat.` },
          { status: 409 },
        );
      }
    }

    const mandat = await prisma.$transaction(async (tx) => {
      let clientId: string;
      if (existant) {
        await tx.client.update({
          where: { id: existant.id },
          data: {
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
            email: normaliserEmail(input.ownerEmail),
            phone: input.ownerPhone,
            lastActivityAt: new Date(),
          },
        });
        clientId = cree.id;
      }

      // L'affaire commerciale suit la mission dans le pipeline, avec la source
      // du service concerné. Son budget reste vide : les honoraires du mandat
      // se lisent sur le mandat.
      const lead = await tx.lead.create({
        data: {
          clientId,
          source: input.type === "vente" ? "aide-vente" : "recherche-perso",
          stage: "nouveau",
          title: titre.slice(0, 120),
          events: {
            create: [
              { type: "creation", content: "Mandat créé", author },
              { type: "note", content: resumeLisible(input), author },
            ],
          },
        },
      });

      return tx.mandat.create({
        data: {
          ...input,
          reference,
          status: "brouillon",
          clientId,
          leadId: lead.id,
          vehicleId,
          // La date d'effet se pose dès la création : c'est elle qui porte
          // l'échéance, et une colonne vide ferait passer le mandat pour
          // éternel.
          startDate: input.startDate || jour,
          author,
          events: { create: [{ type: "creation", content: "Mandat créé", author }] },
        },
      });
    });

    return NextResponse.json({ id: mandat.id, reference: mandat.reference, clientId: mandat.clientId });
  } catch (e) {
    // Deux enregistrements simultanés tombent sur la même référence : la
    // numérotation lit puis écrit sans verrou. Le message le dit, plutôt que de
    // renvoyer une panne muette.
    if (e instanceof Error && /unique/i.test(e.message) && /reference/i.test(e.message)) {
      return NextResponse.json(
        { error: "Cette référence vient d'être prise par un autre mandat. Réessayez ou choisissez la vôtre." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}

/** Résumé du mandat, déposé dans le journal de l'affaire commerciale. */
function resumeLisible(input: ReturnType<typeof mandatFromBody>): string {
  const lignes = [
    mandatVehiculeLabel(input),
    [
      input.mileageKm > 0 ? `${formatNumber(input.mileageKm)} km` : "",
      input.fuel,
      input.plate,
    ].filter(Boolean).join(" · "),
    input.priceCents > 0 ? `Prix affiché : ${formatNumber(Math.round(input.priceCents / 100))} €` : "",
    input.floorCents > 0 ? `Prix plancher net vendeur : ${formatNumber(Math.round(input.floorCents / 100))} €` : "",
    input.budgetCents > 0 ? `Budget d'achat : ${formatNumber(Math.round(input.budgetCents / 100))} €` : "",
    input.feeCents > 0 ? `Honoraires convenus : ${formatNumber(Math.round(input.feeCents / 100))} €` : "",
    input.listingUrl ? `Annonce repérée : ${input.listingUrl}` : "",
    input.notes,
  ];
  return lignes.filter(Boolean).join("\n");
}
