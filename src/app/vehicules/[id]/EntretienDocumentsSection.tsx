"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

type MaintenanceEntry = {
  date: string;
  km: string;
  operation: string;
  amount?: string;
  linkedDoc?: string;
};

type MaintenanceHighlight = { icon: string; label: string; text: string; color: string };
type DocItem = { url: string; label?: string };

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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

const VISIBLE_COUNT = 5;

export default function EntretienDocumentsSection({
  maintenance,
  documents,
  interventionsLabel,
  showMoreLabel,
  showLessLabel,
  highlights = [],
  previewUnlocked = false,
}: {
  maintenance: MaintenanceEntry[];
  documents: (string | DocItem)[];
  interventionsLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
  highlights?: MaintenanceHighlight[];
  previewUnlocked?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const isUnlocked = unlocked || previewUnlocked;
  const [error, setError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pendingDoc, setPendingDoc] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Normalise les documents : legacy (chemin string) OU structuré ({url,label})
  const docs = useMemo<{ url: string; label: string }[]>(
    () =>
      documents.map((d) => {
        if (typeof d === "string") {
          const filename = d.split("/").pop() ?? d;
          return { url: d, label: DOC_LABELS[filename] ?? filename };
        }
        const filename = d.url.split("/").pop() ?? d.url;
        return { url: d.url, label: d.label || DOC_LABELS[filename] || filename };
      }),
    [documents]
  );
  // linkedDoc peut être une URL complète (nouveau) ou un nom de fichier (legacy)
  const findDocIndex = (ref: string) =>
    docs.findIndex((d) => d.url === ref || d.url.endsWith("/" + ref));

  // Collapse only if it hides at least 2 entries
  const collapsible = maintenance.length > VISIBLE_COUNT + 1;
  const visibleEntries = collapsible && !expanded ? maintenance.slice(0, VISIBLE_COUNT) : maintenance;
  const hiddenEntries = maintenance.slice(VISIBLE_COUNT);
  const hiddenYears = hiddenEntries
    .map((e) => e.date.match(/\d{4}/)?.[0])
    .filter((y): y is string => Boolean(y));
  const yearRange =
    hiddenYears.length > 1 && hiddenYears[0] !== hiddenYears[hiddenYears.length - 1]
      ? ` (${hiddenYears[hiddenYears.length - 1]} → ${hiddenYears[0]})`
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = false;
    try {
      const res = await fetch("/api/verify-doc-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      valid = (await res.json()).valid === true;
    } catch {
      valid = false;
    }
    if (valid) {
      setUnlocked(true);
      setError(false);
      // If user clicked a linked entry before unlocking, open it now
      if (pendingDoc) {
        const idx = findDocIndex(pendingDoc);
        if (idx >= 0) setLightboxIndex(idx);
        setPendingDoc(null);
      }
    } else {
      setError(true);
      setPassword("");
    }
  }

  function handleLinkedEntryClick(linkedDoc: string) {
    if (isUnlocked) {
      const idx = findDocIndex(linkedDoc);
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
    setLightboxIndex((i) => (i !== null ? (i - 1 + docs.length) % docs.length : null));
  }, [docs.length]);
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % docs.length : null));
  }, [docs.length]);

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

  const currentDoc = lightboxIndex !== null ? docs[lightboxIndex] : null;
  const currentLabel = currentDoc?.label ?? "";

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
              {lightboxIndex + 1} / {docs.length}
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
              src={currentDoc.url}
              alt={currentLabel}
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
        <div className="flex items-center justify-end mb-5">
          {maintenance.length > 0 && (
            <span
              className="text-[12px] tracking-[0.15em] uppercase font-bold px-3 py-1.5"
              style={{
                backgroundColor: "rgba(107,159,238,0.15)",
                border: "1px solid rgba(107,159,238,0.3)",
                color: "#6B9FEE",
                borderRadius: "4px",
              }}
            >
              {maintenance.length} {interventionsLabel}
            </span>
          )}
        </div>

        {highlights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="flex flex-col gap-2.5 px-4 py-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(160deg, ${rgba(h.color, 0.12)} 0%, ${rgba(h.color, 0.03)} 100%)`,
                  border: `1px solid ${rgba(h.color, 0.3)}`,
                  borderTop: `2px solid ${h.color}`,
                  borderRadius: "8px",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      fontSize: "13px",
                      width: "1.6rem",
                      height: "1.6rem",
                      backgroundColor: rgba(h.color, 0.15),
                      borderRadius: "6px",
                      color: h.color,
                    }}
                  >
                    {h.icon}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.2em] uppercase font-bold"
                    style={{ color: h.color }}
                  >
                    {h.label}
                  </span>
                </div>
                <p className="text-[13.5px] leading-snug" style={{ color: "#E8F0FC", fontWeight: 500 }}>
                  {h.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {maintenance.length > 0 ? (
          <div style={{ border: "1px solid rgba(107,159,238,0.18)" }}>
            {visibleEntries.map((entry, i) => {
              // Lien actif seulement si le document référencé existe encore (pas de clic mort)
              const isLinked = entry.linkedDoc ? findDocIndex(entry.linkedDoc) >= 0 : false;
              const isCT = /contrôle technique|ct favorable/i.test(entry.operation);
              return (
                <div
                  key={i}
                  className={isLinked ? "group cursor-pointer" : ""}
                  onClick={isLinked ? () => handleLinkedEntryClick(entry.linkedDoc!) : undefined}
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(107,159,238,0.15)" : "none",
                    backgroundColor: i % 2 === 0 ? "rgba(107,159,238,0.05)" : "transparent",
                    transition: isLinked ? "background-color 0.15s" : undefined,
                  }}
                  onMouseEnter={isLinked ? (e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(107,159,238,0.07)"; } : undefined}
                  onMouseLeave={isLinked ? (e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = i % 2 === 0 ? "rgba(107,159,238,0.05)" : "transparent"; } : undefined}
                >
                  <div className="px-5 py-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                      <span
                        className="text-[12px] tracking-[0.1em] uppercase font-bold inline-block"
                        style={{
                          color: isCT ? "#5BD89A" : "#6B9FEE",
                          backgroundColor: isCT ? "rgba(91,216,154,0.1)" : "rgba(107,159,238,0.1)",
                          border: isCT ? "1px solid rgba(91,216,154,0.3)" : "1px solid rgba(107,159,238,0.25)",
                          borderRadius: "5px",
                          padding: "0.4rem 0.6rem",
                        }}
                      >
                        {entry.date}
                      </span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isLinked && (
                          <span
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              color: "#6B9FEE",
                              fontSize: "12px",
                              width: "1.75rem",
                              height: "1.75rem",
                              backgroundColor: "rgba(107,159,238,0.12)",
                              borderRadius: "50%",
                            }}
                            title="Voir la facture"
                          >
                            📄
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[15px] leading-snug" style={{ color: "#E8F0FC" }}>
                      {entry.operation}
                    </p>
                    {entry.km && entry.km !== "—" && (
                      <p className="text-[13px] mt-1.5" style={{ color: "#8FB4F0" }}>
                        {entry.km}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {collapsible && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-4 text-[12px] tracking-[0.15em] uppercase font-bold transition-colors"
                style={{
                  borderTop: "1px solid rgba(107,159,238,0.15)",
                  backgroundColor: "rgba(107,159,238,0.08)",
                  color: "#6B9FEE",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(107,159,238,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(107,159,238,0.08)"; }}
              >
                <span style={{ fontSize: "10px" }}>{expanded ? "▲" : "▼"}</span>
                {expanded
                  ? showLessLabel
                  : `${showMoreLabel.replace("%n", String(hiddenEntries.length))}${yearRange}`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "rgba(107,159,238,0.45)" }}>
            Historique d&apos;entretien non renseigné pour ce véhicule.
          </p>
        )}
      </div>

      {/* ── FACTURES & DOCUMENTS ── */}
      {docs.length > 0 && (
        <div>
          <p className="text-sm tracking-[0.25em] uppercase font-bold mb-5" style={{ color: "#F0F5FF" }}>
            Factures &amp; Documents
          </p>

          {!isUnlocked ? (
            <div>
              {pendingDoc && (
                <p className="text-xs mb-4" style={{ color: "#6B9FEE" }}>
                  Entrez le mot de passe pour accéder à la facture associée.
                </p>
              )}
              <div
                className="flex items-center gap-3 px-4 py-3 mb-6"
                style={{
                  backgroundColor: "rgba(107,159,238,0.05)",
                  border: "1px solid rgba(107,159,238,0.15)",
                  borderRadius: "6px",
                }}
              >
                <span style={{ color: "#6B9FEE", fontSize: "15px" }}>🔒</span>
                <p className="text-[14px]" style={{ color: "#E8F0FC" }}>
                  Les documents de ce véhicule sont protégés. Contactez-nous pour obtenir le code d&apos;accès.
                </p>
              </div>
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
              {docs.map((doc, i) => (
                <div
                  key={doc.url}
                  style={{ backgroundColor: "#0D1F3C", cursor: "pointer" }}
                  onClick={() => setLightboxIndex(i)}
                >
                  <p
                    className="text-[10px] tracking-[0.25em] uppercase px-4 py-3"
                    style={{ color: "#C8D8EE", borderBottom: "1px solid #1B3055" }}
                  >
                    {doc.label}
                  </p>
                  <img
                    src={doc.url}
                    alt={doc.label}
                    className="w-full h-auto transition-opacity hover:opacity-80"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
