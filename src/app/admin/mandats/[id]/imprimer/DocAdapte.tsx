"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Largeur d'une feuille A4 à 96 points par pouce. */
const A4_W = 793.7;

/**
 * Met le contrat à l'échelle de l'écran quand celui-ci est plus étroit qu'une
 * feuille A4. Le vendeur ouvre son mandat depuis un email, donc le plus souvent
 * sur un téléphone : sans cette réduction, il voyait la moitié gauche du
 * contrat et devait faire glisser chaque page pour lire la fin des phrases.
 *
 * Au-delà de 794 px de large, le document garde sa taille réelle. À
 * l'impression, la réduction disparaît : le papier reprend ses 210 mm.
 *
 * TANT QUE LA MESURE N'A PAS EU LIEU, le document reste dans le flux, à sa
 * taille réelle, dans un cadre qui défile. C'est exactement ce que faisait la
 * page avant cette réduction, et c'est ce que le serveur envoie : la page se
 * tient donc toute seule, sans attendre le JavaScript. Poser d'emblée les
 * dimensions réduites reviendrait à servir un contrat sorti du flux au-dessus
 * du formulaire de signature, le temps que le navigateur charge le script.
 */
export default function DocAdapte({ children }: { children: ReactNode }) {
  const cadreRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  // Zéro vaut « pas encore mesuré » : aucune échelle utile ne vaut zéro.
  const [scale, setScale] = useState(0);
  const [hauteur, setHauteur] = useState(0);
  const pret = scale > 0 && hauteur > 0;

  // L'observateur se déclenche dès la mise en place : inutile de poser
  // l'échelle à la main, ce que la règle des effets refuse. Il suit aussi la
  // hauteur du document, qui dépend du contenu de chaque contrat.
  useEffect(() => {
    const cadre = cadreRef.current;
    const doc = docRef.current;
    if (!cadre || !doc) return;
    const mesurer = () => {
      const large = cadre.clientWidth;
      if (large <= 0) return;
      const s = Math.min(1, large / A4_W);
      setScale(s);
      setHauteur(doc.scrollHeight * s);
    };
    const ro = new ResizeObserver(mesurer);
    ro.observe(cadre);
    ro.observe(doc);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print {
  .mandat-cadre, .mandat-boite { width: auto !important; height: auto !important; overflow: visible !important; }
  .mandat-echelle { position: static !important; transform: none !important; }
}`,
        }}
      />
      <div
        ref={cadreRef}
        className="mandat-cadre"
        // Avant la mesure, le cadre absorbe le débordement du document, comme
        // le faisait le conteneur d'origine. Une fois à l'échelle, il tient
        // dans l'écran et le cadre redevient transparent au débordement.
        style={{ width: "100%", overflowX: pret ? "visible" : "auto" }}
      >
        {/* La boîte porte les dimensions réduites : c'est elle qui occupe la
            place dans la page. Le document, sorti du flux, se contente d'y
            rentrer. Avant la mesure, la boîte laisse simplement passer le
            document, qui garde sa place naturelle. */}
        <div
          className="mandat-boite"
          style={
            pret
              ? { position: "relative", width: A4_W * scale, height: hauteur, margin: "0 auto" }
              : undefined
          }
        >
          <div
            className="mandat-echelle"
            style={
              pret
                ? { position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }
                : undefined
            }
          >
            <div ref={docRef} style={{ width: A4_W }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
