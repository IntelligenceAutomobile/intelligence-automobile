"use client";

import { useRouter } from "next/navigation";

export default function DeleteVehiculeButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Supprimer ce véhicule définitivement ?")) return;
    await fetch(`/api/admin/vehicules/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs tracking-widest uppercase"
      style={{ color: "#8AABD4" }}
    >
      Supprimer
    </button>
  );
}
