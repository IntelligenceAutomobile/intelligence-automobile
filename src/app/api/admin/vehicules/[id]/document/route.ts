import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { emptyQuote, brandingFromTheme, mergeBranding, nextNumber, quotePrefix, type QuoteItem } from "@/lib/devis";
import { quoteToData } from "@/lib/quote-serialize";
import { parisDay } from "@/lib/vehicules";
import { formatNumber } from "@/lib/format";
import { loadStockForQuotes } from "@/lib/devis-stock";
import { convertQuoteToFacture } from "@/lib/devis-facture";

// Crée un devis (ou directement une facture) depuis une fiche du stock : la
// ligne de vente au prix affiché, l'encart véhicule figé (plaque, numéro de
// série, kilométrage) et le client choisi. La facture passe par le même devis
// puis par la conversion commune : mêmes contrôles, même numérotation, même
// réservation du véhicule que depuis l'écran des devis.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const docType = body.docType === "facture" ? "facture" : "devis";

    // La même source que l'éditeur de devis : fiche commerciale + identité
    // administrative (numéro de série, plaque, 1re mise en circulation).
    const vehicle = (await loadStockForQuotes()).find((v) => v.id === id);
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });

    // Le client : une fiche CRM existante, ou une nouvelle fiche créée avec le
    // nom saisi, pour que le suivi commercial parte du bon endroit.
    let clientId: string | null = null;
    let clientName = "";
    let clientCompany = "";
    let clientEmail = "";
    let clientPhone = "";
    let leadId: string | null = null;

    if (typeof body.clientId === "string" && body.clientId) {
      const fiche = await prisma.client.findUnique({ where: { id: body.clientId } });
      if (!fiche) return NextResponse.json({ error: "Fiche client introuvable." }, { status: 404 });
      clientId = fiche.id;
      clientName = fiche.name;
      clientCompany = fiche.company;
      clientEmail = fiche.email;
      clientPhone = fiche.phone;
      // Le document se rattache à l'opportunité qu'il fait avancer, quand elle
      // ne fait aucun doute (même règle que la page « Nouveau devis »).
      const ouvertes = await prisma.lead.findMany({
        where: { clientId: fiche.id, stage: { notIn: ["gagne", "perdu"] } },
        select: { id: true },
        take: 2,
      });
      if (ouvertes.length === 1) leadId = ouvertes[0].id;
    } else {
      const name = String(body.clientName ?? "").trim();
      if (!name) return NextResponse.json({ error: "Choisissez un client ou saisissez son nom." }, { status: 400 });
      const fiche = await prisma.client.create({ data: { name, lastActivityAt: new Date() } });
      clientId = fiche.id;
      clientName = fiche.name;
    }

    // Numéro, identité de marque et mise en page : les mêmes règles que la
    // page « Nouveau devis ».
    const year = new Date().getFullYear();
    const [taken, last, brandTheme] = await Promise.all([
      prisma.quote.findMany({ where: { number: { startsWith: quotePrefix(year) } }, select: { number: true } }),
      prisma.quote.findFirst({ orderBy: { updatedAt: "desc" }, select: { branding: true } }),
      prisma.brandTheme.findUnique({ where: { id: "default" } }),
    ]);
    let lastBranding: unknown = {};
    try {
      lastBranding = JSON.parse(last?.branding ?? "{}");
    } catch {
      /* ignore */
    }

    const number = nextNumber(quotePrefix(year), taken.map((q) => q.number));
    const issueDate = parisDay(new Date()).toISOString().slice(0, 10);
    const quote = emptyQuote(number, issueDate, brandingFromTheme(brandTheme, mergeBranding(lastBranding)), "vehicule");

    quote.clientId = clientId;
    quote.leadId = leadId;
    quote.clientName = clientName;
    quote.clientCompany = clientCompany;
    quote.clientEmail = clientEmail;
    quote.clientPhone = clientPhone;

    // La ligne de vente et l'encart véhicule, tels que l'éditeur les pose
    // quand on prend une voiture au stock.
    const detail = [
      vehicle.year ? `${vehicle.year}` : null,
      vehicle.mileage ? `${formatNumber(vehicle.mileage)} km` : null,
      vehicle.fuel,
      vehicle.transmission,
      vehicle.power ? `${vehicle.power} ch` : null,
    ].filter(Boolean).join(" · ");
    const item: QuoteItem = {
      id: "it_stock",
      designation: `${vehicle.make} ${vehicle.model}`,
      detail,
      qty: 1,
      unitPrice: vehicle.price || 0,
      vehicleId: vehicle.id,
    };
    quote.items = [item];
    quote.vehicleId = vehicle.id;
    quote.vehicle = {
      show: true,
      label: `${vehicle.make} ${vehicle.model}${vehicle.year ? ` — ${vehicle.year}` : ""}`,
      vin: vehicle.vin,
      plate: vehicle.plate,
      firstRegDate: vehicle.firstRegDate,
      mileageKm: vehicle.mileage ?? 0,
      energy: [vehicle.fuel, vehicle.transmission].filter(Boolean).join(" · "),
      color: vehicle.color,
      origin: vehicle.origin,
      photoUrl: vehicle.photoUrl,
    };

    const created = await prisma.quote.create({ data: quoteToData(quote as unknown as Record<string, unknown>) });

    if (docType === "devis") {
      return NextResponse.json({ devisId: created.id, number: created.number });
    }

    // Facture demandée : la conversion commune s'applique. Si un élément
    // obligatoire manque (montant, TVA intracommunautaire…), le devis
    // pré-rempli reste là, prêt à compléter : la réponse le dit.
    const result = await convertQuoteToFacture(created, "complete");
    if (!result.ok) {
      return NextResponse.json({ devisId: created.id, number: created.number, manque: result.error });
    }
    return NextResponse.json({ devisId: created.id, factureId: result.id, number: result.number });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création du document." }, { status: 500 });
  }
}
