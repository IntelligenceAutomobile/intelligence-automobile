"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatNumber } from "@/lib/format";
import type { Translations } from "@/i18n/fr";

export type ReservationLabels = Translations["vehicleDetail"]["reservation"];

/** Ce que le visiteur demande : bloquer le véhicule, ou en recevoir le dossier. */
export type DemandeKind = "reservation" | "dossier";

type Status = "idle" | "sending" | "success" | "error";

// ── Boutons de demande de la fiche ────────────────────────────────────────────
// « Réserver ce véhicule » et « Recevoir le dossier complet » ouvrent la même
// fenêtre, avec leurs propres textes : deux formulaires à tenir pour la même
// mécanique coûtaient plus cher que ce paramètre.
// La fiche porte plusieurs de ces boutons (carte de prix, encart du bas, barre
// mobile) : chacun garde son propre état d'ouverture, ce qui évite de faire
// remonter un contexte à travers une vue qui se rend aussi côté serveur.
export default function ReservationCta({
  vehicle,
  price,
  vehicleId,
  labels,
  kind = "reservation",
  className,
  style,
  children,
}: {
  /** Véhicule tel qu'il se lit : « Audi A3 Sportback 2021 ». */
  vehicle: string;
  price: number;
  vehicleId?: string;
  labels: ReservationLabels;
  kind?: DemandeKind;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={{ cursor: "pointer", ...style }}>
        {children}
      </button>
      {open && (
        <ReservationDialog
          vehicle={vehicle}
          price={price}
          vehicleId={vehicleId}
          labels={labels}
          kind={kind}
          onClose={close}
        />
      )}
    </>
  );
}

// ── La fenêtre ────────────────────────────────────────────────────────────────
function ReservationDialog({
  vehicle,
  price,
  vehicleId,
  labels,
  kind,
  onClose,
}: {
  vehicle: string;
  price: number;
  vehicleId?: string;
  labels: ReservationLabels;
  kind: DemandeKind;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  // Le moment de rappel se tient en mémoire plutôt qu'en CSS : le style posé sur
  // la pastille l'emporterait sur toute règle décrivant l'état coché.
  const [rappel, setRappel] = useState("peu-importe");
  const [rappelFocus, setRappelFocus] = useState("");
  const firstField = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const pageScroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = pageScroll;
    };
  }, [onClose]);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: data.get("nom"),
          email: data.get("email"),
          telephone: data.get("telephone"),
          rappel,
          message: data.get("message"),
          vehicule: vehicle,
          prix: price,
          vehiculeId: vehicleId ?? "",
          type: kind,
          url: typeof window === "undefined" ? "" : window.location.href,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const fieldStyle: React.CSSProperties = {
    backgroundColor: "#040B16",
    color: "#F0F5FF",
    outline: "none",
    width: "100%",
    padding: "12px 14px",
    fontSize: "0.875rem",
    border: "1px solid #1B3055",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#A8C6F4",
    marginBottom: "0.55rem",
  };

  const focusOn = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.style.borderColor = "#6B9FEE");
  const focusOff = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.style.borderColor = "#1B3055");

  // La fenêtre se pose sur <body> : la barre du bas, sur mobile, porte un flou
  // d'arrière-plan qui enfermerait sinon la fenêtre dans ses quelques pixels de
  // hauteur. Elle ne s'ouvre qu'après un clic, donc toujours côté navigateur.
  return createPortal(
    <div
      onClick={onClose}
      className="flex items-center justify-center p-4"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        backgroundColor: "rgba(4,11,22,0.88)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "linear-gradient(160deg, #0E2040 0%, #091626 100%)",
          border: "1px solid rgba(107,159,238,0.2)",
          borderTop: "2px solid #6B9FEE",
          borderRadius: "10px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        }}
      >
        {/* En-tête : le véhicule et son prix, pour savoir ce qui se réserve */}
        <div
          className="flex items-start justify-between gap-4 px-6 pt-6 pb-5"
          style={{ borderBottom: "1px solid rgba(107,159,238,0.12)" }}
        >
          <div className="min-w-0">
            <p id={titleId} className="text-[11px] font-bold tracking-[0.3em] uppercase" style={{ color: "#6B9FEE" }}>
              {labels.title}
            </p>
            <p className="mt-2 text-[15px] font-bold leading-snug" style={{ color: "#F0F5FF" }}>
              {vehicle}
            </p>
            <p className="mt-0.5 text-[13px]" style={{ color: "#A8C6F4" }}>
              {formatNumber(price)} €
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeLabel}
            className="flex-shrink-0 text-xl leading-none transition-opacity hover:opacity-70"
            style={{ color: "#C8D8EE", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
          >
            ✕
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-10 text-center">
            <span
              className="inline-flex items-center justify-center font-bold"
              style={{
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "50%",
                backgroundColor: "rgba(91,216,154,0.15)",
                color: "#5BD89A",
                fontSize: "1.1rem",
              }}
            >
              ✓
            </span>
            <p className="mt-5 text-[11px] font-bold tracking-[0.3em] uppercase" style={{ color: "#F0F5FF" }}>
              {labels.successTitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#C8D8EE" }}>
              {labels.successBody.replace("%v", vehicle)}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full text-xs font-bold tracking-[0.2em] uppercase py-4 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E", border: "none", cursor: "pointer" }}
            >
              {labels.successClose}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#C8D8EE" }}>
              {labels.intro}
            </p>

            <div className="mb-5">
              <label style={labelStyle} htmlFor={`${titleId}-nom`}>{labels.nameLabel}</label>
              <input
                ref={firstField}
                id={`${titleId}-nom`}
                name="nom"
                required
                type="text"
                autoComplete="name"
                placeholder={labels.namePlaceholder}
                style={fieldStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div className="mb-5">
              <label style={labelStyle} htmlFor={`${titleId}-tel`}>{labels.phoneLabel}</label>
              <input
                id={`${titleId}-tel`}
                name="telephone"
                required
                type="tel"
                autoComplete="tel"
                placeholder={labels.phonePlaceholder}
                style={fieldStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div className="mb-5">
              <label style={labelStyle} htmlFor={`${titleId}-email`}>{labels.emailLabel}</label>
              <input
                id={`${titleId}-email`}
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder={labels.emailPlaceholder}
                style={fieldStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            {/* Moment de rappel : quatre pastilles, la dernière cochée d'office */}
            <fieldset className="mb-5" style={{ border: "none", padding: 0, margin: "0 0 1.25rem" }}>
              <legend style={{ ...labelStyle, marginBottom: "0.55rem" }}>{labels.slotLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {labels.slots.map((slot) => {
                  const choisi = rappel === slot.value;
                  return (
                    <label
                      key={slot.value}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "9px 14px",
                        fontSize: "0.8rem",
                        color: choisi ? "#F0F5FF" : "#C8D8EE",
                        backgroundColor: choisi ? "rgba(107,159,238,0.14)" : "#040B16",
                        border: `1px solid ${choisi ? "#6B9FEE" : "#1B3055"}`,
                        cursor: "pointer",
                        transition: "border-color 0.2s, color 0.2s, background-color 0.2s",
                        outline: rappelFocus === slot.value ? "2px solid #6B9FEE" : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      <input
                        type="radio"
                        name={`${titleId}-rappel`}
                        value={slot.value}
                        checked={choisi}
                        onChange={() => setRappel(slot.value)}
                        onFocus={() => setRappelFocus(slot.value)}
                        onBlur={() => setRappelFocus("")}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                      />
                      {slot.label}
                    </label>
                  );
                })}
              </div>
              {/* Les quatre pastilles couvrent la demi-journée : l'heure au
                  quart d'heure près se dit dans le mot libre, juste dessous. */}
              <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: "#7BA5DC" }}>
                {labels.slotHint}
              </p>
            </fieldset>

            <div className="mb-6">
              <label style={labelStyle} htmlFor={`${titleId}-msg`}>{labels.messageLabel}</label>
              <textarea
                id={`${titleId}-msg`}
                name="message"
                rows={3}
                placeholder={labels.messagePlaceholder}
                style={{ ...fieldStyle, resize: "none" }}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full text-xs font-bold tracking-[0.2em] uppercase py-4 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)",
                color: "#070F1E",
                border: "none",
                cursor: status === "sending" ? "default" : "pointer",
              }}
            >
              {status === "sending" ? labels.submitting : labels.submit}
            </button>

            <p className="mt-4 text-[11px] leading-relaxed text-center" style={{ color: "#7BA5DC" }}>
              {labels.privacy}
            </p>

            {status === "error" && (
              <div
                className="mt-4 p-4 text-[13px]"
                style={{ borderLeft: "2px solid #F0B860", backgroundColor: "#040B16", color: "#F0B860" }}
              >
                {labels.errorMsg}
              </div>
            )}
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
