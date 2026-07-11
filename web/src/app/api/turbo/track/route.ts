import { NextResponse } from "next/server";

import { getListingById, isListingPublic } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";
import { awardPoints, pointsBalance } from "@/lib/turbo/points-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Suma puntos por ver o compartir un auto (idempotente por acción+aviso).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as { action?: unknown; listingId?: unknown };
  const action = input.action === "view" ? "view" : input.action === "share" ? "share" : "";
  const listingId = typeof input.listingId === "string" ? input.listingId : "";

  if (!action || !listingId) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const listing = await getListingById(listingId);
  if (!listing || !isListingPublic(listing)) {
    return NextResponse.json({ error: "El aviso no existe" }, { status: 404 });
  }

  const awarded = await awardPoints(user.id, action, `${action}:${listingId}`);
  return NextResponse.json({ ok: true, awarded, balance: await pointsBalance(user.id) });
}
