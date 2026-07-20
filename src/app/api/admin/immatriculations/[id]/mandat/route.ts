import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { REG_TYPE_LABEL, isRegType } from "@/lib/immatriculation";

// Gabarit officiel du mandat d'immatriculation (Cerfa 13757*03).
// Le chemin est littéral : c'est lui que le traceur de fichiers de Next suit
// pour embarquer le PDF dans la fonction déployée (voir next.config.ts).
const TEMPLATE = path.join(process.cwd(), "assets", "cerfa", "cerfa_13757-03.pdf");

/**
 * Découpe une adresse libre en composants du formulaire.
 * Le dernier segment contenant un code postal donne commune et code postal ;
 * le reste part dans le nom de voie. L'opérateur ajuste dans le PDF au besoin,
 * les champs restent modifiables.
 */
function splitAddress(raw: string): { street: string; postalCode: string; city: string } {
  const parts = raw.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const m = parts[i].match(/^(\d{5})\s+(.+)$/);
    if (m) {
      return { street: parts.slice(0, i).join(" "), postalCode: m[1], city: m[2] };
    }
  }
  return { street: parts.join(" "), postalCode: "", city: "" };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [row, theme] = await Promise.all([
    prisma.registration.findUnique({ where: { id } }),
    prisma.brandTheme.findUnique({ where: { id: "default" }, select: { name: true } }),
  ]);
  if (!row) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  try {
    const doc = await PDFDocument.load(await readFile(TEMPLATE));
    const form = doc.getForm();

    // Renseigne un champ en ignorant ceux qui manqueraient dans une future
    // version du Cerfa : un formulaire partiellement rempli vaut mieux qu'une
    // erreur au moment où l'utilisateur clique.
    const set = (name: string, value: string) => {
      if (!value) return;
      try {
        form.getTextField(`topmostSubform[0].Page1[0].${name}[0]`).setText(value);
      } catch {
        /* champ absent de cette version du gabarit */
      }
    };

    const addr = splitAddress(row.holderAddress);
    const today = new Date();
    const type = isRegType(row.type) ? row.type : "import_ue";

    set("txt_IdentitéMandant", row.holderName);
    set("txt_NomVoieAdresse", addr.street);
    set("num_CodePostalAdresse", addr.postalCode);
    set("txt_CommuneAdresse", addr.city);
    set("txt_PaysAdresse", addr.postalCode ? "France" : "");
    set("txt_IdentitéMandataire", theme?.name ?? "Intelligence Automobile");
    set("txt_NatureOpération", REG_TYPE_LABEL[type]);
    set("txt_MarqueVéhicule", row.vehicleLabel);
    set("txt_MarqueImmatriculation", row.plateFinal || row.plateForeign);
    set("txt_NumVinVéhicule", row.vin);
    set("num_DateJourDéclaration", String(today.getDate()).padStart(2, "0"));
    set("num_DateMoisDéclaration", String(today.getMonth() + 1).padStart(2, "0"));
    set("num_DateAnnéeDéclaration", String(today.getFullYear()));

    // Les champs restent modifiables : le mandataire complète son SIRET et le
    // lieu de déclaration, puis fait signer.
    const bytes = await doc.save();
    const filename = `mandat-${row.reference}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "La génération du mandat a échoué." }, { status: 500 });
  }
}
