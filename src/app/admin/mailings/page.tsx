import { redirect } from "next/navigation";

// L'écran Mailings a rejoint la Messagerie. Les liens « Répondre » déjà
// ouverts et les habitudes continuent de fonctionner : tout est transmis.
export default async function AncienneMailingsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; objet?: string }>;
}) {
  const p = await searchParams;
  const qs = new URLSearchParams();
  if (p.a) qs.set("a", p.a);
  if (p.objet) qs.set("objet", p.objet);
  const suffixe = qs.size > 0 ? `?${qs.toString()}` : "";
  redirect(`/admin/messagerie${suffixe}`);
}
