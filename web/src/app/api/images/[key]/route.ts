import { NextResponse, type NextRequest } from "next/server";

import { getPhotoStore } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  // Las keys son "<userId>-<uuid>.<ext>": sin rutas ni caracteres raros.
  if (!/^[\w.-]+$/.test(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const store = getPhotoStore();
    const result = await store.getWithMetadata(key, { type: "arrayBuffer" });

    if (!result || !result.data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType =
      typeof result.metadata?.contentType === "string"
        ? result.metadata.contentType
        : "image/jpeg";

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[images] error leyendo blob:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
