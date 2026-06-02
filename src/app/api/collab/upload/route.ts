import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getCollabSession } from "@/lib/collab-auth";

export async function POST(req: NextRequest) {
  const session = await getCollabSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const blob = await put(`collab/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
