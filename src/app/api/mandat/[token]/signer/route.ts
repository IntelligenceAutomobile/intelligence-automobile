import { NextRequest, NextResponse } from "next/server";
import { sendMail, MAIL_FROM } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { COMPANY } from "@/lib/company";
import { echeanceMandat, mandatVehiculeLabel } from "@/lib/mandats";

const FROM = MAIL_FROM;

// Signature d'un mandat par le vendeur, depuis la page publique.
// Route ouverte par nature : le jeton du lien tient lieu d'identification.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const row = await prisma.mandat.findUnique({ where: { publicToken: token } });
    if (!row) return NextResponse.json({ error: "Ce mandat est introuvable." }, { status: 404 });
    if (row.signedAt !== "" || row.status === "signe") {
      return NextResponse.json({ ok: true, already: true });
    }
    if (row.status !== "brouillon") {
      return NextResponse.json({ error: "Ce mandat a été clôturé, il attend plus de signature." }, { status: 409 });
    }

    const today = parisDay(new Date()).toISOString().slice(0, 10);
    const e = echeanceMandat(row.startDate, row.durationDays, today);
    if (e?.expiree) {
      return NextResponse.json(
        { error: `Ce mandat était proposé jusqu'au ${e.echeance}. Demandez un contrat à jour.` },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const signerName = String(body.signerName ?? "").trim().slice(0, 120);
    if (signerName.length < 2) {
      return NextResponse.json({ error: "Indiquez le nom du signataire." }, { status: 400 });
    }
    // La mention se valide côté serveur aussi : la case du navigateur est une
    // aide de saisie, jamais une preuve.
    if (body.approuve !== true) {
      return NextResponse.json({ error: "Validez la mention « Lu et approuvé, bon pour mandat »." }, { status: 400 });
    }
    const immediate = body.immediateExecution === true;

    // Adresse d'origine : trace de l'accord, comme la date et le nom.
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "";

    const traces = [
      {
        type: "statut",
        content: `Mandat signé en ligne par ${signerName}${ip ? ` (adresse IP ${ip})` : ""}`,
        author: signerName,
      },
      {
        type: "note",
        content: immediate
          ? "Exécution immédiate demandée à la signature : la mission démarre tout de suite."
          : "Exécution immédiate déclinée à la signature : la mission attend la fin du délai de rétractation.",
        author: signerName,
      },
    ];

    await prisma.mandat.update({
      where: { id: row.id },
      data: {
        status: "signe",
        signerName,
        signedAt: new Date().toISOString(),
        signedIp: ip,
        signedOn: today,
        // Un lien signé de loin est un contrat à distance : l'article 14
        // imprimé suit, et la date d'effet se pose si elle manquait.
        signMode: "distance",
        immediateExecution: immediate,
        ...(row.startDate === "" ? { startDate: today } : {}),
        events: { create: traces },
      },
    });

    // Un mandat de VENTE signé sur un véhicule du stock verrouille son régime :
    // la mention « vente réalisée pour le compte d'un particulier » suit la
    // fiche publique et les annonces diffusées, comme la loi le demande. Les
    // autres mandats laissent le stock tranquille.
    if (row.type === "vente" && row.vehicleId) {
      const touche = await prisma.vehicle.updateMany({
        where: { id: row.vehicleId, saleRegime: { not: "mandat-client" } },
        data: { saleRegime: "mandat-client" },
      });
      if (touche.count > 0) {
        await prisma.mandatEvent.create({
          data: { mandatId: row.id, type: "statut", content: "Fiche véhicule passée en régime « Mandat client »", author: signerName },
        });
      }
    }

    // L'équipe est prévenue tout de suite : c'est le signal qui lance la mission.
    if (COMPANY.email) {
      // La signature prime sur la notification : un échec d'envoi reste sans
      // conséquence ici, le contrat est déjà enregistré.
      await sendMail({
        from: FROM,
        to: COMPANY.email,
        subject: `Mandat ${row.reference} signé par ${signerName}`,
        html: `<p>Le mandat <strong>${row.reference}</strong> (${mandatVehiculeLabel(row)}) vient d'être signé en ligne par <strong>${signerName}</strong>.</p><p>${immediate ? "L'exécution immédiate est demandée : la mission peut démarrer." : "L'exécution immédiate a été déclinée : la mission attend la fin du délai de rétractation de quatorze jours."}</p>`,
        origin: "signature-mandat",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }
}
