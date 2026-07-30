// Mappers entre le corps de requête / ligne Prisma et l'objet devis applicatif.
// Module neutre (pas de dépendance Prisma/React).
import { mergeBranding, mergeVehicleBlock, isEuCountry, normalizeVat } from "./devis";
import { parisDay } from "./vehicules";

export function quoteToData(body: Record<string, unknown>) {
  const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
  const num = (v: unknown, d: number) => {
    const x = typeof v === "number" ? v : parseFloat(String(v));
    return isNaN(x) ? d : x;
  };
  return {
    number: s(body.number),
    kind: body.kind === "prestation" ? "prestation" : "vehicule",
    status: s(body.status, "brouillon"),
    docType: body.docType === "facture" ? "facture" : "devis",
    factureKind: body.factureKind === "acompte" || body.factureKind === "solde" ? body.factureKind : "complete",
    paymentStatus: body.paymentStatus === "payee" ? "payee" : "impayee",
    paidDate: s(body.paidDate),
    sourceQuoteId: body.sourceQuoteId ? String(body.sourceQuoteId) : null,
    clientName: s(body.clientName),
    clientCompany: s(body.clientCompany),
    clientAddress: s(body.clientAddress),
    clientEmail: s(body.clientEmail),
    clientPhone: s(body.clientPhone),
    // Pays borné à la liste connue et numéro de TVA nettoyé à l'entrée : un
    // « BE 0123.456.749 » collé d'un mail devient « BE0123456749 ».
    clientCountry: isEuCountry(s(body.clientCountry)) ? s(body.clientCountry) : "FR",
    clientVatNumber: normalizeVat(s(body.clientVatNumber)),
    // Langue du document remis au client : toute autre valeur retombe en français.
    docLang: body.docLang === "en" ? "en" : "fr",
    // Format contrôlé : une date illisible rendait le document invisible du
    // centre de relances, silencieusement et pour toujours. Repli en jour de
    // Paris : le runtime UTC datait de la veille un document créé le soir.
    issueDate: /^\d{4}-\d{2}-\d{2}$/.test(s(body.issueDate)) ? s(body.issueDate) : parisDay(new Date()).toISOString().slice(0, 10),
    validityDays: Math.round(num(body.validityDays, 30)),
    items: JSON.stringify(Array.isArray(body.items) ? body.items : []),
    tvaMode: s(body.tvaMode, "marge"),
    tvaRate: Math.round(num(body.tvaRate, 20)),
    depositMode: s(body.depositMode, "percent"),
    depositValue: num(body.depositValue, 0),
    paymentTerms: s(body.paymentTerms),
    notes: s(body.notes),
    vehicleId: body.vehicleId ? String(body.vehicleId) : null,
    clientId: body.clientId ? String(body.clientId) : null,
    branding: JSON.stringify(body.branding && typeof body.branding === "object" ? body.branding : {}),
    // Identité du véhicule figée au document : nettoyée à l'entrée (capitales du
    // numéro de série, bornes de longueur) plutôt qu'à chaque affichage.
    vehicleInfo: JSON.stringify(mergeVehicleBlock(body.vehicle)),
  };
}

export function quoteFromRow<T extends { items: string; branding?: string; vehicleInfo?: string }>(row: T) {
  let items: unknown[] = [];
  try {
    const p = JSON.parse(row.items);
    if (Array.isArray(p)) items = p;
  } catch {
    /* ignore */
  }
  let brandingRaw: unknown = {};
  try {
    brandingRaw = JSON.parse(row.branding ?? "{}");
  } catch {
    /* ignore */
  }
  let vehicleRaw: unknown = {};
  try {
    vehicleRaw = JSON.parse(row.vehicleInfo ?? "{}");
  } catch {
    /* ignore */
  }
  return { ...row, items, branding: mergeBranding(brandingRaw), vehicle: mergeVehicleBlock(vehicleRaw) };
}
