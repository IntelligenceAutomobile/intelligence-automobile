import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Les pièces jointes (documents/…) acceptent PDF, images et bureautique.
        // Les photos du véhicule (vehicules/…) restent strictement des images.
        const isDocument = pathname.startsWith("documents/");
        const imageTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
          "image/heif",
          "image/gif",
          "image/tiff",
          "image/bmp",
          "image/avif",
        ];
        if (isDocument) {
          return {
            allowedContentTypes: [
              "application/pdf",
              ...imageTypes,
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ],
            maximumSizeInBytes: 25 * 1024 * 1024, // 25 Mo par document (PDF scannés)
          };
        }
        return {
          allowedContentTypes: imageTypes,
          maximumSizeInBytes: 15 * 1024 * 1024, // 15 Mo par photo
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
