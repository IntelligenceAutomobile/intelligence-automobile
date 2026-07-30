// Facture ouverte de la démonstration /demopro (lecture seule).
// Rend le document A4 fidèle via le composant présentiel DevisDocument (pur,
// sans hook ni accès base) alimenté par une facture d'exemple figée. Le tampon
// « PAYÉE » et le titre (FACTURE / FACTURE D'ACOMPTE / DE SOLDE) sont gérés par
// DevisDocument. Les boutons d'action affichent un simple toast.
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Printer } from "lucide-react";
import {
  defaultBranding,
  type QuoteData,
  type QuoteItem,
  type QuoteKind,
  type QuoteStatus,
  type TvaMode,
  type DepositMode,
  type FactureKind,
  type PaymentStatus,
  type DocLang,
} from "@/lib/devis";
import { T, AdminPage, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { DemoPageHeader } from "@/app/demopro/DemoPageHeader";
import { getDemoQuote, getDemoVehicleBlock } from "@/lib/demo-data";
import DevisDocument from "@/app/admin/devis/DevisDocument";
import { DEMO_BASE } from "../../demo";
import DemoActionButton from "@/app/demopro/DemoActionButton";

export default async function DemoFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = getDemoQuote(id);
  // Cette route ne montre que des factures (les devis ont leur propre module).
  if (!q || q.docType !== "facture") notFound();

  const items: QuoteItem[] = q.items.map((it) => ({
    id: it.id,
    designation: it.designation,
    detail: it.detail ?? "",
    qty: it.qty,
    unitPrice: it.unitPrice,
  }));

  const quote: QuoteData = {
    id: q.id,
    number: q.number,
    kind: q.kind as QuoteKind,
    status: q.status as QuoteStatus,
    docType: "facture",
    factureKind: (q.factureKind as FactureKind) ?? "complete",
    paymentStatus: (q.paymentStatus as PaymentStatus) ?? "impayee",
    paidDate: q.paidDate ?? "",
    sourceQuoteId: null,
    clientId: q.clientId,
    clientName: q.clientName,
    clientCompany: q.clientCompany,
    clientAddress: "",
    clientEmail: q.clientEmail,
    clientPhone: q.clientPhone,
    clientCountry: q.clientCountry ?? "FR",
    clientVatNumber: q.clientVatNumber ?? "",
    docLang: (q.docLang as DocLang) ?? "fr",
    issueDate: q.issueDate,
    validityDays: 30,
    items,
    tvaMode: q.tvaMode as TvaMode,
    tvaRate: q.tvaRate,
    depositMode: q.depositMode as DepositMode,
    depositValue: q.depositValue,
    paymentTerms: q.paymentTerms,
    notes: "",
    vehicleId: q.vehicleId,
    // La facture porte le même véhicule que le devis, numéro de série compris.
    vehicle: getDemoVehicleBlock(q.vehicleId),
    branding: defaultBranding(),
  };

  const paid = q.paymentStatus === "payee";

  return (
    <AdminPage>
      <Link
        href={`${DEMO_BASE}/factures`}
        className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        ← Factures
      </Link>

      <DemoPageHeader
        title={`Facture ${q.number}`}
        subtitle={q.clientCompany || q.clientName || "Sans client"}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DemoActionButton
              className={btnGhostClass}
              style={btnGhostStyle}
              title={paid ? "Remettre en impayée" : "Marquer payée"}
            >
              <Check size={13} />
              {paid ? "Remettre en impayée" : "Marquer payée"}
            </DemoActionButton>
            <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
              <Printer size={13} />
              Imprimer
            </DemoActionButton>
          </div>
        }
      />

      {/* Aperçu A4 : la feuille fait 210 mm de large, on la centre et on autorise
          le défilement horizontal sous les petits écrans. */}
      <div className="overflow-x-auto" style={{ backgroundColor: "#5b6472", padding: "24px" }}>
        <div className="mx-auto" style={{ width: "210mm", maxWidth: "100%" }}>
          <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
            <DevisDocument quote={quote} />
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
