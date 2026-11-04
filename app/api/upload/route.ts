import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/epub+zip",
  "text/plain",
  "text/csv",
  "text/html",
  "application/json",
  "application/javascript",
  "application/xml",
  "text/xml",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "application/octet-stream",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadPresignedBody;

    const result = await handleUploadPresigned({
      body,
      request,

      getSignedToken: async (pathname) => {
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          validUntil: Date.now() + 60 * 60 * 1000,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_FILE_SIZE,
            addRandomSuffix: true,
            allowOverwrite: false,
            validUntil: Date.now() + 10 * 60 * 1000,
          },
        };
      },

      onUploadCompleted: async () => {
        // Upload completed successfully.
      },
    });

    return NextResponse.json(result);

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";

    console.error("Blob upload error:", message);

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}