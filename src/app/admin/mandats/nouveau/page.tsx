import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { voitMandats } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { isMandatType } from "@/lib/mandats";
import { mandatVierge, type MandatForm } from "@/lib/mandat-form";
import MandatFiche from "../[id]/MandatFiche";

// Saisie d'un mandat, sur une page à son adresse à elle.
//
// La page sait partir d'un véhicule du stock (?vehicule=…) ou d'une fiche
// client (?client=…) : les champs correspondants arrivent pré-remplis, figés
// ensuite dans le contrat. Le type (?type=vente|recherche|import) vient de la
// palette de commandes ; sans lui, la vente reste le point de départ.
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
  const mandat: MandatForm = mandatVierge(today, isMandatType(sp.type) ? sp.type : "vente");

  // Le stock connaît la voiture : marque, kilométrage, prix affiché. La
  // plaque, le numéro de série et la première mise en circulation restent à
  // saisir, la fiche publique ne les porte pas.
  if (sp.vehicule) {
    const v = await prisma.vehicle.findUnique({
      where: { id: sp.vehicule },
      select: { id: true, make: true, model: true, mileage: true, fuel: true, color: true, price: true, power: true },
    });
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
    const c = await prisma.client.findUnique({
      where: { id: sp.client },
      select: { name: true, email: true, phone: true },
    });
    if (c) {
      mandat.ownerName = c.name;
      mandat.ownerEmail = c.email;
      mandat.ownerPhone = c.phone;
    }
  }

  return <MandatFiche mandat={mandat} mode="creation" canDelete={false} today={today} />;
}
