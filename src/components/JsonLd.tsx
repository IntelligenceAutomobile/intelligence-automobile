// Données structurées (schema.org) lues par Google pour comprendre le site et
// afficher des résultats enrichis. Voir src/lib/jsonld.ts pour les objets.

export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Les `<` sont échappés : une description de véhicule saisie au back-office
      // pourrait sinon refermer la balise <script>.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
