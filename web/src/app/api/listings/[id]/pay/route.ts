import { NextResponse } from "next/server";

import { createListingPreference } from "@/lib/server/mercadopago";
import {
  createPayment,
  type Payment,
} from "@/lib/server/subscriptions-store";
import {
  getListingByIdForOwner,
  markListingPendingPayment,
} from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LISTING_PRICE_CLP = 5000;

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const { invoiceEmail, invoiceRUT } = (body ?? {}) as {
    invoiceEmail?: string;
    invoiceRUT?: string;
  };

  if (!invoiceEmail || !isValidEmail(invoiceEmail)) {
    return NextResponse.json({ error: "Ingresa un email de boleta válido" }, { status: 400 });
  }

  if (!invoiceRUT || !invoiceRUT.trim()) {
    return NextResponse.json({ error: "Ingresa un RUT para la boleta" }, { status: 400 });
  }

  const listing = await getListingByIdForOwner(id, user.id);

  if (!listing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (listing.status === "published") {
    return NextResponse.json({ error: "El aviso ya está publicado" }, { status: 400 });
  }

  // Create MP preference
  const pref = await createListingPreference({
    userId: user.id,
    listingId: listing.id,
    userEmail: user.email,
  });

  // Record payment intent
  const payment: Payment = await createPayment({
    userId: user.id,
    type: "listing",
    amount: LISTING_PRICE_CLP,
    mpPreferenceId: pref.preferenceId,
    metadata: { listingId: listing.id },
  });

  // mark listing pending payment
  await markListingPendingPayment(listing.id, user.id, {
    paymentId: payment.id,
    invoiceEmail,
    invoiceRUT,
  });

  return NextResponse.json({
    preferenceId: pref.preferenceId,
    initPoint: pref.initPoint,
  });
}
