import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMandats } from "@/lib/mandats-acces";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { formatEuroCents } from "@/lib/comptes";
import {
  isMandatStatus, MANDAT_STATUS_LABEL, MANDAT_CLOSED_STATUSES, lireDocuments, echeanceMandat,
  nettoyerReference,
} from "@/lib/mandats";
import { mandatChangesFromBody } from "@/lib/mandat-serialize";

/**
 * Modifie un mandat, champ par champ envoyé. La fiche enregistre d'un bloc et
 * passe tout ; un dépôt de pièce envoie le seul champ documents.
 *
 * Trois gestes écrivent une trace au journal, parce qu'ils se relisent des
 * mois plus tard : le changement de statut, la signature et les pièces
 * versées au dossier. C'est le début de la reddition de comptes.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;

  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = mandatChangesFromBody(body);

    const avant = await prisma.mandat.findUnique({
      where: { id },
      select: {
        type: true, status: true, reference: true, signedOn: true, signedAt: true,
        immediateExecution: true, startDate: true, durationDays: true,
        decidedOn: true, soldOn: true, feeFinalCents: true, vehicleId: true, documents: true,
      },
    });
    if (!avant) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });

    const author = acces.author;
    const jour = parisDay(new Date()).toISOString().slice(0, 10);

    const data: Record<string, unknown> = { ...input };
    const traces: { type: string; content: string; author: string }[] = [];

    /* ── Le contrat signé se défend tout seul ──
       La fiche garde en mémoire la situation du moment où elle a été ouverte
       et renvoie TOUT le formulaire à l'enregistrement. Une fiche restée
       ouverte pendant que le client signait de son côté ramenait donc le
       mandat en brouillon, effaçait sa date de signature et son choix
       d'exécution immédiate, puis rouvrait le bouton « Supprimer » — le
       garde-fou « un contrat signé se conserve » sautait exactement là.
       Le refus se joue ici, côté serveur : il vaut quel que soit l'onglet,
       et quelle que soit la personne. Les clôtures normales (vendu, retiré,
       échu, rétracté) restent libres. */
    const dejaSigne = avant.signedAt !== "" || avant.signedOn !== "";
    if (dejaSigne) {
      if (body.status === "brouillon" && avant.status !== "brouillon") {
        return NextResponse.json(
          {
            error:
              "Ce mandat porte une signature : il se clôt (vendu, retiré, échu, rétracté) plutôt que de revenir en brouillon.",
          },
          { status: 409 },
        );
      }
      // Une fiche ouverte AVANT la signature renvoie ces champs vides : ils
      // gardent ce que la signature a écrit.
      if (data.signedOn === "") delete data.signedOn;
      if (data.immediateExecution === false && avant.immediateExecution) delete data.immediateExecution;
    }

    // La référence se renomme tant que le mandat est un brouillon. Passé la
    // signature elle se fige : le contrat remis au client la porte, la facture
    // d'honoraires la reprend, et le registre du comptable la suit.
    if ("reference" in body) {
      const voulue = nettoyerReference(body.reference);
      if (voulue !== "" && voulue !== avant.reference) {
        if (avant.status !== "brouillon") {
          return NextResponse.json(
            { error: "Ce mandat est signé : sa référence reste celle du contrat remis au client." },
            { status: 409 },
          );
        }
        const prise = await prisma.mandat.findUnique({ where: { reference: voulue }, select: { id: true } });
        if (prise && prise.id !== id) {
          return NextResponse.json(
            { error: `La référence « ${voulue} » est déjà portée par un autre mandat.` },
            { status: 409 },
          );
        }
        data.reference = voulue;
        traces.push({ type: "note", content: `Référence changée : ${avant.reference} → ${voulue}`, author });
      }
    }

    // Prolongation : le contrat se renouvelle « par accord écrit des parties ».
    // Le geste allonge la durée et se raconte au journal ; l'écrit du client
    // (un email suffit) se verse aux pièces du dossier.
    const prolonger = Math.round(Number(body.prolongerJours) || 0);
    if (prolonger > 0 && prolonger <= 365) {
      if (avant.status !== "signe") {
        return NextResponse.json({ error: "Seul un mandat signé et en cours se prolonge." }, { status: 409 });
      }
      const duree = avant.durationDays + prolonger;
      data.durationDays = duree;
      const e = echeanceMandat(avant.startDate, duree, jour);
      traces.push({
        type: "statut",
        content: `Mandat prolongé de ${prolonger} jours par accord écrit${e ? ` (échéance au ${e.echeance})` : ""}`,
        author,
      });
    }

    // Une pièce versée au dossier se raconte : le journal dit quand le mandat
    // signé, la carte grise ou le contrôle technique sont arrivés.
    if (input.documents !== undefined) {
      const anciennes = new Set(lireDocuments(avant.documents).map((d) => d.url));
      const ajoutees = lireDocuments(String(input.documents)).filter((d) => !anciennes.has(d.url));
      for (const d of ajoutees) {
        traces.push({ type: "document", content: `Pièce versée au dossier : ${d.label}`, author });
      }
    }

    let regimePose = false;
    if (isMandatStatus(body.status) && body.status !== avant.status) {
      data.status = body.status;

      if (body.status === "signe") {
        // La signature date le contrat : le jour signé prime, le jour de
        // Paris sert de repli. La date d'effet suit si elle manquait.
        const signeLe = (typeof input.signedOn === "string" && input.signedOn) || avant.signedOn || jour;
        data.signedOn = signeLe;
        if (!avant.startDate && !input.startDate) data.startDate = signeLe;
        traces.push({ type: "statut", content: `Mandat signé (effet au ${signeLe})`, author });
        // Seule la VENTE verrouille le régime de la fiche véhicule : une
        // recherche rattachée à une fiche de stock laisse le stock tranquille.
        regimePose = avant.type === "vente" && avant.vehicleId !== null;
      } else {
        traces.push({ type: "statut", content: `Statut : ${MANDAT_STATUS_LABEL[body.status]}`, author });
      }

      // Un statut qui referme le mandat pose le jour de décision ; un retour
      // en arrière l'efface, il aurait survécu à sa raison d'être.
      if (MANDAT_CLOSED_STATUSES.includes(body.status)) {
        data.decidedOn = avant.decidedOn || jour;
        if (body.status === "vendu" && !avant.soldOn && !input.soldOn) data.soldOn = jour;
      } else {
        data.decidedOn = "";
      }
    }

    if (typeof input.soldPriceCents === "number" && input.soldPriceCents > 0 && "status" in body && body.status === "vendu") {
      traces.push({ type: "statut", content: `Vente conclue à ${formatEuroCents(input.soldPriceCents)}`, author });
    }

    const mandat = await prisma.mandat.update({
      where: { id },
      data: { ...data, ...(traces.length > 0 ? { events: { create: traces } } : {}) },
    });

    // Un mandat de vente signé sur un véhicule du stock verrouille son régime :
    // la mention « vente réalisée pour le compte d'un particulier » suit alors
    // la fiche publique et les annonces diffusées, comme la loi le demande.
    if (regimePose && avant.vehicleId) {
      const touche = await prisma.vehicle.updateMany({
        where: { id: avant.vehicleId, saleRegime: { not: "mandat-client" } },
        data: { saleRegime: "mandat-client" },
      });
      if (touche.count > 0) {
        await prisma.mandatEvent.create({
          data: { mandatId: id, type: "statut", content: "Fiche véhicule passée en régime « Mandat client »", author },
        });
      }
    }

    // Ce que le serveur a décidé revient à l'écran : la fiche repose ces
    // valeurs dans son formulaire. Sans ce retour, le champ restait vide sous
    // les yeux de l'utilisateur et le vide écrasait la valeur au prochain
    // enregistrement — la date de vente et les honoraires disparaissaient.
    return NextResponse.json({
      id: mandat.id,
      reference: mandat.reference,
      champs: {
        status: mandat.status,
        reference: mandat.reference,
        signedOn: mandat.signedOn,
        startDate: mandat.startDate,
        durationDays: mandat.durationDays,
        soldOn: mandat.soldOn,
        feeFinalCents: mandat.feeFinalCents,
        immediateExecution: mandat.immediateExecution,
      },
    });
  } catch (e) {
    // Deux renommages simultanés vers la même référence : l'index unique de la
    // base tranche, le message le dit plutôt que d'annoncer une panne.
    if (e instanceof Error && /unique/i.test(e.message) && /reference/i.test(e.message)) {
      return NextResponse.json(
        { error: "Cette référence vient d'être prise par un autre mandat." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;
  const { session } = acces;
  if (!can(asRole(session.admin.role), "delete")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    // Un contrat signé se conserve, la loi et le fisc le relisent des années
    // plus tard : seul un brouillon se supprime.
    const existant = await prisma.mandat.findUnique({ where: { id }, select: { status: true } });
    if (!existant) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });
    if (existant.status !== "brouillon") {
      return NextResponse.json(
        { error: "Ce mandat a été signé : il se clôt (retiré, échu, rétracté) et reste archivé." },
        { status: 409 },
      );
    }
    await prisma.mandat.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
