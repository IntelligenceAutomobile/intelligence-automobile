/**
 * Régime de vente affiché sur la fiche véhicule : le libellé seul, l'explication
 * à la demande.
 *
 * Le déclencheur est un vrai bouton, et la bulle s'ouvre au survol comme au
 * focus : sur ordinateur la souris suffit, sur téléphone un appui donne le focus
 * au bouton et ouvre la bulle, un appui ailleurs la referme. Aucun JavaScript
 * n'est nécessaire, le composant reste donc rendu côté serveur, comme le reste
 * de la fiche.
 *
 * L'habillage de la bulle reprend celui des encadrés du site (fond bleu nuit,
 * filet bleu léger), en poids et taille normaux : le libellé est en gras,
 * l'explication se lit comme une phrase.
 */
export default function RegimeVente({
  label,
  hint,
  id = "regime-vente-explication",
}: {
  label: string;
  hint: string;
  /** Identifiant de la bulle, à changer si le composant apparaît deux fois. */
  id?: string;
}) {
  return (
    <>
      <style>{`
        .ia-regime {
          position: relative;
          display: inline-block;
        }
        .ia-regime-valeur {
          font: inherit;
          color: inherit;
          background: none;
          border: 0;
          padding: 0;
          margin: 0;
          text-align: left;
          cursor: help;
          text-decoration: underline dotted rgba(168,198,244,0.45);
          text-underline-offset: 5px;
        }
        .ia-regime-valeur:focus-visible {
          outline: 2px solid #6B9FEE;
          outline-offset: 4px;
        }
        .ia-regime-bulle {
          position: absolute;
          left: 0;
          bottom: calc(100% + 12px);
          z-index: 50;
          width: max-content;
          max-width: 240px;
          padding: 11px 13px;
          background-color: #0A1B33;
          border: 1px solid rgba(107,159,238,0.35);
          border-radius: 8px;
          box-shadow: 0 12px 34px rgba(0,0,0,0.5);
          font-size: 12px;
          font-weight: 400;
          line-height: 1.55;
          letter-spacing: 0;
          text-transform: none;
          color: #DCE8F8;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: opacity 0.18s, transform 0.18s, visibility 0.18s;
          pointer-events: none;
        }
        .ia-regime:hover .ia-regime-bulle,
        .ia-regime-valeur:focus + .ia-regime-bulle {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>

      <span className="ia-regime">
        {/* `title` en plus de la bulle : les lecteurs d'écran et les navigateurs
            anciens gardent ainsi l'explication. */}
        <button type="button" className="ia-regime-valeur" title={hint} aria-describedby={id}>
          {label}
        </button>
        <span className="ia-regime-bulle" role="tooltip" id={id}>
          {hint}
        </span>
      </span>
    </>
  );
}
