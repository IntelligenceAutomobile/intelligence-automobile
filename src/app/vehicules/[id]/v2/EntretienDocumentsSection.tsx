"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type MaintenanceEntry = {
  date: string;
  km: string;
  operation: string;
  amount?: string;
  linkedDoc?: string;
};

const DOC_LABELS: Record<string, string> = {
  "batterie-invoice-1.jpg": "Facture batterie (1/2)",
  "batterie-invoice-2.jpg": "Facture batterie (2/2)",
  "car-pass.jpg":           "Car-Pass",
  "carnet-entretien.jpg":   "Carnet d'entretien",
  "carte-grise-belge.jpg":  "Carte grise belge",
  "coc-audi.jpg":           "COC Audi",
  "ct-belge.jpg":           "Contrôle technique belge",
  "demande-immat.jpg":      "Demande d'immatriculation",
};

export default function EntretienDocumentsSection({
  maintenance,
  documents,
  maintenanceTitle,
  interventionsLabel,
}: {
  maintenance: MaintenanceEntry[];
  documents: string[];
  maintenanceTitle: string;
  interventionsLabel: string;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pendingDoc, setPendingDoc] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === "Password123!") {
      setUnlocked(true);
      setError(false);
      // If user clicked a linked entry before unlocking, open it now
      if (pendingDoc) {
        const idx = documents.findIndex((d) => d.endsWith("/" + pendingDoc));
        if (idx >= 0) setLightboxIndex(idx);
        setPendingDoc(null);
      }
    } else {
      setError(true);
      setPassword("");
    }
  }

  function handleLinkedEntryClick(linkedDoc: string) {
    if (unlocked) {
      const idx = documents.findIndex((d) => d.endsWith("/" + linkedDoc));
      if (idx >= 0) setLightboxIndex(idx);
    } else {
      setPendingDoc(linkedDoc);
      // Scroll password form into view and focus it
      setTimeout(() => {
        passwordRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        passwordRef.current?.focus();
      }, 50);
    }
  }

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + documents.length) % documents.length : null));
  }, [documents.length]);
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % documents.length : null));
  }, [documents.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape")     closeLightbox();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, goPrev, goNext, closeLightbox]);

  const currentDoc = lightboxIndex !== null ? documents[lightboxIndex] : null;
  const currentLabel = currentDoc
    ? (DOC_LABELS[currentDoc.split("/").pop() ?? ""] ?? currentDoc.split("/").pop())
    : "";

  return (
    <>
      {/* ── LIGHTBOX ── */}
      {lightboxIndex !== null && currentDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(7,15,30,0.95)" }}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-6 text-2xl leading-none"
            style={{ color: "#C8D8EE" }}
            aria-label="Fermer"
          >
            ✕
          </button>
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.35em] uppercase"
            style={{ color: "#C8D8EE" }}
          >
            {currentLabel}
            <span className="ml-4 opacity-50">
              {lightboxIndex + 1} / {documents.length}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 border"
            style={{ borderColor: "#1B3055", color: "#C8D8EE", backgroundColor: "#0D1F3C" }}
            aria-label="Précédent"
          >
            ←
          </button>
          <div
            className="max-w-3xl w-full mx-20 max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentDoc}
              alt={currentLabel ?? ""}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 border"
            style={{ borderColor: "#1B3055", color: "#C8D8EE", backgroundColor: "#0D1F3C" }}
            aria-label="Suivant"
          >
            →
          </button>
        </div>
      )}

      {/* ── ENTRETIEN ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#C8D8EE" }}>
            {maintenanceTitle}
          </p>
          {maintenance.length > 0 && (
            <span
              className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1"
              style={{ backgroundColor: "rgba(107,159,238,0.1)", color: "#6B9FEE", borderRadius: "4px" }}
            >
              {maintenance.length} {interventionsLabel}
            </span>
          )}
        </div>

        {maintenance.length > 0 ? (
          <div style={{ border: "1px solid rgba(107,159,238,0.18)" }}>
            {maintenance.map((entry, i) => {
              const isLinked = Boolean(entry.linkedDoc && documents.length > 0);
              return (
                <div
                  key={i}
                  className={isLinked ? "group cursor-pointer" : ""}
                  onClick={isLinked ? () => handleLinkedEntryClick(entry.linkedDoc!) : undefined}
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(107,159,238,0.08)" : "none",
                    backgroundColor: i % 2 === 0 ? "rgba(107,159,238,0.025)" : "transparent",
                    transition: isLinked ? "background-color 0.15s" : undefined,
                  }}
                  onMouseEnter={isLinked ? (e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(107,159,238,0.07)"; } : undefined}
                  onMouseLeave={isLinked ? (e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = i % 2 === 0 ? "rgba(107,159,238,0.025)" : "transparent"; } : undefined}
                >
                  <div className="flex items-start gap-4 px-5 py-4">
                    <span
                      className="text-[9px] tracking-wide flex-shrink-0 pt-px font-semibold"
                      style={{ color: "#6B9FEE", minWidth: "60px" }}
                    >
                      {entry.date}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: "#F0F5FF" }}>
                        {entry.operation}
                      </p>
                      <p className="text-[9px] mt-1" style={{ color: "rgba(107,159,238,0.55)" }}>
                        {entry.km}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {entry.amount && entry.amount !== "—" && (
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#6B9FEE" }}>
                          {entry.amount}
                        </span>
                      )}
                      {isLinked && (
                        <span
                          className="text-[9px] tracking-wide"
                          style={{ color: "rgba(107,159,238,0.5)" }}
                          title="Voir la facture"
                        >
                          📄
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "rgba(107,159,238,0.45)" }}>
            Historique d&apos;entretien non renseigné pour ce véhicule.
          </p>
        )}
      </div>

      {/* ── FACTURES & DOCUMENTS ── */}
      {documents.length > 0 && (
        <div>
          <p className="text-[9px] tracking-[0.3em] uppercase mb-5" style={{ color: "#C8D8EE" }}>
            Factures &amp; Documents
          </p>

          {!unlocked ? (
            <div>
              {pendingDoc && (
                <p className="text-xs mb-4" style={{ color: "#6B9FEE" }}>
                  Entrez le mot de passe pour accéder à la facture associée.
                </p>
              )}
              <p className="text-sm mb-6" style={{ color: "#C8D8EE" }}>
                Les documents de ce véhicule sont protégés. Contactez-nous pour obtenir le code d&apos;accès.
              </p>
              <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm">
                <input
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Mot de passe"
                  className="flex-1 px-4 py-3 border text-sm outline-none focus:border-[#6B9FEE]"
                  style={{
                    backgroundColor: "#112240",
                    borderColor: error ? "#FF6B35" : pendingDoc ? "#6B9FEE" : "#1B3055",
                    color: "#F0F5FF",
                  }}
                />
                <button
                  type="submit"
                  className="px-6 py-3 text-xs font-semibold tracking-widest uppercase"
                  style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                >
                  Accéder
                </button>
              </form>
              {error && (
                <p className="text-xs mt-3" style={{ color: "#FF6B35" }}>
                  Mot de passe incorrect
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc, i) => {
                const filename = doc.split("/").pop() ?? doc;
                const label = DOC_LABELS[filename] ?? filename;
                return (
                  <div
                    key={doc}
                    style={{ backgroundColor: "#0D1F3C", cursor: "pointer" }}
                    onClick={() => setLightboxIndex(i)}
                  >
                    <p
                      className="text-[9px] tracking-[0.25em] uppercase px-4 py-3"
                      style={{ color: "#C8D8EE", borderBottom: "1px solid #1B3055" }}
                    >
                      {label}
                    </p>
                    <img
                      src={doc}
                      alt={label}
                      className="w-full h-auto transition-opacity hover:opacity-80"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
