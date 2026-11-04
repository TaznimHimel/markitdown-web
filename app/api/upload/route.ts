import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
          "text/html",
          "application/json",
          "application/xml",
          "application/epub+zip",
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/bmp",
          "image/webp",
          "image/tiff",
          "audio/mpeg",
          "audio/wav",
          "audio/x-wav"
        ],
        maximumSizeInBytes: 100 * 1024 * 1024,
        addRandomSuffix: true
      }),
      onUploadCompleted: async () => {
        // Conversion starts after the browser receives the completed Blob URL.
      }
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload authorization failed" },
      { status: 400 }
    );
  }
}
