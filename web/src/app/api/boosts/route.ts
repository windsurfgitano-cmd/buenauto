import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/server/session";
import {
  getActiveBoost,
  createBoost,
  consumeUserCredit,
  getUserCredits,
} from "@/lib/server/subscriptions-store";
import { createBoostPreference } from "@/lib/server/mercadopago";
import { BOOSTS, type BoostType } from "@/lib/plans";
import { getListingById } from "@/lib/server/listings-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json({ error: "listingId requerido" }, { status: 400 });
  }

  const boost = await getActiveBoost(listingId);

  return NextResponse.json({ boost });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { listingId?: string; boostType?: string; useCredit?: boolean };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { listingId, boostType, useCredit } = body;

  if (!listingId || !boostType) {
    return NextResponse.json(
      { error: "listingId y boostType son requeridos" },
      { status: 400 }
    );
  }

  const boost = BOOSTS[boostType as BoostType];

  if (!boost) {
    return NextResponse.json({ error: "Tipo de destacado inválido" }, { status: 400 });
  }

  const listing = await getListingById(listingId);

  if (!listing) {
    return NextResponse.json({ error: "Aviso no encontrado" }, { status: 404 });
  }

  if (listing.ownerId !== user.id) {
    return NextResponse.json(
      { error: "No tienes permiso para destacar este aviso" },
      { status: 403 }
    );
  }

  const existingBoost = await getActiveBoost(listingId);

  if (existingBoost) {
    return NextResponse.json(
      { error: "Este aviso ya está destacado" },
      { status: 400 }
    );
  }

  // Use credit if requested
  if (useCredit) {
    const credits = await getUserCredits(user.id);

    if (credits < 1) {
      return NextResponse.json(
        { error: "No tienes créditos disponibles" },
        { status: 400 }
      );
    }

    const used = await consumeUserCredit(user.id);

    if (!used) {
      return NextResponse.json(
        { error: "No se pudo usar el crédito" },
        { status: 500 }
      );
    }

    // Create boost immediately when using credit (7 days default)
    const newBoost = await createBoost({
      listingId,
      userId: user.id,
      boostType: "7days",
      durationDays: 7,
    });

    return NextResponse.json({ boost: newBoost, usedCredit: true });
  }

  // Create payment preference for paid boost
  try {
    const { preferenceId, initPoint } = await createBoostPreference({
      userId: user.id,
      listingId,
      boostType: boostType as BoostType,
      userEmail: user.email,
    });

    return NextResponse.json({
      preferenceId,
      initPoint,
    });
  } catch (err) {
    console.error("Error creating boost preference:", err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
