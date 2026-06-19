import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPage, PageHeader } from "../ui";
import { isPartner, type LedgerEntry, type Partner, type Scope } from "@/lib/comptes";
import ComptesClient from "./ComptesClient";

export default async function ComptesPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [rows, cookieStore] = await Promise.all([
    prisma.ledgerEntry.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    cookies(),
  ]);

  const me: Partner | null = (() => {
    const n = cookieStore.get("ia_collab_name")?.value?.trim();
    return isPartner(n) ? n : null;
  })();

  const entries: LedgerEntry[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    label: r.label,
    category: r.category,
    amountCents: r.amountCents,
    paidBy: (isPartner(r.paidBy) ? r.paidBy : "Fab") as Partner,
    scope: (r.scope === "commun" || isPartner(r.scope) ? r.scope : "commun") as Scope,
    share: r.share,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <AdminPage>
      <PageHeader
        title="Comptes associés"
        subtitle="Dépenses communes, avances et règlements entre César et Fab."
      />
      <ComptesClient initialEntries={entries} me={me} />
    </AdminPage>
  );
}
