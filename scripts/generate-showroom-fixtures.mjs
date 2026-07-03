// Régénère src/lib/showroom-fixtures.json depuis le stock réel publié.
// À relancer quand on veut rafraîchir le catalogue de démonstration.
import { createClient } from "@libsql/client";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const rs = await client.execute(
  `SELECT make, model, year, mileage, price, color, transmission, fuel, power, origin,
          description, descriptionEn, features, featuresEn, images, conditionFacts,
          maintenanceHistory, maintenanceHighlights, documents
   FROM Vehicle WHERE isPublished = 1 ORDER BY createdAt DESC LIMIT 8`,
);

const vehicles = rs.rows.map((r) => ({
  make: r.make,
  model: r.model,
  year: Number(r.year),
  mileage: Number(r.mileage),
  price: Number(r.price),
  color: r.color,
  transmission: r.transmission,
  fuel: r.fuel,
  power: r.power == null ? null : Number(r.power),
  origin: r.origin,
  description: r.description,
  descriptionEn: r.descriptionEn,
  features: r.features,
  featuresEn: r.featuresEn,
  images: r.images,
  conditionFacts: r.conditionFacts,
  maintenanceHistory: r.maintenanceHistory,
  maintenanceHighlights: r.maintenanceHighlights,
  documents: r.documents,
}));

const out = resolve(__dirname, "../src/lib/showroom-fixtures.json");
writeFileSync(out, JSON.stringify({ vehicles }, null, 2), "utf-8");
console.log(`✅ ${vehicles.length} véhicules exportés vers src/lib/showroom-fixtures.json`);
client.close();
