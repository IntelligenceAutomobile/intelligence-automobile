// Atelier de la démonstration /demopro (lecture seule).
// Reproduit l'espace de notes d'équipe du back-office, alimenté par des données
// d'exemple figées (src/lib/demo-data.ts). Aucun accès base, aucune action réelle.
import { MessagesSquare } from "lucide-react";
import { AdminPage, PageHeader } from "@/app/admin/ui";
import { getDemoNotes } from "@/lib/demo-data";
import AtelierFeed, { type AtelierNote } from "./AtelierFeed";

// Date courte, alignée sur le back-office (« 23 juil. »).
function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function DemoAtelierPage() {
  // Tri du plus récent au plus ancien, puis passage au composant client sous
  // forme d'objets simples (la date devient un libellé prêt à afficher).
  const notes: AtelierNote[] = [...getDemoNotes()]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((n) => ({
      id: n.id,
      content: n.content,
      status: n.status,
      urgency: n.urgency,
      author: n.author,
      category: n.category,
      dateLabel: fmtDate(n.createdAt),
    }));

  return (
    <AdminPage>
      <PageHeader
        title="Atelier"
        subtitle="Le fil de notes partagé par votre équipe."
        action={
          <span className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase" style={{ color: "#9FB3D4" }}>
            <MessagesSquare size={14} />
            Espace équipe
          </span>
        }
      />
      <AtelierFeed notes={notes} />
    </AdminPage>
  );
}
