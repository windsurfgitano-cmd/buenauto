import { NextResponse } from "next/server";

import { toggleFavorite } from "@/lib/server/auth";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ToggleBody = {
  listingId?: unknown;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as ToggleBody;
  const listingId = typeof input.listingId === "string" ? input.listingId : "";

  if (!listingId) {
    return NextResponse.json(
      { error: "Falta listingId" },
      { status: 400 },
    );
  }

  try {
    const nextUser = await toggleFavorite(user.id, listingId);
    return NextResponse.json({ user: nextUser });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar favoritos" },
      { status: 400 },
    );
  }
}
