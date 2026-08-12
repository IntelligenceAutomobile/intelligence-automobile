// Avis clients de la démonstration /demopro (lecture seule).
//
// L'habillage vient du module partagé avec le back-office
// (src/app/admin/avis/presentation.tsx) : ce qui change là-bas change ici,
// sans recopie. Seules les données (exemples figés de src/lib/demo-data.ts) et
// les actions (boutons de démonstration) diffèrent.
import { Star, Clock3, Link2, Mail } from "lucide-react";
import { daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { etatAvis, motifAffiche, pretLe, rappelDu, AVIS_CONSEIL_MOMENT } from "@/lib/avis";
import { T, AdminPage, PageHeader } from "@/app/admin/ui";
import {
  AvisJournal,
  AvisLine,
  AvisRegle,
  AvisRepli,
  AvisSection,
  avisSubtitle,
  type AvisLogView,
  type AvisView,
} from "@/app/admin/avis/presentation";
import { getDemoAvisLogs, getDemoReviewClients } from "@/lib/demo-data";
import { DEMO_REVIEW_LINK } from "@/app/demopro/demo";
import DemoAvisButton, { DemoAvisMenu } from "./DemoAvisButton";

export default function DemoAvisPage() {
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  const rows: AvisView[] = getDemoReviewClients().map((c) => {
    const requestedAt = c.requestedAt ?? "";
    const count = c.count ?? 0;
    const etat = etatAvis({ requestedAt, reasonDate: c.reasonDate, outcome: c.outcome ?? "" }, today);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      kind: c.kind,
      reason: motifAffiche(c.kind, c.reason, etat),
      reasonDate: c.reasonDate,
      vehicle: c.vehicle,
      requestedAt,
      count,
      snoozeUntil: "",
      note: c.note ?? "",
      clickedAt: c.clickedAt ?? "",
      sinceDays: daysSince(requestedAt || c.reasonDate, today),
      etat,
      readyOn: pretLe(c.reasonDate),
      rappelDu: rappelDu({ requestedAt, count, snoozeUntil: "" }, today),
      blocked: Boolean(c.blocked),
    };
  });

  const parAchat = (a: AvisView, b: AvisView) => b.reasonDate.localeCompare(a.reasonDate);
  const parEnvoi = (a: AvisView, b: AvisView) => b.requestedAt.localeCompare(a.requestedAt);

  const prets = rows.filter((r) => r.etat === "pret").sort(parAchat);
  const bientot = rows.filter((r) => r.etat === "bientot").sort((a, b) => a.readyOn.localeCompare(b.readyOn));
  const anciennes = rows.filter((r) => r.etat === "ancien").sort(parAchat);
  const attente = rows
    .filter((r) => r.etat === "attente")
    .sort((a, b) => Number(b.rappelDu) - Number(a.rappelDu) || parEnvoi(a, b));
  const avis = rows.filter((r) => r.etat === "avis").sort(parEnvoi);
  const ecartes = rows.filter((r) => r.etat === "ecarte" || r.etat === "stop").sort(parAchat);

  const journal: AvisLogView[] = getDemoAvisLogs().map((l) => ({
    ...l,
    at: `${l.at}T09:00:00.000Z`,
    href: "/demopro/clients",
  }));

  return (
    <AdminPage>
      <PageHeader
        title="Avis clients"
        subtitle={avisSubtitle(prets.length + anciennes.length, attente.length, avis.length)}
      />

      {/* Bandeau : lien Google configuré pour les invitations */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 mb-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
      >
        <Link2 size={16} style={{ color: T.accent, flexShrink: 0 }} />
        <span className="text-sm" style={{ color: T.textDim }}>
          <span className="font-semibold" style={{ color: T.text }}>Lien Google configuré.</span>
          {" Les invitations renvoient vos acheteurs vers votre fiche Google."}
        </span>
        <span className="text-xs truncate max-w-full sm:ml-auto" style={{ color: T.accent }}>{DEMO_REVIEW_LINK}</span>
      </div>

      <AvisSection title="À solliciter" icon={Star} count={prets.length}>
        {prets.map((r, i) => (
          <AvisLine
            key={r.id}
            it={r}
            first={i === 0}
            href="/demopro/clients"
            actions={
              <>
                <DemoAvisButton it={r} />
                <DemoAvisMenu name={r.name} variante="a-faire" />
              </>
            }
          />
        ))}
      </AvisSection>

      {bientot.length > 0 && (
        <AvisSection title="Bientôt" icon={Clock3} count={bientot.length} hint={AVIS_CONSEIL_MOMENT}>
          {bientot.map((r, i) => (
            <AvisLine key={r.id} it={r} first={i === 0} href="/demopro/clients" actions={<DemoAvisMenu name={r.name} variante="a-faire" />} />
          ))}
        </AvisSection>
      )}

      {attente.length > 0 && (
        <AvisSection title="En attente de réponse" icon={Mail} count={attente.length}>
          {attente.map((r, i) => (
            <AvisLine
              key={r.id}
              it={r}
              first={i === 0}
              href="/demopro/clients"
              actions={
                <>
                  {r.rappelDu && <DemoAvisButton it={r} rappel />}
                  <DemoAvisMenu name={r.name} variante="attente" />
                </>
              }
            />
          ))}
        </AvisSection>
      )}

      <AvisRepli title="Ventes anciennes" count={anciennes.length}>
        {anciennes.map((r, i) => (
          <AvisLine
            key={r.id}
            it={r}
            first={i === 0}
            href="/demopro/clients"
            actions={
              <>
                <DemoAvisButton it={r} />
                <DemoAvisMenu name={r.name} variante="a-faire" />
              </>
            }
          />
        ))}
      </AvisRepli>

      <AvisRepli title="Avis obtenus" count={avis.length}>
        {avis.map((r, i) => (
          <AvisLine key={r.id} it={r} first={i === 0} href="/demopro/clients" actions={<DemoAvisMenu name={r.name} variante="clos" />} />
        ))}
      </AvisRepli>

      <AvisRepli title="Écartés et arrêts" count={ecartes.length}>
        {ecartes.map((r, i) => (
          <AvisLine key={r.id} it={r} first={i === 0} href="/demopro/clients" actions={<DemoAvisMenu name={r.name} variante="clos" />} />
        ))}
      </AvisRepli>

      <AvisJournal entries={journal} />

      <AvisRegle />
    </AdminPage>
  );
}
