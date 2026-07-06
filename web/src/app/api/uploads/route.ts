import crypto from "crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/server/session";
import {
  getPhotoStore,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Solo se aceptan imágenes JPG, PNG o WebP" },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "La imagen no puede superar 8 MB" },
      { status: 400 },
    );
  }

  const key = `${user.id}-${crypto.randomUUID()}.${ext}`;

  try {
    const store = getPhotoStore();
    await store.set(key, await file.arrayBuffer(), {
      metadata: { contentType: file.type, userId: user.id },
    });
  } catch (err) {
    console.error("[uploads] error guardando blob:", err);
    return NextResponse.json(
      { error: "No se pudo guardar la imagen" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: `/api/images/${key}` }, { status: 201 });
}
