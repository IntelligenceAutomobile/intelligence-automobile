import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password, name } = await req.json();

    if (!password || !name?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    if (password !== process.env.COLLAB_PASSWORD) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set("ia_collab", password, cookieOpts);
    response.cookies.set("ia_collab_name", name.trim(), cookieOpts);

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
