import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { isAppointmentType, TYPE_LABEL, formatMin, type AppointmentType } from "@/lib/planning";
import { PIPELINE_STAGES } from "@/lib/crm";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Liste des RDV d'une plage de dates (?from=YYYY-MM-DD&to=YYYY-MM-DD).
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "Plage de dates invalide." }, { status: 400 });
  }

  const rows = await prisma.appointment.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }, { startMin: "asc" }],
  });
  return NextResponse.json(rows);
}

function sanitize(body: Record<string, unknown>) {
  const date = String(body.date ?? "");
  if (!DATE_RE.test(date)) return null;
  const startMin = Math.round(Number(body.startMin));
  const durationMin = Math.round(Number(body.durationMin ?? 60));
  if (!Number.isFinite(startMin) || startMin < 0 || startMin > 23 * 60) return null;
  if (!Number.isFinite(durationMin) || durationMin < 15 || durationMin > 12 * 60) return null;
  const type: AppointmentType = isAppointmentType(body.type) ? body.type : "autre";
  const person = String(body.person ?? "").trim();
  if (type === "indispo" && !person) return null;
  return {
    date,
    startMin,
    durationMin,
    type,
    title: String(body.title ?? "").trim(),
    person,
    clientId: typeof body.clientId === "string" && body.clientId ? body.clientId : null,
    vehicleId: typeof body.vehicleId === "string" && body.vehicleId ? body.vehicleId : null,
    notes: String(body.notes ?? "").trim(),
  };
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const data = sanitize(body);
    if (!data) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

    const appt = await prisma.appointment.create({ data });

    // Trace le RDV dans la timeline du lead actif le plus récent du client.
    if (data.clientId && data.type !== "indispo") {
      const lead = await prisma.lead.findFirst({
        where: { clientId: data.clientId, stage: { in: [...PIPELINE_STAGES] } },
        orderBy: { updatedAt: "desc" },
      });
      if (lead) {
        const collab = await getCollabSession();
        const when = new Date(`${data.date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            type: "rdv",
            content: `${TYPE_LABEL[data.type]} planifié — ${when} à ${formatMin(data.startMin)}${data.title ? ` (${data.title})` : ""}`,
            author: collab?.name ?? "",
          },
        });
      }
    }

    return NextResponse.json(appt);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  }
}
