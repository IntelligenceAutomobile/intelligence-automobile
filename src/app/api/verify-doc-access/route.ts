import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mot de passe « public » des documents (déverrouillage côté client historique).
const DOC_PASSWORD = "Password123!";

// Vérifie le mot de passe saisi dans l'espace « Factures & Documents ».
// Accepte soit le mot de passe documents, soit un mot de passe admin valide.
// L'admin est comparé à son hash bcrypt côté serveur : son mot de passe
// n'est jamais exposé dans le code envoyé au navigateur.
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (typeof password !== "string" || !password) {
      return NextResponse.json({ valid: false });
    }

    if (password === DOC_PASSWORD) {
      return NextResponse.json({ valid: true });
    }

    const admins = await prisma.adminUser.findMany({ select: { passwordHash: true } });
    for (const a of admins) {
      if (await bcrypt.compare(password, a.passwordHash)) {
        return NextResponse.json({ valid: true });
      }
    }

    return NextResponse.json({ valid: false });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
