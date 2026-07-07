/* Base partagée : les 6 étapes de /methode, en D / E / F. */

export type Step = {
  num: string;
  title: string;
  description: string; // multi-ligne (séparé par \n)
  tagline: string;
};

export const STEPS: Step[] = [
  { num: "01", title: "Comprendre votre recherche", description: "Tout commence par un échange. On cerne ensemble votre projet : le modèle, le budget, la configuration et l'usage que vous en ferez.\nQuelques questions bien ciblées suffisent pour viser juste dès le départ.", tagline: "Objectif : chercher juste, dès le départ." },
  { num: "02", title: "Rechercher et vous présenter les véhicules", description: "On passe l'Europe au crible, selon des critères stricts : historique, kilométrage, entretien, configuration et prix compétitif.\nVous recevez une sélection resserrée et commentée, photos et rapport à l'appui. À vous de choisir.", tagline: "Nous ne cherchons pas une voiture disponible. Nous cherchons le bon exemplaire." },
  { num: "03", title: "Enquêter en profondeur", description: "Vos favoris identifiés, on enquête pour de vrai : documents, historique complet, entretien, cohérence du kilométrage, conformité et points du modèle.\nVous tranchez en toute connaissance de cause, sans angle mort.", tagline: "Ce que nous savons, vous le savez aussi." },
  { num: "04", title: "Gérer l'import pour vous", description: "Importer seul, c'est une vraie galère : les démarches sont nombreuses et complexes. Nous nous en occupons de A à Z, vous ne touchez à rien.", tagline: "Notre métier : rendre l'achat d'un véhicule importé aussi simple qu'un achat en France, voire plus simple encore." },
  { num: "05", title: "Livrer une expérience premium", description: "Le véhicule est préparé, documenté et remis avec soin, comme il se doit.\nEt l'accompagnement ne s'arrête pas à la remise des clés : on reste là si vous en avez besoin.", tagline: "La remise des clés n'est pas une fin. C'est le début de la relation." },
  { num: "06", title: "Accompagnement après-vente", description: "On reste disponibles bien après la livraison.\nLe jour où vous voudrez revendre, on s'en occupe. Et pour l'entretien, un conseil est toujours à portée de message.", tagline: "Une relation qui dure, pas une simple transaction." },
];

/* Sous-étapes d'import affichées dans l'étape 04. [[...]] = surligné magenta (plaques WW). */
export const IMPORT_STEPS = [
  "Certificat de conformité européen, obtenu auprès de la marque.",
  "Certificat provisoire d'immatriculation : [[les fameuses plaques WW]].",
  "Quitus fiscal, dès l'arrivée en France.",
  "Immatriculation définitive à l'ANTS, près de 20 pièces à réunir.",
];

export const NUM_GRADIENT = {
  backgroundImage: "linear-gradient(150deg, #6B9FEE 0%, #C6CCD6 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/* Rend le texte en colorant en magenta ce qui est entre [[ ]]. */
export function Pinked({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[|\]\]/).map((part, j) =>
        j % 2 === 1 ? (
          <span key={j} style={{ color: "#FF14E1", fontWeight: 700 }}>{part}</span>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </>
  );
}

/* Description multi-ligne → paragraphes. */
export function Lines({ text, color = "#A8C6F4", size = "13px" }: { text: string; color?: string; size?: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} style={{ fontSize: size, lineHeight: 1.7, color, margin: i < lines.length - 1 ? "0 0 0.6rem" : 0 }}>{line}</p>
      ))}
    </>
  );
}

/* Sous-liste d'import (étape 04). */
export function ImportList() {
  return (
    <ul style={{ listStyle: "none", margin: "1.2rem 0 0", padding: 0, display: "grid", gap: "0.55rem" }}>
      {IMPORT_STEPS.map((item, k) => (
        <li key={k} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "12.5px", color: "#A8C6F4", lineHeight: 1.5 }}>
          <span style={{ color: "#6B9FEE", flexShrink: 0, fontWeight: 700, marginTop: "1px" }}>—</span>
          <span><Pinked text={item} /></span>
        </li>
      ))}
    </ul>
  );
}
