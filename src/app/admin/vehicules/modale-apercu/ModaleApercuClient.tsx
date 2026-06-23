"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/context";
import { fieldClass, fieldStyle, btnPrimaryClass, btnPrimaryStyle, T } from "@/app/admin/ui";
import VehiculeModalV2 from "./VehiculeModalV2";
import { toModal, type Vehicle } from "./modalData";

// Aperçu (admin uniquement) de l'ancienne modale véhicule, retirée du site public.
// Choisis un véhicule puis ouvre la modale telle qu'elle s'affichait avant.
export default function ModaleApercuClient({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState(vehicles[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  return (
    <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }} className="p-5 sm:p-6 space-y-5">
      <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
        Cette modale n&apos;apparaît plus côté public — les visiteurs sont désormais
        envoyés directement vers la fiche véhicule. Elle est conservée ici pour
        référence : sélectionne un véhicule et ouvre-la pour la revoir telle quelle.
      </p>

      {vehicles.length === 0 ? (
        <p className="text-sm" style={{ color: T.muted }}>Aucun véhicule en base.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: T.muted }}>
              Véhicule
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={fieldClass}
              style={fieldStyle}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} style={{ backgroundColor: T.float }}>
                  {v.make} {v.model} ({v.year})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!selected}
            className={btnPrimaryClass}
            style={btnPrimaryStyle}
          >
            Ouvrir la modale
          </button>
        </div>
      )}

      {open && selected && (
        <VehiculeModalV2
          vehicle={toModal(selected, t.vehicles.priceOnRequest)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
