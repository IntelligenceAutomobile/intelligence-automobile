"use client";

// Reprises : liste des estimations de véhicules clients.
//
// La saisie vit désormais sur sa propre page (/admin/reprises/nouvelle) : la
// fenêtre flottante d'avant vidait trois minutes de travail au premier clic de
// travers. La mise en forme de la liste elle-même se refait au lot suivant.
import Link from "next/link";
import { Plus, HandCoins, ChevronRight, Banknote } from "lucide-react";
import { formatEuroCents } from "@/lib/comptes";
import { REPRISE_STATUS_LABEL, REPRISE_STATUS_TONE, type RepriseStatus } from "@/lib/reprises";
import { T, Tag, AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "../ui";

export type RepriseRow = {
  id: string;
  reference: string;
  status: RepriseStatus;
  clientId: string | null;
  vehicule: string;
  vendeur: string;
  plate: string;
  vin: string;
  make: string;
  model: string;
  version: string;
  mileageKm: number;
  fuel: string;
  offerCents: number;
  offerDate: string;
  /** Ancienneté écrite côté serveur, avec une seule heure de référence. */
  anciennete: string;
};

export default function ReprisesClient({ reprises }: { reprises: RepriseRow[] }) {
  return (
    <AdminPage>
      <PageHeader
        title="Reprises"
        subtitle={`${reprises.length} estimation${reprises.length > 1 ? "s" : ""} · évaluez le véhicule d'un client, il rejoint le pipeline.`}
        action={
          <Link href="/admin/reprises/nouvelle" className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle estimation
          </Link>
        }
      />

      {reprises.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <span className="inline-flex items-center gap-2">
            <HandCoins size={15} />
            Votre première estimation s&apos;affichera ici. Cliquez « Nouvelle estimation » pour évaluer un véhicule.
          </span>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {reprises.map((r, i) => (
            <Link
              key={r.id}
              href={`/admin/reprises/${r.id}`}
              className="block px-4 py-3.5 transition-colors hover:bg-[#0A1628]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              {/* Sur téléphone la ligne s'empile : le nom du véhicule prend
                  toute la largeur, là où il se réduisait à deux lettres en se
                  disputant la place avec le montant, l'étiquette et la date. */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="inline-flex items-center gap-2 min-w-0 sm:flex-1">
                  <HandCoins size={15} style={{ color: T.accent, flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: T.text }}>{r.vehicule}</span>
                </span>
                <span className="flex items-center gap-3 flex-shrink-0 sm:pl-0" style={{ paddingLeft: 23 }}>
                  {r.offerCents > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap" style={{ color: T.text }}>
                      <Banknote size={13} style={{ color: T.muted, flexShrink: 0 }} />
                      {formatEuroCents(r.offerCents)}
                    </span>
                  )}
                  <Tag tone={REPRISE_STATUS_TONE[r.status]}>{REPRISE_STATUS_LABEL[r.status]}</Tag>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: T.muted }}>{r.anciennete}</span>
                  <ChevronRight size={14} style={{ color: T.muted, flexShrink: 0 }} />
                </span>
              </div>
              {/* Le vendeur, la plaque et la référence sur un second niveau :
                  c'est ce qui distingue deux Clio de 2018 au même prix. */}
              <div className="text-xs mt-1 truncate" style={{ color: T.muted, paddingLeft: 23 }}>
                {[r.vendeur, r.plate, r.reference].filter(Boolean).join(" · ")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
