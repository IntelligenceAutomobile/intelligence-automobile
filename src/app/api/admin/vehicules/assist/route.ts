import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/auth";

// Schéma de sortie structuré, calqué sur les champs du formulaire véhicule.
// Tous les champs sont requis ; le modèle met une valeur sentinelle ("" / 0 / [])
// quand l'info est absente, et le client filtre ces valeurs vides au pré-remplissage.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    make: { type: "string", description: "Marque (ex: Audi)" },
    model: { type: "string", description: "Modèle + finition (ex: TT 2.0 TFSI 230 S line)" },
    year: { type: "integer", description: "Année de mise en circulation, 0 si inconnue" },
    mileage: { type: "integer", description: "Kilométrage en km, 0 si inconnu" },
    price: { type: "integer", description: "Prix en euros, 0 si inconnu" },
    color: { type: "string", description: "Couleur (ex: Gris Daytona métallisé)" },
    fuel: { type: "string", enum: ["Diesel", "Essence", "Hybride", "Électrique", ""] },
    transmission: { type: "string", enum: ["Automatique", "Manuelle", ""] },
    power: { type: "integer", description: "Puissance en ch, 0 si inconnue" },
    origin: { type: "string", enum: ["Allemagne", "Belgique", "Autre UE", ""] },
    description: { type: "string", description: "Texte de présentation en français, 2 à 3 paragraphes séparés par une ligne vide" },
    features: { type: "array", items: { type: "string" }, description: "Équipements, un par entrée" },
    conditionFacts: { type: "array", items: { type: "string" }, description: "Faits rassurants courts (ex: Aucun accident déclaré, Carnet d'entretien complet)" },
    maintenanceHistory: {
      type: "array",
      description: "Historique d'entretien : une entrée par intervention, de la plus récente à la plus ancienne. [] si rien n'est documenté dans la source.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string", description: "Date courte « Mois Année », ex: « Fév. 2026 ». \"\" si inconnue." },
          km: { type: "string", description: "Kilométrage à l'intervention, ex: « 147 000 km ». \"\" si inconnu." },
          operation: { type: "string", description: "Opération concise : pièces/prestations, garage si connu." },
          amount: { type: "string", description: "Montant TTC, ex: « 301,89 € ». \"\" si non indiqué." },
        },
        required: ["date", "km", "operation", "amount"],
      },
    },
    maintenanceHighlights: {
      type: "array",
      description: "Badges de traçabilité résumant l'historique (carnet, factures, contrôle technique). [] si non justifié par la source.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          icon: { type: "string", description: "Un seul emoji, ex: « 📓 », « 🧾 », « ✓ »." },
          label: { type: "string", description: "Titre court, ex: « Carnet d'origine »." },
          text: { type: "string", description: "Détail court, ex: « Tampons concession 2010 → 2023 »." },
        },
        required: ["icon", "label", "text"],
      },
    },
  },
  required: [
    "make", "model", "year", "mileage", "price", "color", "fuel",
    "transmission", "power", "origin", "description", "features", "conditionFacts",
    "maintenanceHistory", "maintenanceHighlights",
  ],
} as const;

const SYSTEM = `Tu es l'assistant de saisie d'annonces d'un marchand automobile haut de gamme (Intelligence Automobile).
À partir d'une source brute fournie par l'utilisateur (annonce mobile.de/leboncoin, notes, fiche technique, texte d'un contrôle technique…), tu remplis une fiche véhicule structurée.

Règles :
- N'invente jamais une caractéristique absente de la source. Si une information manque, utilise la valeur vide : "" pour le texte, 0 pour les nombres, [] pour les listes.
- Normalise fuel, transmission et origin sur les valeurs autorisées du schéma. Si tu ne peux pas trancher, laisse "".
- "description" : rédige un texte de présentation commercial en français soigné, factuel, sans superlatifs creux ni emojis. 2 à 3 courts paragraphes séparés par une ligne vide. Ne répète pas dans la description les faits que tu mets dans conditionFacts.
- "features" : liste d'équipements concis (ex: "Toit panoramique", "Apple CarPlay", "Jantes alliage"). Pas de phrases.
- "conditionFacts" : faits courts et rassurants sur l'état/l'historique (ex: "Aucun accident déclaré", "Contrôle technique valide jusqu'au 28/01/2028", "Première main"). Uniquement s'ils figurent dans la source.
- "maintenanceHistory" : si la source contient un carnet d'entretien, des factures ou un historique, liste chaque intervention de la plus récente à la plus ancienne. Pour chaque entrée : date courte "Mois Année" (ex: "Fév. 2026"), kilométrage avec unité (ex: "147 000 km"), opération concise (pièces/prestations + garage si connu), montant TTC (ex: "301,89 €") seulement si la source l'indique. N'invente aucune intervention ni montant. Si rien n'est documenté, renvoie [].
- "maintenanceHighlights" : 0 à 3 badges courts qui résument la traçabilité, uniquement si la source les justifie (ex: { icon: "📓", label: "Carnet d'origine", text: "Tampons concession 2010 → 2023" } si un carnet est mentionné ; { icon: "🧾", label: "Factures originales", text: "…" } si des factures sont fournies ; { icon: "✓", label: "Contrôle technique", text: "…" } si un CT favorable est présent). Sinon [].
- Les nombres (année, km, prix, puissance) sont des entiers sans séparateur ni unité.`;

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Clé ANTHROPIC_API_KEY absente du .env. Ajoutez-la puis redémarrez le serveur." },
      { status: 500 }
    );
  }

  let raw: string;
  try {
    raw = (await req.json()).raw;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!raw || !raw.trim()) {
    return NextResponse.json({ error: "Collez d'abord une source à analyser." }, { status: 400 });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: raw }],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur génération";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
