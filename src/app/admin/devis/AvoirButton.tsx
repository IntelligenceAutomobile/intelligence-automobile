"use client";

// Établir un avoir sur une facture, depuis la fiche facture.
//
// Une facture ne se corrige pas : elle se crédite. C'est la règle comptable, et
// c'est aussi ce que l'utilisateur cherche quand il veut « supprimer une
// facture » ou « changer le montant ». Le geste se fait donc ici, guidé.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { AVOIR_REASONS, formatEuro } from "@/lib/devis";
import { T, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle, fieldClass, fieldStyle, labelClass } from "../ui";
import { useToast } from "../toast";
import { parseAmount } from "./DevisEditor";
import { formatNumber } from "@/lib/format";

export default function AvoirButton({
  quoteId,
  number,
  montant,
  dejaCredite,
}: {
  quoteId: string;
  number: string;
  /** Montant facturé, celui que l'avoir peut créditer au maximum. */
  montant: number;
  /** Déjà crédité par des avoirs précédents. */
  dejaCredite: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"total" | "partiel">("total");
  const [reason, setReason] = useState<string>(AVOIR_REASONS[0]);
  const [autre, setAutre] = useState("");
  const [amountInput, setAmountInput] = useState("");

  const restant = Math.max(0, Math.round((montant - dejaCredite) * 100) / 100);
  const soldee = restant <= 0;
  const motif = reason === "Autre motif" ? autre.trim() : reason;

  async function etablir() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/devis/${quoteId}/avoir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          reason: motif,
          amount: kind === "partiel" ? parseAmount(amountInput) : undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Avoir ${j.number} établi.`);
      setOpen(false);
      router.push(`/admin/devis/${j.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'avoir n'a pas pu être établi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={soldee}
        title={soldee ? "Cette facture est déjà créditée en totalité." : "Établir un avoir sur cette facture"}
        className={btnGhostClass}
        style={btnGhostStyle}
      >
        <Undo2 size={13} />
        {soldee ? "Créditée" : "Établir un avoir"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(4px)" }}
          onClick={() => !busy && setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Établir un avoir"
            className="w-full max-w-md p-6"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: T.accent }}>Avoir</p>
            <h2 className="text-lg mb-1" style={{ color: T.text }}>Créditer la facture {number}</h2>
            <p className="text-[12px] mb-5" style={{ color: T.muted }}>
              Une facture émise ne se modifie ni ne se supprime. L&apos;avoir est le document qui la corrige.
              {dejaCredite > 0 && <> Déjà crédité : {formatEuro(dejaCredite)}, reste {formatEuro(restant)}.</>}
            </p>

            <div className="flex gap-2 mb-4">
              {([
                ["total", "Avoir total", `Annule la facture · ${formatEuro(restant)}`],
                ["partiel", "Avoir partiel", "Crédite un montant choisi"],
              ] as [typeof kind, string, string][]).map(([val, lab, hint]) => {
                const active = kind === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setKind(val)}
                    className="flex-1 text-left p-3 border transition-colors"
                    style={{
                      borderColor: active ? T.accent : T.border,
                      backgroundColor: active ? "var(--adm-accent-soft)" : "transparent",
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: active ? T.text : T.textDim }}>{lab}</div>
                    <div className="text-[11px] mt-1" style={{ color: T.muted }}>{hint}</div>
                  </button>
                );
              })}
            </div>

            {kind === "partiel" && (
              <label className="block mb-4">
                <span className={labelClass} style={{ color: T.muted }}>Montant à créditer (€)</span>
                <input
                  inputMode="decimal"
                  className={fieldClass}
                  style={fieldStyle}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  onBlur={() => {
                    const v = parseAmount(amountInput);
                    setAmountInput(v > 0 ? formatNumber(v) : "");
                  }}
                  placeholder={formatNumber(restant)}
                />
                <span className="text-[11px] mt-1 block" style={{ color: T.muted }}>Maximum {formatEuro(restant)}.</span>
              </label>
            )}

            <label className="block mb-4">
              <span className={labelClass} style={{ color: T.muted }}>Motif</span>
              <select className={fieldClass} style={fieldStyle} value={reason} onChange={(e) => setReason(e.target.value)}>
                {AVOIR_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="Autre motif">Autre motif…</option>
              </select>
            </label>

            {reason === "Autre motif" && (
              <label className="block mb-4">
                <span className={labelClass} style={{ color: T.muted }}>Précisez</span>
                <input className={fieldClass} style={fieldStyle} value={autre} onChange={(e) => setAutre(e.target.value)} placeholder="Reprise du véhicule finalement annulée" />
              </label>
            )}

            <p className="text-[11px] mb-5" style={{ color: T.muted }}>
              Le motif figure sur le document remis au client.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
                Annuler
              </button>
              <button
                type="button"
                onClick={etablir}
                disabled={busy || !motif || (kind === "partiel" && parseAmount(amountInput) <= 0)}
                className={btnPrimaryClass}
                style={btnPrimaryStyle}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
                Établir l&apos;avoir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
