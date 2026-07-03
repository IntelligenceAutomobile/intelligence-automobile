import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MarqueClient from "./MarqueClient";

export default async function MarquePage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const theme = await prisma.brandTheme.findUnique({ where: { id: "default" } });

  return (
    <MarqueClient
      initial={{
        name: theme?.name ?? "Intelligence Automobile",
        tagline: theme?.tagline ?? "Back-office",
        accent: theme?.accent ?? "#6B9FEE",
      }}
    />
  );
}
