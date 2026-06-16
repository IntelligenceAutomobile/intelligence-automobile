import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const ALLOWED_NAMES = ["César", "Fab"];

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60,
};

// Définit le nom (signature des notes) — réservé aux sessions admin.
export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !ALLOWED_NAMES.includes(name)) {
    return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("ia_collab_name", name, cookieOpts);
  return response;
}

// Efface le nom (« changer de nom »).
export async function DELETE() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const response = NextResponse.json({ success: true });
  response.cookies.set("ia_collab_name", "", { path: "/", maxAge: 0 });
  return response;
}
