"use client";

import DeleteButton from "../DeleteButton";

export default function DeleteVehiculeButton({ id }: { id: string }) {
  return (
    <DeleteButton
      url={`/api/admin/vehicules/${id}`}
      title="Supprimer ce véhicule ?"
      description="La fiche, ses photos et ses documents ne seront plus visibles. Cette action est définitive."
      successMessage="Véhicule supprimé."
    />
  );
}
