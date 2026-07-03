"use client";

// Bouton de suppression générique : dialog de confirmation + toast de résultat.
// Utilisé pour les véhicules, devis, et toute ressource exposée en DELETE.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { T } from "./ui";
import { ConfirmDialog } from "./confirm";
import { useToast } from "./toast";

export default function DeleteButton({
  url,
  title,
  description,
  successMessage,
  errorMessage = "La suppression a échoué. Réessayez.",
}: {
  url: string;
  title: string;
  description?: string;
  successMessage: string;
  errorMessage?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOpen(false);
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error(errorMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase py-2 -my-2 transition-colors hover:text-[#FF6B35]"
        style={{ color: T.muted }}
      >
        <Trash2 size={13} />
        Supprimer
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
