import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const clear = { maxAge: 0, path: "/" };
  response.cookies.set("ia_collab", "", clear);
  response.cookies.set("ia_collab_name", "", clear);
  return response;
}
