import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (typeof url !== "string") {
      return NextResponse.json({ error: "Invalid Blob URL" }, { status: 400 });
    }

    const parsed = new URL(url);
    const host = parsed.hostname;
    if (
      parsed.protocol !== "https:" ||
      !(host.endsWith(".public.blob.vercel-storage.com") ||
        host.endsWith(".blob.vercel-storage.com"))
    ) {
      return NextResponse.json({ error: "Unsupported Blob URL" }, { status: 400 });
    }

    await del(url);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Could not remove temporary upload" },
      { status: 500 }
    );
  }
}
