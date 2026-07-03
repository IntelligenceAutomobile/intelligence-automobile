"use client";

import DeleteButton from "../DeleteButton";

export default function DeleteQuoteButton({ id }: { id: string }) {
  return (
    <DeleteButton
      url={`/api/admin/devis/${id}`}
      title="Supprimer ce devis ?"
      description="Le devis sera définitivement supprimé. Cette action est irréversible."
      successMessage="Devis supprimé."
    />
  );
}
