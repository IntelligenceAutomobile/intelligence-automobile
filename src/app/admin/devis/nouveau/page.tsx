import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { emptyQuote, mergeBranding, brandingFromTheme, nextNumber, quotePrefix, type QuoteKind } from "@/lib/devis";
import { parisDay } from "@/lib/vehicules";
import { loadStockForQuotes } from "@/lib/devis-stock";
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
  const [vehicles, taken, last, brandTheme] = await Promise.all([
    // Stock + coût de revient + identité administrative (numéro de série,
    // plaque, 1re mise en circulation) en une seule fonction partagée.
    loadStockForQuotes(),
    // Numéros déjà attribués cette année : le suivant se calcule sur le plus grand
    // d'entre eux, sinon une suppression rendrait un numéro déjà pris.
    prisma.quote.findMany({ where: { number: { startsWith: quotePrefix(year) } }, select: { number: true } }),
    // Reprend la MISE EN PAGE et le type du dernier devis ; l'identité, elle,
    // vient des réglages de la marque.
    prisma.quote.findFirst({ orderBy: { updatedAt: "desc" }, select: { branding: true, kind: true } }),
    prisma.brandTheme.findUnique({ where: { id: "default" } }),
  ]);

  let lastBranding: unknown = {};
  try {
    lastBranding = JSON.parse(last?.branding ?? "{}");
  } catch {
    /* ignore */
  }
  const lastKind: QuoteKind = last?.kind === "prestation" ? "prestation" : "vehicule";

  const number = nextNumber(quotePrefix(year), taken.map((q) => q.number));
  const issueDate = parisDay(new Date()).toISOString().slice(0, 10);
  // L'identité du document (logo, émetteur, IBAN, mentions, couleur) vient des
  // réglages de la marque ; la mise en page travaillée sur le dernier devis se
  // conserve. Auparavant tout se recopiait du dernier devis touché, au hasard.
  const initial = emptyQuote(number, issueDate, brandingFromTheme(brandTheme, mergeBranding(lastBranding)), lastKind);

  // Pré-remplissage depuis la fiche client CRM (?client=<id>).
  if (clientIdParam) {
    const crmClient = await prisma.client.findUnique({ where: { id: clientIdParam } });
    if (crmClient) {
      initial.clientId = crmClient.id;
      initial.clientName = crmClient.name;
      initial.clientCompany = crmClient.company;
      initial.clientEmail = crmClient.email;
      initial.clientPhone = crmClient.phone;

      // Le devis se rattache à l'opportunité qu'il fait avancer, quand elle ne
      // fait aucun doute. Sans ce lien, l'envoi visait « la dernière
      // opportunité ouverte touchée » : chez un client suivant deux dossiers,
      // une recherche de voiture et la reprise de son ancienne, le devis
      // pouvait faire avancer le mauvais. À deux dossiers ouverts on s'abstient,
      // et l'ancien comportement s'applique.
      const ouvertes = await prisma.lead.findMany({
        where: { clientId: crmClient.id, stage: { notIn: ["gagne", "perdu"] } },
        select: { id: true },
        take: 2,
      });
      if (ouvertes.length === 1) initial.leadId = ouvertes[0].id;
    }
  }

  return (
    <AdminPage>
      <Link href="/admin/devis" className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }}>
        ← Devis
      </Link>
      <PageHeader title="Nouveau devis" subtitle="Le document se met à jour en direct dans l'aperçu." />
      <DevisEditor initial={initial} vehicles={vehicles} isEdit={false} canBranding={can(asRole(session.admin.role), "settings")} />
    </AdminPage>
  );
}
