// Mappers entre le corps de requête / ligne Prisma et l'objet devis applicatif.
// Module neutre (pas de dépendance Prisma/React).
import { mergeBranding } from "./devis";

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
    clientName: s(body.clientName),
    clientCompany: s(body.clientCompany),
    clientAddress: s(body.clientAddress),
    clientEmail: s(body.clientEmail),
    clientPhone: s(body.clientPhone),
    issueDate: s(body.issueDate) || new Date().toISOString().slice(0, 10),
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
  };
}

export function quoteFromRow<T extends { items: string; branding?: string }>(row: T) {
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
  return { ...row, items, branding: mergeBranding(brandingRaw) };
}
