import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { voitMandats } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import {
  MANDAT_TYPES, isMandatType, mandatPrefix, prochaineReference, type MandatType,
} from "@/lib/mandats";
import { listesMandat, repereMandat, clientsPourMandat, vehiculesPourMandat } from "@/lib/mandat-listes";
import { mandatVierge, type MandatForm } from "@/lib/mandat-form";
import MandatFiche from "../[id]/MandatFiche";

// Saisie d'un mandat, sur une page à son adresse à elle.
//
// La page arrive préremplie de tout ce que la maison sait déjà : la référence
// suivante de la série, les repères qui ne changent pas d'un contrat à l'autre
// (assurance, ville de signature, formule d'honoraires), et les listes de
// valeurs déjà saisies ailleurs, proposées sous les champs. Elle sait aussi
// partir d'un véhicule du stock (?vehicule=…) ou d'une fiche client
// (?client=…). Le type (?type=vente|recherche|import) vient de la palette de
// commandes ; sans lui, la vente reste le point de départ.
export default async function NouveauMandatPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicule?: string; client?: string; type?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Lancement nominatif du 21 août 2026 : Fab, puis César à 16 h.
  const collab = await getCollabSession();
  if (!voitMandats(session.admin.email, collab?.name)) redirect("/admin");

  const sp = await searchParams;

  // Jour civil à Paris : le runtime tourne en UTC, et un mandat saisi le soir
  // perdrait sinon un jour d'échéance, définitivement.
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const type: MandatType = isMandatType(sp.type) ? sp.type : "vente";
  const mandat: MandatForm = mandatVierge(today, type);

  const [toutes, listes, repere, clients, vehicules] = await Promise.all([
    prisma.mandat.findMany({ select: { reference: true } }),
    listesMandat(),
    repereMandat(type),
    clientsPourMandat(),
    vehiculesPourMandat(),
  ]);

  // La référence proposée pour CHAQUE type : le formulaire laisse changer de
  // type sans repasser par le serveur, et la proposition suit. Une référence
  // écrite à la main, elle, reste telle quelle.
  const annee = today.slice(0, 4);
  const refs = toutes.map((m) => m.reference);
  const suggestions = Object.fromEntries(
    MANDAT_TYPES.map((t) => [t, prochaineReference(mandatPrefix(t, annee), refs)]),
  ) as Record<MandatType, string>;
  mandat.reference = suggestions[type];

  // Ce qui se répète d'un contrat au suivant : écrit une fois, repris ensuite.
  mandat.rcPolicy = repere.rcPolicy;
  mandat.rcInsurer = repere.rcInsurer;
  mandat.signPlace = repere.signPlace;
  mandat.feeFormula = repere.feeFormula;
  mandat.custody = repere.custody;
  mandat.durationDays = String(repere.durationDays);

  // Le stock connaît la voiture : marque, kilométrage, prix affiché. La
  // plaque, le numéro de série et la première mise en circulation restent à
  // saisir, la fiche publique ne les porte pas.
  if (sp.vehicule) {
    const v = vehicules.find((x) => x.id === sp.vehicule);
    if (v) {
      mandat.vehicleId = v.id;
      mandat.make = v.make;
      mandat.model = v.model;
      mandat.mileageKm = v.mileage > 0 ? String(v.mileage) : "";
      mandat.fuel = v.fuel;
      mandat.color = v.color;
      mandat.priceEuros = v.price > 0 ? String(v.price) : "";
      mandat.power = v.power ? `${v.power} ch` : "";
    }
  }

  if (sp.client) {
    const c = clients.find((x) => x.id === sp.client);
    if (c) {
      mandat.clientId = c.id;
      mandat.ownerName = c.company || c.name;
      mandat.ownerEmail = c.email;
      mandat.ownerPhone = c.phone;
    }
  }

  return (
    <MandatFiche
      mandat={mandat}
      mode="creation"
      canDelete={false}
      today={today}
      createdOn={today}
      suggestions={suggestions}
      listes={listes}
      clients={clients}
      vehicules={vehicules}
    />
  );
}
