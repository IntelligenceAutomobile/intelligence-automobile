"use client";

import { useState } from "react";

interface Props {
  images: string[];
  alt: string;
  imgOpacity?: number;
  children?: React.ReactNode;
}

export default function HeroCarousel({ images, alt, imgOpacity = 0.8, children }: Props) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const src = images[idx] ?? null;

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="relative w-full" style={{ height: "70vh", minHeight: "420px", paddingTop: "80px" }}>
      {src ? (
        <img
          src={src}
          alt={`${alt} — ${idx + 1}/${total}`}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: imgOpacity }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#0D1A2D" }}>
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#1B3055" }}>
            Photos à venir
          </span>
        </div>
      )}

      {/* Overlays gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,15,30,0.4) 0%, transparent 40%, #070F1E 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #070F1E 0%, transparent 28%)" }} />

      {/* Navigation — uniquement si plusieurs images */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              backgroundColor: "rgba(7,15,30,0.65)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(27,48,85,0.7)",
              color: "#8AABD4", cursor: "pointer", fontSize: "1.25rem",
            }}
            aria-label="Photo précédente"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              backgroundColor: "rgba(7,15,30,0.65)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(27,48,85,0.7)",
              color: "#8AABD4", cursor: "pointer", fontSize: "1.25rem",
            }}
            aria-label="Photo suivante"
          >
            ›
          </button>

          {/* Compteur + dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "rgba(138,171,212,0.6)" }}>
              {idx + 1} / {total}
            </span>
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  style={{
                    width: i === idx ? "22px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    backgroundColor: i === idx ? "#6B9FEE" : "rgba(107,159,238,0.3)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.2s ease, background-color 0.2s ease",
                  }}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Contenu absolu passé en children (bouton retour, badge statut…) */}
      {children}
    </div>
  );
}
