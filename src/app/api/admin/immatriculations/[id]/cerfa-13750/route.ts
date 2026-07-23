import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseAddress, splitVehicleLabel } from "@/lib/immatriculation";

// Demande de certificat d'immatriculation (Cerfa 13750*07).
// Ce formulaire est un XFA sans champs exploitables : on écrit par-dessus la
// page, aux coordonnées calées visuellement sur le gabarit (points PDF,
// origine en bas à gauche). Toute mise à jour du gabarit impose de revérifier
// le calage.
const TEMPLATE = path.join(process.cwd(), "assets", "cerfa", "cerfa_13750-07.pdf");

const INK = rgb(0.1, 0.1, 0.28);

function drawText(page: PDFPage, font: PDFFont, s: string, x: number, y: number, size = 9) {
  if (s) page.drawText(s, { x, y, size, font, color: INK });
}

// Peigne : un caractère centré par cellule.
function drawComb(page: PDFPage, font: PDFFont, s: string, x0: number, pitch: number, y: number, size = 9) {
  [...s].forEach((ch, i) => {
    const w = font.widthOfTextAtSize(ch, size);
    page.drawText(ch, { x: x0 + pitch * i + (pitch - w) / 2, y, size, font, color: INK });
  });
}

function drawDateComb(page: PDFPage, font: PDFFont, iso: string, x0: number, pitch: number, y: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
  const [Y, M, J] = iso.split("-");
  drawComb(page, font, J + M + Y, x0, pitch, y);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const row = await prisma.registration.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  try {
    // pdf-lib retire le XFA au chargement : il reste la page imprimée, saine.
    const doc = await PDFDocument.load(await readFile(TEMPLATE));
    const page = doc.getPage(0);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const { make, model } = splitVehicleLabel(row.vehicleLabel);
    const addr = parseAddress(row.holderAddress);

    // Nature de la demande
    if (row.type === "duplicata") drawText(page, font, "X", 214, 759, 10);
    else drawText(page, font, "X", 152.5, 759, 10);

    // VÉHICULE
    drawText(page, font, row.plateForeign || row.plateFinal, 38, 704, 10); // (A) immatriculation actuelle
    drawDateComb(page, font, row.acquiredOn, 164.5, 14.8, 703); // date d'achat
    drawDateComb(page, font, row.firstRegDate, 442.5, 14.7, 703); // (B) 1re immatriculation
    drawText(page, font, make, 40, 652); // Marque (D.1)
    drawText(page, font, model, 226, 652); // Dénomination commerciale (D.3)
    drawText(page, font, row.vin, 40, 609); // Numéro d'identification (E)

    // TITULAIRE
    drawText(page, font, row.holderName, 85, 523); // nom et prénom
    drawText(page, font, addr.streetNumber, 90, 470.5, 8.5);
    drawText(page, font, addr.extension, 138, 470.5, 8.5);
    drawText(page, font, addr.streetType, 200, 470.5, 8.5);
    drawText(page, font, addr.streetName, 287, 470.5, 8.5);
    drawComb(page, font, addr.postalCode, 84.3, 11.9, 437, 8.5);
    drawText(page, font, addr.city, 156, 437, 8.5);

    const bytes = await doc.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cerfa13750-${row.reference}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "La génération du Cerfa 13750 a échoué." }, { status: 500 });
  }
}
