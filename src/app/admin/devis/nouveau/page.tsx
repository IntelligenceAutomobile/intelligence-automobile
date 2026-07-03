import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emptyQuote, mergeBranding, type QuoteKind } from "@/lib/devis";
import { T, AdminPage, PageHeader } from "../../ui";
import DevisEditor from "../DevisEditor";

export default async function NouveauDevisPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { client: clientIdParam } = await searchParams;

  const year = new Date().getFullYear();
  const [vehicles, count, last] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true, mileage: true, price: true, fuel: true, transmission: true, power: true },
    }),
    prisma.quote.count({ where: { number: { startsWith: `${year}-` } } }),
    // Reprend l'émetteur/logo + le type du dernier devis comme valeurs par défaut (repli sur company.ts).
    prisma.quote.findFirst({ orderBy: { updatedAt: "desc" }, select: { branding: true, kind: true } }),
  ]);

  let lastBranding: unknown = {};
  try {
    lastBranding = JSON.parse(last?.branding ?? "{}");
  } catch {
    /* ignore */
  }
  const lastKind: QuoteKind = last?.kind === "prestation" ? "prestation" : "vehicule";

  const number = `${year}-${String(count + 1).padStart(3, "0")}`;
  const issueDate = new Date().toISOString().slice(0, 10);
  const initial = emptyQuote(number, issueDate, mergeBranding(lastBranding), lastKind);

  // Pré-remplissage depuis la fiche client CRM (?client=<id>).
  if (clientIdParam) {
    const crmClient = await prisma.client.findUnique({ where: { id: clientIdParam } });
    if (crmClient) {
      initial.clientId = crmClient.id;
      initial.clientName = crmClient.name;
      initial.clientCompany = crmClient.company;
      initial.clientEmail = crmClient.email;
      initial.clientPhone = crmClient.phone;
    }
  }

  return (
    <AdminPage>
      <Link href="/admin/devis" className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }}>
        ← Devis
      </Link>
      <PageHeader title="Nouveau devis" subtitle="Le document se met à jour en direct dans l'aperçu." />
      <DevisEditor initial={initial} vehicles={vehicles} isEdit={false} />
    </AdminPage>
  );
}
