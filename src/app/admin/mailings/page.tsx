import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { mailMode } from "@/lib/mailer";
import MailingsClient from "./MailingsClient";

export default async function MailingsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; objet?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Cet écran écrit à de vraies personnes : même réserve que l'écran Emails.
  if (!can(asRole(session.admin.role), "settings")) redirect("/admin");

  // « Répondre » depuis l'écran Réception arrive ici avec l'adresse et
  // l'objet : la composition s'ouvre directement, préremplie.
  const params = await searchParams;

  return (
    <MailingsClient
      mode={mailMode()}
      hasKey={Boolean((process.env.RESEND_API_KEY ?? "").trim())}
      initialTo={(params.a ?? "").slice(0, 200)}
      initialSubject={(params.objet ?? "").slice(0, 200)}
    />
  );
}
