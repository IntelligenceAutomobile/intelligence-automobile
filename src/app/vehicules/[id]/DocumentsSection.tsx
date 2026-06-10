"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function DocumentsSection({
  documents,
  embedded = false,
}: {
  documents: string[];
  embedded?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === "Password123!") {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
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

  const lightbox = lightboxIndex !== null && currentDoc && (
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
        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 border transition-colors"
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
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 border transition-colors"
        style={{ borderColor: "#1B3055", color: "#C8D8EE", backgroundColor: "#0D1F3C" }}
        aria-label="Suivant"
      >
        →
      </button>
    </div>
  );

  const content = !unlocked ? (
    <div>
      <p className="text-sm mb-6" style={{ color: "#C8D8EE" }}>
        Les documents de ce véhicule sont protégés. Contactez-nous pour obtenir le code d&apos;accès.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm">
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Mot de passe"
          className="flex-1 px-4 py-3 border text-sm outline-none focus:border-[#6B9FEE]"
          style={{
            backgroundColor: "#112240",
            borderColor: error ? "#FF6B35" : "#1B3055",
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
  );

  if (embedded) {
    return (
      <>
        {lightbox}
        {content}
      </>
    );
  }

  return (
    <>
      {lightbox}
      <div className="border-t pb-20" style={{ borderColor: "#1B3055", paddingTop: "3rem" }}>
        <p className="text-[9px] tracking-[0.35em] uppercase mb-8" style={{ color: "#C8D8EE" }}>
          Documents
        </p>
        {content}
      </div>
    </>
  );
}
