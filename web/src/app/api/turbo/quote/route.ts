import { NextResponse } from "next/server";

import { getListingById, isListingPublic } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";
import { clampDown, computeMonthly, RATE_MONTHLY } from "@/lib/turbo/finance";
import { createLead } from "@/lib/turbo/leads-store";
import { POINTS, rewardById } from "@/lib/turbo/points";
import { addLedger, pointsBalance } from "@/lib/turbo/points-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Cotizar es público: un invitado puede enviar un lead (sin puntos).
  const user = await getCurrentUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const b = body as {
    listingId?: unknown;
    downPayment?: unknown;
    termMonths?: unknown;
    rewardId?: unknown;
    contactName?: unknown;
    contactPhone?: unknown;
    contactEmail?: unknown;
  };

  const listingId = typeof b.listingId === "string" ? b.listingId : "";
  const downPayment = Number(b.downPayment);
  const termMonths = Number(b.termMonths);
  const rewardId = typeof b.rewardId === "string" ? b.rewardId : null;
  const contactName = typeof b.contactName === "string" ? b.contactName.trim() : "";
  const contactPhone = typeof b.contactPhone === "string" ? b.contactPhone.trim() : "";
  const contactEmail = typeof b.contactEmail === "string" ? b.contactEmail.trim() : "";

  if (
    !listingId ||
    !Number.isFinite(downPayment) ||
    !Number.isFinite(termMonths) ||
    termMonths <= 0 ||
    contactName.length < 2 ||
    contactPhone.length < 6 ||
    !/^\S+@\S+\.\S+$/.test(contactEmail)
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const listing = await getListingById(listingId);
  if (!listing || !isListingPublic(listing)) {
    return NextResponse.json({ error: "El aviso no existe" }, { status: 404 });
  }

  const down = clampDown(listing.price, downPayment);
  // El canje de puntos solo aplica con cuenta iniciada.
  const reward = user ? rewardById(rewardId) : null;
  let appliedPoints = 0;
  let benefit: string | null = null;
  let rate = RATE_MONTHLY;

  if (reward && user) {
    const bal = await pointsBalance(user.id);
    if (bal < reward.cost) {
      return NextResponse.json(
        { error: "No tienes puntos suficientes para ese beneficio" },
        { status: 400 },
      );
    }
    appliedPoints = reward.cost;
    benefit = reward.label;
    rate = RATE_MONTHLY + reward.rateDelta;
  }

  const monthly = computeMonthly(listing.price, down, termMonths, rate);

  const leadId = await createLead({
    userId: user?.id ?? null,
    listingId,
    ownerId: listing.ownerId ?? null,
    downPayment: down,
    termMonths,
    monthlyEstimate: monthly,
    appliedPoints,
    benefit,
    contactName,
    contactPhone,
    contactEmail,
  });

  let awarded = false;
  if (user) {
    if (reward) {
      await addLedger(user.id, "redeem", -reward.cost, `redeem:lead:${leadId}`);
    }
    awarded = await addLedger(user.id, "quote", POINTS.quote, `quote:${leadId}`);
  }

  return NextResponse.json({
    ok: true,
    leadId,
    benefit,
    monthly,
    downPayment: down,
    awarded,
    balance: user ? await pointsBalance(user.id) : 0,
  });
}
