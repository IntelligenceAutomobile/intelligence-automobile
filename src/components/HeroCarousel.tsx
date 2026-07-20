"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  images: string[];
  alt: string;
  imgOpacity?: number;
  /** Barre haute du hero (retour à gauche, statut à droite). Deux éléments
   *  attendus : ils sont répartis aux extrémités de la grille de contenu. */
  topBar?: React.ReactNode;
}

export default function HeroCarousel({ images, alt, imgOpacity = 0.8, topBar }: Props) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const src = images[idx] ?? null;

  // Le header est fixed et semi-opaque : une photo qui monte jusqu'en haut du
  // cadre passe dessous et perd le toit du véhicule. Sa hauteur varie selon le
  // breakpoint (nav desktop) et le contenu du logo → mesurée, avec suivi du resize.
  // Mesure suivie par ResizeObserver : au montage le logo est parfois encore en
  // cours de chargement et le header grandit après coup. Un simple listener de
  // resize garde alors une valeur périmée, et la barre haute retombe sur la nav.
  const [headerH, setHeaderH] = useState(110);
  useEffect(() => {
    // Le header est re-requêté à chaque mesure : React peut remplacer le nœud à
    // l'hydratation, et un observer accroché au nœud initial resterait sur une
    // valeur périmée. L'observation porte donc sur la racine, jamais détachée.
    const measure = () => {
      const h = document.querySelector("header")?.getBoundingClientRect().height;
      if (h) setHeaderH(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, []);

  // Bord haut de la photo RÉELLEMENT affichée. En object-contain, l'image est
  // centrée dans son cadre et laisse une bande sombre quand son format diffère
  // de celui du cadre : le haut du cadre n'est donc pas le haut de la photo.
  // Sans ce calcul, la barre flotte au-dessus de l'image au lieu de se poser
  // dans son coin. La hauteur affichée se déduit du format naturel du fichier.
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [photoTop, setPhotoTop] = useState<number | null>(null);
  const [sideBand, setSideBand] = useState(0);

  const measurePhoto = useCallback(() => {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !frame || !img.naturalWidth || !img.naturalHeight) return;
    const box = img.getBoundingClientRect();
    if (!box.height) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const shownH = Math.min(box.height, box.width / ratio);
    const shownW = Math.min(box.width, box.height * ratio);
    // Position rendue en coordonnées du cadre, seul repère utile pour un enfant
    // en position absolue.
    setPhotoTop(box.top - frame.getBoundingClientRect().top + (box.height - shownH) / 2);
    // Une photo plus étroite que la fenêtre laisse une bande de chaque côté :
    // la barre s'y rétracte pour rester dans l'image plutôt que de déborder
    // sur le fond. Bande nulle (le cas courant), la grille reprend la main.
    setSideBand((box.width - shownW) / 2);
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    measurePhoto();
    const ro = new ResizeObserver(measurePhoto);
    ro.observe(img);
    return () => ro.disconnect();
  }, [measurePhoto, src]);

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    // Plein écran en paysage ; en portrait la photo occupe une part réduite du
    // cadre (contain), 70dvh suffisent et le contenu remonte au-dessus du pli.
    <div ref={frameRef} className="relative w-full h-dvh portrait:h-[70dvh] min-h-[520px]" style={{ paddingTop: "80px" }}>
      {src ? (
        // Photo toujours entière (contain) : c'est la seule règle qui garantit
        // le véhicule complet sur chaque photo et chaque format d'écran. Les
        // abords restent sur le fond du site. Le cadre utile démarre sous le
        // header pour que le haut de la photo reste visible.
        <img
          ref={imgRef}
          onLoad={measurePhoto}
          src={src}
          alt={`${alt} — ${idx + 1}/${total}`}
          className="absolute inset-x-0 bottom-0 w-full object-contain object-center"
          style={{ opacity: imgOpacity, top: `${headerH}px`, height: `calc(100% - ${headerH}px)` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#0D1A2D" }}>
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#1B3055" }}>
            Photos à venir
          </span>
        </div>
      )}

      {/* Overlays gradient — volontairement discrets : le fondu bas ne sert qu'à
          raccorder la photo au fond du site, il démarre tard pour laisser le bas
          de caisse, les roues et l'ombre au sol visibles. Le voile haut compense
          le header fixe semi-opaque. */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,15,30,0.22) 0%, transparent 28%, transparent 70%, #070F1E 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #070F1E 0%, transparent 14%)" }} />

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
              color: "#C8D8EE", cursor: "pointer", fontSize: "1.25rem",
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
              color: "#C8D8EE", cursor: "pointer", fontSize: "1.25rem",
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

      {/* Barre haute. Verticalement elle se pose dans le coin de la photo, 20 px
          sous son bord haut réel, avec la hauteur du header comme plancher : une
          photo très letterboxée descend la barre, jamais sous le header elle ne
          remonte. Horizontalement elle suit la grille de contenu de la page, donc
          le retour tombe à la verticale du H1 et le statut à celle de la colonne
          droite, à chaque largeur de fenêtre. */}
      {topBar && (
        /* La bande traverse toute la largeur : elle laisse passer les clics,
           seules les pastilles restent cliquables. */
        <div
          className="absolute inset-x-0 z-10 pointer-events-none"
          style={{
            top: `${Math.max(headerH, photoTop ?? headerH) + 20}px`,
            paddingLeft: `${sideBand}px`,
            paddingRight: `${sideBand}px`,
            transition: "top 0.2s ease, padding 0.2s ease",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-start justify-between gap-4 [&>*]:pointer-events-auto">
            {topBar}
          </div>
        </div>
      )}
    </div>
  );
}
