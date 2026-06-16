"use client";

import { useState } from "react";
import { T, SectionCard, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";

const NAMES = ["César", "Fab"];

export default function NamePicker() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function pick(name: string) {
    setLoading(name);
    setError("");
    const res = await fetch("/api/collab/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setError("Impossible d'enregistrer le nom. Réessayez.");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <SectionCard title="Atelier — qui êtes-vous ?">
        <p className="text-sm" style={{ color: T.muted }}>
          Sélectionnez votre nom : il sert à signer vos notes et commentaires.
        </p>
        <div className="flex gap-3">
          {NAMES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pick(n)}
              disabled={loading !== null}
              className={btnPrimaryClass + " flex-1 py-4 disabled:opacity-60"}
              style={btnPrimaryStyle}
            >
              {loading === n ? "..." : n}
            </button>
          ))}
        </div>
        {error && <p className="text-xs" style={{ color: T.danger }}>{error}</p>}
      </SectionCard>
    </div>
  );
}
