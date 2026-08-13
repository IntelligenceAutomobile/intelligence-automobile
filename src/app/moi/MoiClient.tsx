"use client";

// L'exclusion part au chargement : ouvrir la page suffit, il n'y a rien à
// cliquer. Le composant raconte ensuite ce qui s'est passé.
import { useEffect, useRef, useState } from "react";

type Etat =
  | { statut: "encours" }
  | { statut: "fait"; dejaExclu: boolean; effacees: number }
  | { statut: "erreur" };

export default function MoiClient() {
  const [etat, setEtat] = useState<Etat>({ statut: "encours" });
  // React monte deux fois les effets en développement : un seul appel suffit.
  const dejaDemande = useRef(false);

  useEffect(() => {
    if (dejaDemande.current) return;
    dejaDemande.current = true;

    fetch("/api/mesure/exclusion", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const corps = (await res.json()) as { dejaExclu?: unknown; effacees?: unknown };
        setEtat({
          statut: "fait",
          dejaExclu: corps.dejaExclu === true,
          effacees: typeof corps.effacees === "number" ? corps.effacees : 0,
        });
      })
      .catch(() => setEtat({ statut: "erreur" }));
  }, []);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}
    >
      <div className="max-w-md text-center">
        <div
          className="mx-auto"
          style={{
            width: "40px",
            height: "2px",
            background: "linear-gradient(to right, rgba(198,204,214,0), #C6CCD6, rgba(198,204,214,0))",
            borderRadius: "2px",
            boxShadow: "0 0 8px rgba(198,204,214,0.35)",
            marginBottom: "1.4rem",
          }}
        />

        {etat.statut === "encours" && (
          <p className="text-sm" style={{ color: "#C6CCD6" }}>Un instant…</p>
        )}

        {etat.statut === "fait" && (
          <>
            <h1 className="text-xl font-black leading-tight mb-3">
              Cet appareil est exclu des statistiques de visite
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#C6CCD6" }}>
              {etat.dejaExclu
                ? "Il l'était déjà : tout est en ordre, vous pouvez fermer cette page."
                : etat.effacees > 0
                  ? `Ses visites passées (${etat.effacees} page${etat.effacees > 1 ? "s" : ""} vue${etat.effacees > 1 ? "s" : ""}) viennent d'être retirées des chiffres. Vous pouvez fermer cette page.`
                  : "Ses visites resteront désormais hors des chiffres. Vous pouvez fermer cette page."}
            </p>
          </>
        )}

        {etat.statut === "erreur" && (
          <>
            <h1 className="text-xl font-black leading-tight mb-3">La demande a échoué</h1>
            <p className="text-sm leading-relaxed" style={{ color: "#C6CCD6" }}>
              Rechargez la page pour réessayer.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
