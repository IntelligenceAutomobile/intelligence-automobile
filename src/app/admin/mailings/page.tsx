import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { mailMode } from "@/lib/mailer";
import MailingsClient from "./MailingsClient";

export default async function MailingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Cet écran écrit à de vraies personnes : même réserve que l'écran Emails.
  if (!can(asRole(session.admin.role), "settings")) redirect("/admin");

  return (
    <MailingsClient
      mode={mailMode()}
      hasKey={Boolean((process.env.RESEND_API_KEY ?? "").trim())}
    />
  );
}
