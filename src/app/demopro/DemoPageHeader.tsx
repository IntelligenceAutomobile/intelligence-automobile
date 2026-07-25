// En-tête de page de la démonstration : identique au PageHeader du back-office
// sur desktop, mais qui EMPILE le titre et les actions sur mobile (sinon la
// rangée de boutons force une largeur qui déborde de l'écran). Composant neutre
// (pas de hook) : utilisable depuis les pages serveur et les composants client.
import type { ReactNode } from "react";
import { T } from "@/app/admin/ui";

export function DemoPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <div style={{ width: 24, height: 2, backgroundColor: T.accent }} className="mb-3" />
        <h1 className="text-2xl font-light" style={{ color: T.text, letterSpacing: "-0.01em" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5" style={{ color: T.muted }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="sm:flex-shrink-0">{action}</div>}
    </div>
  );
}
