"use client";

import { useState, useEffect, useCallback } from "react";

export default function GalleryLightbox({ images, alt }: { images: string[]; alt: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null), [images.length]);
  const next = useCallback(() => setLightboxIndex((i) => i !== null ? (i + 1) % images.length : null), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prev, next, close]);

  return (
    <>
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(7,15,30,0.96)" }}
          onClick={close}
        >
          <button
            onClick={close}
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
            {lightboxIndex + 1} / {images.length}
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={prev}
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(10,22,40,0.85)", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
              aria-label="Précédente"
            >
              ‹
            </button>
            <img
              src={images[lightboxIndex]}
              alt={`${alt} — ${lightboxIndex + 1}`}
              className="object-contain"
              style={{ maxHeight: "88vh", maxWidth: "calc(90vw - 120px)" }}
            />
            <button
              onClick={next}
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(10,22,40,0.85)", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
              aria-label="Suivante"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Grille */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ backgroundColor: "#1B3055" }}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="overflow-hidden relative group"
            style={{ aspectRatio: "16/10", backgroundColor: "#070F1E" }}
          >
            <img
              src={img}
              alt={`${alt} — photo ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
              style={{ backgroundColor: "rgba(107,159,238,0.08)" }}
            >
              <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#F0F5FF" }}>Agrandir</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
