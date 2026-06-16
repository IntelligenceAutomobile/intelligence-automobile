import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emptyQuote } from "@/lib/devis";
import { T, AdminPage, PageHeader } from "../../ui";
import DevisEditor from "../DevisEditor";

export default async function NouveauDevisPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const year = new Date().getFullYear();
  const [vehicles, count] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true, mileage: true, price: true, fuel: true, transmission: true, power: true },
    }),
    prisma.quote.count({ where: { number: { startsWith: `${year}-` } } }),
  ]);

  const number = `${year}-${String(count + 1).padStart(3, "0")}`;
  const issueDate = new Date().toISOString().slice(0, 10);
  const initial = emptyQuote(number, issueDate);

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
