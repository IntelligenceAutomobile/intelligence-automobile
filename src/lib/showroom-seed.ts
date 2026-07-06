// Graine de l'instance SHOWROOM : remet les données de démonstration à neuf.
// Utilisée par scripts/setup-showroom.mts (création initiale) et par
// /api/admin/showroom-reset (bouton « Réinitialiser la démo », gardé par
// l'env SHOWROOM=1 — ne touche JAMAIS la base réelle).
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import fixtures from "./showroom-fixtures.json";

export const SHOWROOM_ADMIN = { email: "demo@showroom.fr", password: "demo2026" };

function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

export async function seedShowroom(prisma: PrismaClient) {
  /* ── Purge des données métier (l'admin et les sessions restent) ── */
  await prisma.leadEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.collabComment.deleteMany();
  await prisma.collabNote.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.vehicleCost.deleteMany();
  await prisma.vehicleNote.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.vehicle.deleteMany();

  /* ── Comptes de démonstration : un patron + un gestionnaire + un vendeur ── */
  const passwordHash = await bcrypt.hash(SHOWROOM_ADMIN.password, 10);
  await prisma.adminUser.upsert({
    where: { email: SHOWROOM_ADMIN.email },
    create: { email: SHOWROOM_ADMIN.email, passwordHash, role: "patron" },
    update: { passwordHash, role: "patron" },
  });
  for (const u of [
    { email: "gestion@showroom.fr", role: "gestionnaire" },
    { email: "vendeur@showroom.fr", role: "vendeur" },
  ]) {
    await prisma.adminUser.upsert({
      where: { email: u.email },
      create: { email: u.email, passwordHash, role: u.role },
      update: { role: u.role },
    });
  }

  /* ── Thème : lien Google de démo (pour les invitations d'avis) ── */
  await prisma.brandTheme.upsert({
    where: { id: "default" },
    create: { id: "default", reviewLink: "https://g.page/r/intelligence-automobile-demo/review" },
    update: { reviewLink: "https://g.page/r/intelligence-automobile-demo/review" },
  });

  /* ── Stock : catalogue réaliste issu des fixtures ── */
  const statuses = ["disponible", "disponible", "disponible", "disponible", "reserve", "vendu"];
  const vehicleIds: string[] = [];
  for (let i = 0; i < fixtures.vehicles.length; i++) {
    const f = fixtures.vehicles[i];
    const v = await prisma.vehicle.create({
      data: {
        ...f,
        status: statuses[i] ?? "disponible",
        isPublished: true,
        createdAt: daysAgo(75 - i * 12),
      },
    });
    vehicleIds.push(v.id);
  }

  /* ── Suivi véhicule : frais (→ marge) + journal d'enquête ── */
  if (vehicleIds[0]) {
    await prisma.vehicleCost.createMany({
      data: [
        { vehicleId: vehicleIds[0], category: "achat", label: "Achat au négociant", amountCents: 2650000, date: dayKey(-70) },
        { vehicleId: vehicleIds[0], category: "transport", label: "Convoyage depuis l'Allemagne", amountCents: 68000, date: dayKey(-68) },
        { vehicleId: vehicleIds[0], category: "preparation", label: "Préparation esthétique + polish", amountCents: 42000, date: dayKey(-60) },
        { vehicleId: vehicleIds[0], category: "controle", label: "Contrôle technique", amountCents: 8500, date: dayKey(-58) },
      ],
    });
    await prisma.vehicleNote.createMany({
      data: [
        { vehicleId: vehicleIds[0], type: "probleme", content: "Petit à-coup sur la boîte de vitesses à froid, à faire vérifier avant mise en vente.", resolved: true, author: "Fab", createdAt: daysAgo(65) },
        { vehicleId: vehicleIds[0], type: "solution", content: "Vidange boîte faite chez le partenaire, plus aucun à-coup. RAS.", author: "Fab", createdAt: daysAgo(59) },
        { vehicleId: vehicleIds[0], type: "admin", content: "Carte grise reçue, Car-Pass à jour. Dossier complet.", author: "Julie", createdAt: daysAgo(57) },
      ],
    });
  }
  if (vehicleIds[1]) {
    await prisma.vehicleCost.createMany({
      data: [
        { vehicleId: vehicleIds[1], category: "achat", label: "Reprise client", amountCents: 1850000, date: dayKey(-40) },
        { vehicleId: vehicleIds[1], category: "carrosserie", label: "Retouche pare-chocs arrière (sous-traité)", amountCents: 32000, date: dayKey(-35) },
      ],
    });
    await prisma.vehicleNote.create({
      data: { vehicleId: vehicleIds[1], type: "probleme", content: "Rayure sur jante avant droite à faire rénover.", resolved: false, author: "Thomas", createdAt: daysAgo(20) },
    });
  }

  /* ── Clients + pipeline de leads ── */
  const seedClients: {
    name: string; company: string; email: string; phone: string;
    lead: { title: string; stage: string; source: string; budget?: number; vehicleIdx?: number; ageDays: number; note?: string };
  }[] = [
    {
      name: "Sophie Laurent", company: "", email: "sophie.laurent@gmail.com", phone: "07 81 42 63 55",
      lead: { title: "Recherche SUV hybride familial", stage: "nouveau", source: "site-contact", budget: 35000, ageDays: 0.1, note: "Bonjour, je cherche un SUV hybride récent, budget 35 000 €, plutôt gris ou noir." },
    },
    {
      name: "Jean Martin", company: "Garage Martin & Fils", email: "j.martin@garage-martin.fr", phone: "06 12 34 56 78",
      lead: { title: "Recherche Audi TT S-line", stage: "contacte", source: "telephone", budget: 26000, vehicleIdx: 1, ageDays: 2, note: "Rappelé ce matin : très intéressé, souhaite un essai ce week-end." },
    },
    {
      name: "Amélie Rousseau", company: "", email: "amelie.rousseau@outlook.fr", phone: "06 45 88 12 30",
      lead: { title: "Essai prévu — coupé essence", stage: "rdv", source: "recherche-perso", budget: 22000, vehicleIdx: 2, ageDays: 4, note: "Essai confirmé, vient avec son mari. Prévoir la carte grise et le carnet." },
    },
    {
      name: "Marc Dubois", company: "TransCar SPRL", email: "m.dubois@transcar.be", phone: "+32 475 11 22 33",
      lead: { title: "Devis envoyé — attente retour", stage: "devis_envoye", source: "manuel", budget: 21000, vehicleIdx: 3, ageDays: 6, note: "Devis 2026-041 envoyé hier. Relance prévue vendredi si pas de nouvelles." },
    },
    {
      name: "Karim Benali", company: "", email: "k.benali@gmail.com", phone: "06 20 15 78 41",
      lead: { title: "Vente conclue — Megane RS", stage: "gagne", source: "site-contact", vehicleIdx: 5, ageDays: 12, note: "Livraison effectuée. Client ravi, pense à nous pour la voiture de sa femme." },
    },
  ];

  const clientIds: string[] = [];
  for (const c of seedClients) {
    const created = await prisma.client.create({
      data: {
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        createdAt: daysAgo(c.lead.ageDays + 1),
        leads: {
          create: {
            title: c.lead.title,
            stage: c.lead.stage,
            source: c.lead.source,
            budget: c.lead.budget ?? null,
            vehicleId: c.lead.vehicleIdx != null ? vehicleIds[c.lead.vehicleIdx] ?? null : null,
            createdAt: daysAgo(c.lead.ageDays),
            events: {
              create: [
                { type: "creation", content: "Lead créé", author: "Site web", createdAt: daysAgo(c.lead.ageDays) },
                ...(c.lead.note ? [{ type: "note", content: c.lead.note, author: "Julie", createdAt: daysAgo(Math.max(0, c.lead.ageDays - 1)) }] : []),
              ],
            },
          },
        },
      },
    });
    clientIds.push(created.id);
  }

  /* ── Reprise : estimation d'un véhicule client (lead source=reprise) ── */
  if (clientIds[0]) {
    await prisma.lead.create({
      data: {
        clientId: clientIds[0],
        source: "reprise",
        stage: "nouveau",
        title: "Reprise Peugeot 3008 (2019)",
        budget: 16500,
        createdAt: daysAgo(3),
        events: {
          create: [
            { type: "creation", content: "Estimation de reprise créée", author: "Julie", createdAt: daysAgo(3) },
            {
              type: "note",
              content: "Peugeot 3008 (2019)\n78 000 km · Diesel · Automatique\nÉtat : bon état général, léger impact pare-chocs arrière\nEstimation proposée : 16 500 €",
              author: "Julie",
              createdAt: daysAgo(3),
            },
          ],
        },
      },
    });
  }

  /* ── Planning : semaine vivante ── */
  await prisma.appointment.createMany({
    data: [
      { date: dayKey(0), startMin: 10 * 60, durationMin: 60, type: "essai", title: "Essai TT S-line", person: "Julie", clientId: clientIds[2], vehicleId: vehicleIds[2] ?? null },
      { date: dayKey(0), startMin: 15 * 60, durationMin: 180, type: "indispo", title: "RDV perso", person: "Julie" },
      { date: dayKey(1), startMin: 9 * 60, durationMin: 120, type: "preparation", title: "Préparation esthétique", vehicleId: vehicleIds[0] ?? null, person: "Thomas" },
      { date: dayKey(1), startMin: 14 * 60, durationMin: 90, type: "livraison", title: "Livraison client", clientId: clientIds[4], vehicleId: vehicleIds[5] ?? null, person: "Thomas" },
      { date: dayKey(2), startMin: 9 * 60 + 30, durationMin: 60, type: "ct", title: "Contrôle technique", vehicleId: vehicleIds[3] ?? null, person: "Thomas" },
    ],
  });

  /* ── Devis ── */
  const year = new Date().getFullYear();
  const quoteBase = {
    kind: "vehicule",
    tvaMode: "marge",
    tvaRate: 20,
    depositMode: "percent",
    depositValue: 30,
    paymentTerms: "Acompte à la commande, solde à la livraison.",
    branding: "{}",
  };
  const veh3 = fixtures.vehicles[3];
  const veh5 = fixtures.vehicles[5];
  await prisma.quote.create({
    data: {
      ...quoteBase,
      number: `${year}-041`,
      status: "envoye",
      clientId: clientIds[3],
      clientName: "Marc Dubois",
      clientCompany: "TransCar SPRL",
      clientEmail: "m.dubois@transcar.be",
      clientPhone: "+32 475 11 22 33",
      issueDate: dayKey(-12), // sans réponse depuis 12 j → apparaît dans les relances
      vehicleId: vehicleIds[3] ?? null,
      items: JSON.stringify([
        veh3
          ? { id: "it1", designation: `${veh3.make} ${veh3.model}`, detail: `${veh3.year} · ${veh3.mileage} km`, qty: 1, unitPrice: veh3.price }
          : { id: "it1", designation: "Véhicule d'occasion", qty: 1, unitPrice: 20990 },
        { id: "it2", designation: "Garantie 12 mois", detail: "Extension constructeur", qty: 1, unitPrice: 490 },
      ]),
    },
  });
  await prisma.quote.create({
    data: {
      ...quoteBase,
      number: `${year}-038`,
      status: "accepte",
      clientId: clientIds[4],
      clientName: "Karim Benali",
      clientEmail: "k.benali@gmail.com",
      issueDate: dayKey(-9),
      vehicleId: vehicleIds[5] ?? null,
      items: JSON.stringify([
        veh5
          ? { id: "it1", designation: `${veh5.make} ${veh5.model}`, detail: `${veh5.year} · ${veh5.mileage} km`, qty: 1, unitPrice: veh5.price }
          : { id: "it1", designation: "Véhicule d'occasion", qty: 1, unitPrice: 15490 },
      ]),
    },
  });

  /* ── Factures : une payée (vente conclue), une facture d'acompte impayée ── */
  const veh5Price = veh5 ? veh5.price : 15490;
  const transTotal = (veh3 ? veh3.price : 20990) + 490;
  await prisma.quote.create({
    data: {
      ...quoteBase,
      number: `FAC-${year}-001`,
      status: "envoye",
      docType: "facture",
      factureKind: "complete",
      paymentStatus: "payee",
      paidDate: dayKey(-7),
      depositMode: "none",
      depositValue: 0,
      clientId: clientIds[4],
      clientName: "Karim Benali",
      clientEmail: "k.benali@gmail.com",
      issueDate: dayKey(-8),
      vehicleId: vehicleIds[5] ?? null,
      paymentTerms: "Réglé par virement.",
      items: JSON.stringify([
        veh5
          ? { id: "it1", designation: `${veh5.make} ${veh5.model}`, detail: `${veh5.year} · ${veh5.mileage} km`, qty: 1, unitPrice: veh5Price }
          : { id: "it1", designation: "Véhicule d'occasion", qty: 1, unitPrice: veh5Price },
      ]),
    },
  });
  await prisma.quote.create({
    data: {
      ...quoteBase,
      number: `FAC-${year}-002`,
      status: "envoye",
      docType: "facture",
      factureKind: "acompte",
      paymentStatus: "impayee",
      depositMode: "none",
      depositValue: 0,
      clientId: clientIds[3],
      clientName: "Marc Dubois",
      clientCompany: "TransCar SPRL",
      clientEmail: "m.dubois@transcar.be",
      issueDate: dayKey(-18), // impayée depuis 18 j → apparaît dans les relances
      vehicleId: vehicleIds[3] ?? null,
      paymentTerms: "Facture d'acompte. Le solde fera l'objet d'une facture ultérieure.",
      items: JSON.stringify([
        { id: "acompte", designation: `Acompte sur commande — ${veh3 ? `${veh3.make} ${veh3.model}` : "véhicule"}`, detail: `Acompte 30 % sur devis ${year}-041`, qty: 1, unitPrice: Math.round(transTotal * 0.3) },
      ]),
    },
  });

  /* ── Garanties : une active, une à échéance ── */
  await prisma.warranty.createMany({
    data: [
      { clientName: "Karim Benali", clientEmail: "k.benali@gmail.com", vehicleLabel: "Renault Megane 3 RS", type: "constructeur", startDate: dayKey(-695), endDate: dayKey(35), notes: "Garantie constructeur 24 mois." },
      { clientName: "Amélie Rousseau", clientEmail: "amelie.rousseau@outlook.fr", vehicleLabel: "Audi TT 2.0 TFSI Coupé", type: "extension", startDate: dayKey(-120), endDate: dayKey(605), notes: "Extension 24 mois souscrite à la vente." },
    ],
  });

  /* ── Diffusion : deux annonces déjà publiées ── */
  const portals = ["lacentrale", "leboncoin", "autoscout24", "facebook"];
  await prisma.listing.createMany({
    data: [
      ...portals.map((portal) => ({ vehicleId: vehicleIds[0], portal, status: "publie", publishedAt: daysAgo(12) })),
      ...portals.slice(0, 2).map((portal) => ({ vehicleId: vehicleIds[1], portal, status: "publie", publishedAt: daysAgo(5) })),
    ],
  });

  /* ── Atelier : quelques notes d'équipe ── */
  await prisma.collabNote.create({
    data: {
      content: "Pneus avant de la TT S-line à contrôler avant l'essai de samedi.",
      status: "todo",
      urgency: "urgente",
      author: "Thomas",
      category: "véhicules",
      createdAt: daysAgo(1),
    },
  });
  await prisma.collabNote.create({
    data: {
      content: "Penser à réactiver la campagne d'annonces après le week-end.",
      status: "in-progress",
      urgency: "normale",
      author: "Julie",
      category: "commercial",
      createdAt: daysAgo(2),
    },
  });
}
