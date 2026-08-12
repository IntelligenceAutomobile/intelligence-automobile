"use client";

// Encart « Vos supports » : tout ce qui se tend, se copie ou s'imprime.
//
// Le QR code s'agrandit en plein écran pour être scanné depuis le téléphone du
// client au moment de la remise des clés. Le lien court et le texte de SMS se
// copient en un clic. Les trois pointent vers la même adresse mesurée, si bien
// que les scans du comptoir se comptent à côté des clics des invitations.
import { useState } from "react";
import { QrCode, Copy, Check, MessageSquare, Link2, X } from "lucide-react";
import { T } from "../ui";
import { useToast } from "../toast";

export function Supports({ lien, qr, sms }: { lien: string; qr: string; sms: string }) {
  const toast = useToast();
  const [plein, setPlein] = useState(false);
  const [copie, setCopie] = useState("");

  async function copier(quoi: string, valeur: string, message: string) {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(quoi);
      toast.success(message);
      setTimeout(() => setCopie((c) => (c === quoi ? "" : c)), 2000);
    } catch {
      toast.error("La copie a échoué. Sélectionnez le texte à la main.");
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <QrCode size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>
          Vos supports
        </h2>
      </div>
      <p className="text-[12px] mb-3" style={{ color: T.muted }}>
        Le client est content, il a les clés en main et son téléphone à portée : c&apos;est le meilleur moment.
      </p>

      <div className="grid gap-px sm:grid-cols-[auto_1fr]" style={{ backgroundColor: T.border, border: `1px solid ${T.border}` }}>
        {/* QR code, agrandissable */}
        <div className="flex flex-col items-center gap-2 p-5" style={{ backgroundColor: T.surface }}>
          <button
            type="button"
            onClick={() => setPlein(true)}
            aria-label="Agrandir le QR code"
            className="adm-btn-focus block"
            style={{ lineHeight: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code du lien d'avis" width={128} height={128} style={{ display: "block" }} />
          </button>
          <span className="text-[10px] tracking-widest uppercase" style={{ color: T.accent }}>
            Agrandir
          </span>
        </div>

        {/* Lien court et texte de SMS */}
        <div className="flex flex-col gap-4 p-5" style={{ backgroundColor: T.surface }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link2 size={13} style={{ color: T.muted }} />
              <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
                Lien court
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-[13px] px-2.5 py-1.5 truncate max-w-full" style={{ backgroundColor: T.float, color: T.textDim }}>
                {lien}
              </code>
              <BoutonCopier actif={copie === "lien"} onClick={() => copier("lien", lien, "Lien copié.")} label="Copier le lien" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare size={13} style={{ color: T.muted }} />
              <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
                Texte de SMS
              </span>
            </div>
            <p className="text-[13px] px-2.5 py-2 mb-2" style={{ backgroundColor: T.float, color: T.textDim }}>
              {sms}
            </p>
            <BoutonCopier actif={copie === "sms"} onClick={() => copier("sms", sms, "Texte copié.")} label="Copier le texte" />
          </div>
        </div>
      </div>

      {plein && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 px-6"
          style={{ backgroundColor: "rgba(4,11,22,0.94)" }}
          onClick={() => setPlein(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR code du lien d'avis"
        >
          <div className="p-6" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code du lien d'avis" width={360} height={360} style={{ display: "block", width: "min(72vw, 360px)", height: "auto" }} />
          </div>
          <p className="text-sm text-center" style={{ color: T.textDim }}>
            Tendez l&apos;écran au client : son téléphone ouvre votre fiche Google.
          </p>
          <button
            type="button"
            onClick={() => setPlein(false)}
            className="adm-btn-focus inline-flex items-center gap-2 text-[11px] tracking-widest uppercase px-4 py-2.5 border"
            style={{ borderColor: T.border, color: T.textDim }}
          >
            <X size={14} />
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

function BoutonCopier({ actif, onClick, label }: { actif: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="adm-btn-focus inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-2 border transition-colors"
      style={{ borderColor: actif ? T.success : T.border, color: actif ? T.success : T.textDim }}
    >
      {actif ? <Check size={12} /> : <Copy size={12} />}
      {actif ? "Copié" : label}
    </button>
  );
}
