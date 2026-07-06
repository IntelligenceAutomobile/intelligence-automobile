import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import MarqueClient from "./MarqueClient";

export default async function MarquePage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  if (!can(asRole(session.admin.role), "settings")) redirect("/admin");

  const theme = await prisma.brandTheme.findUnique({ where: { id: "default" } });

  return (
    <MarqueClient
      initial={{
        name: theme?.name ?? "Intelligence Automobile",
        tagline: theme?.tagline ?? "Back-office",
        accent: theme?.accent ?? "#6B9FEE",
        reviewLink: theme?.reviewLink ?? "",
      }}
    />
  );
}
