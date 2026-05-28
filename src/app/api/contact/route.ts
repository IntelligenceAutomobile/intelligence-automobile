import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, email, telephone, sujet, message } = body;

    if (!nom || !email || !message) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    // Log du message reçu (à remplacer par un envoi email en production)
    console.log("=== Nouveau message de contact ===");
    console.log(`Nom: ${nom}`);
    console.log(`Email: ${email}`);
    console.log(`Téléphone: ${telephone}`);
    console.log(`Sujet: ${sujet}`);
    console.log(`Message: ${message}`);
    console.log("==================================");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
