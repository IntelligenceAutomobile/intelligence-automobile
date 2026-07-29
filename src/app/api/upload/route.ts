import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { uploadRule } from "@/lib/upload-rules";

// Délivre un jeton d'écriture sur le stockage de fichiers. Le cloisonnement se
// fait ici et dans src/lib/upload-rules.ts : le dépôt n'a aucun middleware, et
// sans cette garde n'importe qui obtenait un jeton pour écrire où il voulait,
// jusqu'à 25 Mo par fichier.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const rule = uploadRule(pathname, session !== null);
        if (!rule) throw new Error("Envoi réservé aux utilisateurs connectés.");
        return rule;
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
