import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import UtilisateursClient, { type UserRow } from "./UtilisateursClient";

export default async function UtilisateursPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  if (!can(asRole(session.admin.role), "users")) redirect("/admin");

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true },
  });

  const rows: UserRow[] = users.map((u) => ({ id: u.id, email: u.email, role: u.role }));

  return <UtilisateursClient users={rows} currentUserId={session.admin.id} />;
}
