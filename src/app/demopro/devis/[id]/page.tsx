// Devis ouvert de la démonstration /demopro (lecture seule).
// Rend le document A4 fidèle via le composant présentiel DevisDocument (pur,
// sans hook ni accès base) alimenté par un devis d'exemple figé. Les boutons
// d'action (imprimer, envoyer, modifier, convertir) affichent un simple toast.
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileCheck2, Pencil, Printer, Send } from "lucide-react";
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
} from "@/lib/devis";
import { T, AdminPage, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { DemoPageHeader } from "@/app/demopro/DemoPageHeader";
import { getDemoQuote } from "@/lib/demo-data";
import DevisDocument from "@/app/admin/devis/DevisDocument";
import { DEMO_BASE } from "../../demo";
import DemoActionButton from "../DemoActionButton";

export default async function DemoDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = getDemoQuote(id);
  // Cette route ne montre que des devis (les factures ont leur propre module).
  if (!q || q.docType !== "devis") notFound();

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
    docType: "devis",
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
    branding: defaultBranding(),
  };

  return (
    <AdminPage>
      <Link
        href={`${DEMO_BASE}/devis`}
        className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        ← Devis
      </Link>

      <DemoPageHeader
        title={`Devis ${q.number}`}
        subtitle={q.clientCompany || q.clientName || "Sans client"}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <Pencil size={13} />
              Modifier
            </DemoActionButton>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <Send size={13} />
              Envoyer
            </DemoActionButton>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <FileCheck2 size={13} />
              Convertir en facture
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
