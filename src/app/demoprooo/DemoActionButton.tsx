"use client";

// Bouton d'action de la démonstration : au lieu d'agir (enregistrer, publier,
// supprimer, ajouter…), il affiche un toast expliquant que la démo ne conserve
// rien. Réutilisable depuis les pages serveur (l'icône et le libellé passent en
// children ; le style du bouton reste défini par l'appelant).
import type { CSSProperties, ReactNode } from "react";
import { useToast } from "@/app/admin/toast";
import { DEMO_MSG } from "./demo";

export default function DemoActionButton({
  children,
  className,
  style,
  message = DEMO_MSG,
  ariaLabel,
  title,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  message?: string;
  ariaLabel?: string;
  title?: string;
}) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => toast.info(message)}
      className={className}
      style={style}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
