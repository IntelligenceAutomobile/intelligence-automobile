import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { parisDay } from "@/lib/vehicules";
import {
  assessMarge, isRepriseFilter, isRepriseStatus, repriseLabel, repriseSearchText, validite,
} from "@/lib/reprises";
import ReprisesClient, { type RepriseRow, type Pilotage } from "./ReprisesClient";

// La page charge les 80 estimations les plus récentes et annonce le reste.
// Le carnet clients pose la même borne, pour la même raison : une liste qui
// charge tout finit par mettre plusieurs secondes à s'afficher, alors que la
// recherche sert de porte d'entrée bien avant la centième ligne.
const LIGNES_AFFICHEES = 80;

// Fenêtre des chiffres de pilotage : assez large pour lisser un mois creux,
// assez courte pour parler de l'activité d'aujourd'hui.
const JOURS_PILOTAGE = 90;

export default async function ReprisesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;

  // Jour civil à Paris : le runtime tourne en UTC, et une offre saisie le soir
  // gagnerait sinon un jour d'ancienneté, définitivement.
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const debutFenetre = new Date(Date.parse(`${today}T00:00:00Z`) - JOURS_PILOTAGE * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [reprises, total, ouvertes, conclues] = await Promise.all([
    // Classement sur la date de l'offre : une estimation de mars rouverte ce
    // matin restait sinon en tête, avec la mention « il y a 2 min ».
    prisma.reprise.findMany({
      orderBy: [{ offerDate: "desc" }, { createdAt: "desc" }],
      take: LIGNES_AFFICHEES,
      // L'état constaté, les notes et les photos restent en base : la liste ne
      // les affiche pas, et les transporter alourdirait chaque chargement.
      select: {
        id: true, reference: true, status: true, clientId: true,
        make: true, model: true, version: true, year: true,
        plate: true, vin: true, mileageKm: true, fuel: true,
        ownerName: true, ownerCompany: true,
        resaleCents: true, reconditionCents: true, offerCents: true,
        offerDate: true, validityDays: true, nextActionAt: true, createdAt: true,
      },
    }),
    prisma.reprise.count(),
    // Les chiffres de pilotage se calculent sur TOUTE la table, jamais sur les
    // 80 lignes chargées : au-delà, « 87 400 € en attente » deviendrait faux
    // sans que rien le signale.
    prisma.reprise.findMany({
      where: { status: { in: ["brouillon", "proposee"] } },
      select: { offerCents: true, offerDate: true, validityDays: true },
    }),
    prisma.reprise.findMany({
      where: { decidedOn: { gte: debutFenetre }, status: { in: ["acceptee", "refusee", "au_stock"] } },
      select: { status: true, resaleCents: true, reconditionCents: true, offerCents: true },
    }),
  ]);

  // Une seule heure de référence pour toute la page, comme le carnet clients.
  const maintenant = new Date();

  const lignes: RepriseRow[] = reprises.map((r) => {
    const v = validite(r.offerDate, r.validityDays, today);
    const marge = assessMarge(r);
    return {
      id: r.id,
      reference: r.reference,
      status: isRepriseStatus(r.status) ? r.status : "brouillon",
      clientId: r.clientId,
      vehicule: repriseLabel(r),
      vendeur: r.ownerCompany || r.ownerName,
      plate: r.plate,
      mileageKm: r.mileageKm,
      fuel: r.fuel,
      offerCents: r.offerCents,
      margeNetteCents: marge ? marge.netCents : null,
      margeTone: marge ? marge.tone : null,
      // La validité voyage déjà calculée : le composant client cesse de faire
      // du métier, et le jour de référence reste celui du serveur.
      expiree: v ? v.expiree : false,
      expirationProche: v ? v.proche : false,
      phraseValidite: v ? v.phrase : "",
      rappelDu: r.nextActionAt !== "" && r.nextActionAt <= today,
      // Le texte de recherche s'assemble ici : la ligne le porte tout prêt,
      // plutôt que de le recomposer à chaque frappe dans le navigateur.
      texteRecherche: repriseSearchText(r),
      anciennete: timeAgo((r.offerDate ? new Date(`${r.offerDate}T12:00:00Z`) : r.createdAt).toISOString(), maintenant),
    };
  });

  let enAttenteCents = 0;
  let aRelancer = 0;
  let echues = 0;
  for (const r of ouvertes) {
    enAttenteCents += r.offerCents;
    const v = validite(r.offerDate, r.validityDays, today);
    if (v?.expiree) {
      echues++;
      aRelancer++;
    } else if (v?.proche) {
      aRelancer++;
    }
  }

  let acheteCents = 0;
  let margePrevueCents = 0;
  let acceptees = 0;
  for (const r of conclues) {
    if (r.status === "refusee") continue;
    acheteCents += r.offerCents;
    acceptees++;
    const m = assessMarge(r);
    if (m) margePrevueCents += m.netCents;
  }

  const pilotage: Pilotage = {
    enAttenteCents,
    enAttente: ouvertes.length,
    aRelancer,
    echues,
    acheteCents,
    acceptees,
    margePrevueCents,
    conclues: conclues.length,
    jours: JOURS_PILOTAGE,
  };

  return (
    <ReprisesClient
      reprises={lignes}
      total={total}
      pilotage={pilotage}
      filtreInitial={isRepriseFilter(sp.statut) ? sp.statut : "all"}
      rechercheInitiale={typeof sp.q === "string" ? sp.q : ""}
    />
  );
}
