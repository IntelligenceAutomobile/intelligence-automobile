"use client";

// Bouton d'action neutralisé pour la démonstration : au lieu d'agir (enregistrer,
// envoyer, imprimer, convertir…), il affiche un toast rappelant que rien n'est
// enregistré. Réutilisé par la liste ("Nouveau devis") et la fiche devis.
import type { CSSProperties, ReactNode } from "react";
import { useToast } from "@/app/admin/toast";
import { DEMO_MSG } from "../demo";

export default function DemoActionButton({
  children,
  className,
  style,
  title,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const toast = useToast();
  return (
    <button type="button" title={title} onClick={() => toast.info(DEMO_MSG)} className={className} style={style}>
      {children}
    </button>
  );
}
