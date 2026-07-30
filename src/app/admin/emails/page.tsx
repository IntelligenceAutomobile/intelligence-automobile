import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { LISTE_ROUGE_FIXE, mailMode } from "@/lib/mailer";
import EmailsClient, { type BlockEntry, type LogEntry } from "./EmailsClient";

export default async function EmailsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Le journal cite l'objet et l'issue de chaque message : même réserve que
  // les autres pages de Réglages.
  if (!can(asRole(session.admin.role), "settings")) redirect("/admin");

  const [blocks, logs] = await Promise.all([
    prisma.emailBlock.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
  ]);

  // Entrées ajoutées par variable d'environnement : visibles, retirables
  // seulement depuis l'hébergeur.
  const envEntries = (process.env.MAIL_BLOCKLIST ?? "")
    .split(/[,;\s]+/)
    .map((v) => v.trim().toLowerCase().replace(/^@/, "").replace(/\.$/, ""))
    .filter(Boolean);

  return (
    <EmailsClient
      mode={mailMode()}
      hasKey={Boolean((process.env.RESEND_API_KEY ?? "").trim())}
      fixedEntries={[...LISTE_ROUGE_FIXE]}
      envEntries={envEntries}
      blocks={blocks.map<BlockEntry>((b) => ({
        id: b.id,
        value: b.value,
        reason: b.reason,
        author: b.author,
        at: b.createdAt.toISOString(),
      }))}
      logs={logs.map<LogEntry>((l) => ({
        id: l.id,
        recipients: l.recipients,
        subject: l.subject,
        outcome: l.outcome,
        reason: l.reason,
        origin: l.origin,
        mode: l.mode,
        at: l.createdAt.toISOString(),
      }))}
      canEdit={can(asRole(session.admin.role), "settings")}
    />
  );
}
