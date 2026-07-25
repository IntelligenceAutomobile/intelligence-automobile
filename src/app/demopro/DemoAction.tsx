"use client";

// Bouton d'action « inerte » de la démonstration /demopro.
// Reproduit visuellement un bouton du back-office, mais au lieu d'agir il affiche
// simplement un toast rappelant que la démo n'enregistre rien. Aucun fetch, aucune
// écriture : la démo ne parle jamais au serveur.
import type { CSSProperties, ReactNode } from "react";
import { useToast } from "@/app/admin/toast";
import { DEMO_MSG } from "./demo";

export function DemoAction({
  children,
  className,
  style,
  ariaLabel,
  title,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
}) {
  const toast = useToast();
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={() => toast.info(DEMO_MSG)}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
