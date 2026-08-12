"use client";

// Actions de la démonstration. Le bouton ouvre le VRAI aperçu du back-office,
// rempli avec le gabarit d'email partagé : le prospect lit le message exact que
// reçoit un acheteur, message personnel compris. Le menu ouvre les mêmes
// entrées que l'écran réel. Les gestes affichent le toast de démonstration au
// lieu d'agir.
import { useState } from "react";
import { Send, BellRing, Star, Hand, Ban, PauseCircle, Undo2 } from "lucide-react";
import { reviewEmail, reviewSubject } from "@/lib/avis-email";
import { T } from "@/app/admin/ui";
import { useToast } from "@/app/admin/toast";
import { AvisDialog } from "@/app/admin/avis/AvisDialog";
import { AvisMenu, type AvisMenuItem } from "@/app/admin/avis/AvisMenu";
import { ghostBtnClass, ghostBorder, primaryBtnClass, type AvisView } from "@/app/admin/avis/presentation";
import { DEMO_MSG, DEMO_BRAND, DEMO_REVIEW_LINK } from "@/app/demopro/demo";

export default function DemoAvisButton({ it, rappel = false }: { it: AvisView; rappel?: boolean }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={`${rappel ? ghostBtnClass : primaryBtnClass} relative z-10`}
        style={rappel ? { borderColor: ghostBorder, color: T.warning } : { backgroundColor: T.accent, color: T.bg }}
      >
        {rappel ? <BellRing size={13} /> : <Send size={13} />}
        {rappel ? "Relancer" : "Demander un avis"}
      </button>
      {ouvert && (
        <AvisDialog
          target={{ id: it.id, name: it.name }}
          preview={{
            to: it.email,
            subject: reviewSubject(DEMO_BRAND.name),
            html: reviewEmail({
              clientName: it.name,
              brandName: DEMO_BRAND.name,
              reviewLink: DEMO_REVIEW_LINK,
              accent: "#6B9FEE",
              vehicle: it.vehicle,
            }),
            vehicle: it.vehicle,
            reason: it.reason,
            reasonDate: it.reasonDate,
            rappel,
          }}
          sending={false}
          onSend={() => {
            setOuvert(false);
            toast.info(DEMO_MSG);
          }}
          onCancel={() => setOuvert(false)}
        />
      )}
    </>
  );
}

const ITEMS: Record<string, AvisMenuItem[]> = {
  "a-faire": [
    { key: "manuel", label: "Sollicité sur place", icon: Hand },
    { key: "ecart", label: "Écarter", icon: Ban, tone: "muted" },
  ],
  attente: [
    { key: "avis", label: "Avis reçu", icon: Star, tone: "success" },
    { key: "report", label: "Reporter de 7 jours", icon: PauseCircle, tone: "warning" },
    { key: "stop", label: "Laisser ce client tranquille", icon: Ban, tone: "muted" },
  ],
  clos: [{ key: "reprise", label: "Remettre dans la liste", icon: Undo2 }],
};

export function DemoAvisMenu({ name, variante }: { name: string; variante: "a-faire" | "attente" | "clos" }) {
  const toast = useToast();
  return (
    <AvisMenu
      items={ITEMS[variante]}
      busy={false}
      ariaLabel={`Autres actions pour ${name}`}
      onSelect={() => toast.info(DEMO_MSG)}
    />
  );
}
