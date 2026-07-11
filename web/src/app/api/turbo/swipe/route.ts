import { NextResponse } from "next/server";

import { toggleFavorite } from "@/lib/server/auth";
import { getListingById, isListingPublic } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";
import { awardPoints, pointsBalance } from "@/lib/turbo/points-store";
import { recordSwipe } from "@/lib/turbo/swipes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const input = body as { listingId?: unknown; direction?: unknown };
  const listingId = typeof input.listingId === "string" ? input.listingId : "";
  const direction = input.direction === "pass" ? "pass" : input.direction === "like" ? "like" : "";

  if (!listingId || !direction) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const listing = await getListingById(listingId);
  if (!listing || !isListingPublic(listing)) {
    return NextResponse.json({ error: "El aviso no existe" }, { status: 404 });
  }

  await recordSwipe(user.id, listingId, direction);

  let awarded = false;
  let favorited = user.favorites.includes(listingId);

  if (direction === "like") {
    if (!favorited) {
      await toggleFavorite(user.id, listingId); // agrega a favoritos
      favorited = true;
    }
    awarded = await awardPoints(user.id, "like", `like:${listingId}`);
  }

  return NextResponse.json({
    ok: true,
    awarded,
    favorited,
    balance: await pointsBalance(user.id),
  });
}
