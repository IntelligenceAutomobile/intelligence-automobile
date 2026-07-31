import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { isRepriseFilter, isRepriseStatus, repriseLabel, repriseSearchText } from "@/lib/reprises";
import ReprisesClient, { type RepriseRow } from "./ReprisesClient";

// La page charge les 80 estimations les plus récentes et annonce le reste.
// Le carnet clients pose la même borne, pour la même raison : une liste qui
// charge tout finit par mettre plusieurs secondes à s'afficher, alors que la
// recherche sert de porte d'entrée bien avant la centième ligne.
const LIGNES_AFFICHEES = 80;

export default async function ReprisesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;

  const [reprises, total] = await Promise.all([
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
        offerCents: true, offerDate: true, createdAt: true,
      },
    }),
    prisma.reprise.count(),
  ]);

  // Une seule heure de référence pour toute la page, comme le carnet clients.
  const maintenant = new Date();

  const lignes: RepriseRow[] = reprises.map((r) => ({
    id: r.id,
    reference: r.reference,
    status: isRepriseStatus(r.status) ? r.status : "brouillon",
    clientId: r.clientId,
    vehicule: repriseLabel(r),
    vendeur: r.ownerCompany || r.ownerName,
    plate: r.plate,
    vin: r.vin,
    make: r.make,
    model: r.model,
    version: r.version,
    mileageKm: r.mileageKm,
    fuel: r.fuel,
    offerCents: r.offerCents,
    offerDate: r.offerDate,
    // Le texte de recherche s'assemble ici : la ligne le porte tout prêt,
    // plutôt que de le recomposer à chaque frappe dans le navigateur.
    texteRecherche: repriseSearchText(r),
    anciennete: timeAgo((r.offerDate ? new Date(`${r.offerDate}T12:00:00Z`) : r.createdAt).toISOString(), maintenant),
  }));

  return (
    <ReprisesClient
      reprises={lignes}
      total={total}
      filtreInitial={isRepriseFilter(sp.statut) ? sp.statut : "all"}
      rechercheInitiale={typeof sp.q === "string" ? sp.q : ""}
    />
  );
}
