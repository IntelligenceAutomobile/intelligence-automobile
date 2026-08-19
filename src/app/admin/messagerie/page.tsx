import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { mailMode, LISTE_ROUGE_FIXE } from "@/lib/mailer";
import { receptionConfiguree } from "@/lib/reception";
import { prisma } from "@/lib/prisma";
import MessagerieClient, { type BlockEntry, type EnvoiEntry } from "./MessagerieClient";

const VUES = ["reception", "envoyes", "modeles", "reglages"] as const;

export default async function MessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; objet?: string; vue?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // La messagerie lit et écrit à de vraies personnes : même réserve que l'ancien écran Emails.
  if (!can(asRole(session.admin.role), "settings")) redirect("/admin");

  const params = await searchParams;

  // Vue « Envoyés » : le journal des emails du site, tous circuits confondus
  // (mailings, devis, relances, formulaires). Vue « Réglages » : la liste rouge.
  const [logs, blocks] = await Promise.all([
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.emailBlock.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  // Entrées bloquées par variable d'environnement : visibles, retirables
  // seulement depuis l'hébergeur.
  const envEntries = (process.env.MAIL_BLOCKLIST ?? "")
    .split(/[,;\s]+/)
    .map((v) => v.trim().toLowerCase().replace(/^@/, "").replace(/\.$/, ""))
    .filter(Boolean);

  const vue = (VUES as readonly string[]).includes(params.vue ?? "") ? (params.vue as (typeof VUES)[number]) : "reception";

  return (
    <MessagerieClient
      mode={mailMode()}
      hasKey={Boolean((process.env.RESEND_API_KEY ?? "").trim())}
      configuree={receptionConfiguree()}
      envois={logs.map<EnvoiEntry>((l) => ({
        id: l.id,
        recipients: l.recipients,
        subject: l.subject,
        outcome: l.outcome,
        reason: l.reason,
        origin: l.origin,
        mode: l.mode,
        at: l.createdAt.toISOString(),
      }))}
      fixedEntries={[...LISTE_ROUGE_FIXE]}
      envEntries={envEntries}
      blocks={blocks.map<BlockEntry>((b) => ({
        id: b.id,
        value: b.value,
        reason: b.reason,
        author: b.author,
        at: b.createdAt.toISOString(),
      }))}
      initialTo={(params.a ?? "").slice(0, 200)}
      initialSubject={(params.objet ?? "").slice(0, 200)}
      initialVue={vue}
    />
  );
}
