import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VisuelsClient from "./VisuelsClient";

/* Fabrique de visuels : la composition se fait entièrement dans le navigateur.
   Le serveur ne sert qu'à deux choses, fermer la porte et servir la
   bibliothèque déjà remplie, pour que la page s'ouvre garnie plutôt que de se
   remplir sous les yeux. */
export default async function VisuelsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const visuels = await prisma.visuel.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      nom: true,
      imageUrl: true,
      photoUrl: true,
      largeur: true,
      hauteur: true,
      reglages: true,
      createdAt: true,
    },
  });

  return (
    <VisuelsClient
      initial={visuels.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))}
    />
  );
}
