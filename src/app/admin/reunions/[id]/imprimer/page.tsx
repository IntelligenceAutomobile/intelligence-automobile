import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meetingTitle, parseAttachments, parseAttendees, parseSnapshot } from "@/lib/reunions";
import MeetingDocument from "../../MeetingDocument";
import PrintToolbar from "../../../devis/[id]/imprimer/PrintToolbar";

// CSS d'impression : masque l'habillage admin + la barre d'outils, papier A4
// plein cadre. Recette partagée avec les devis (mêmes classes devis-*).
const PRINT_CSS = `
@media print {
  header, aside, nav { display: none !important; }
  .adm-root .lg\\:hidden { display: none !important; }
  .adm-root { display: block !important; background: #fff !important; min-height: 0 !important; }
  .devis-no-print { display: none !important; }
  .devis-screen-bg { background: #fff !important; padding: 0 !important; }
  html, body { background: #fff !important; }
  @page { size: A4; margin: 15mm 16mm; }
  .devis-sheet {
    padding: 0 !important;
    width: auto !important;
    min-height: 262mm !important;
  }
  tr, .devis-avoid-break { break-inside: avoid; }
}
`;

// Titre de l'onglet = nom de fichier proposé par le navigateur pour le PDF.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.meeting.findUnique({ where: { id }, select: { title: true, date: true } });
  if (!row) return { title: "Réunion" };
  return { title: `Réunion ${row.date} - ${meetingTitle(row)}`.trim() };
}

export default async function ImprimerReunionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [row, theme] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id },
      include: { items: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
    }),
    prisma.brandTheme.findUnique({ where: { id: "default" } }),
  ]);
  if (!row) notFound();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PrintToolbar />
      <div className="devis-screen-bg flex justify-center" style={{ backgroundColor: "#5b6472", padding: "24px 0" }}>
        <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
          <MeetingDocument
            meeting={{
              date: row.date,
              title: row.title,
              kind: row.kind,
              attendees: parseAttendees(row.attendees),
              location: row.location,
              summary: row.summary,
              author: row.author,
              snapshot: parseSnapshot(row.snapshot),
              attachments: parseAttachments(row.attachments),
              items: row.items.map((i) => ({
                id: i.id,
                type: i.type,
                content: i.content,
                owner: i.owner,
                dueDate: i.dueDate,
                status: i.status,
                doneAt: i.doneAt,
              })),
            }}
            brand={{
              name: theme?.name || "Intelligence Automobile",
              tagline: theme?.tagline || "",
              accent: theme?.accent || "#1E4FA3",
            }}
          />
        </div>
      </div>
    </>
  );
}
