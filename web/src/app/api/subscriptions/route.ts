import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/server/session";
import {
  getActiveSubscription,
  getUserCredits,
  cancelSubscription,
} from "@/lib/server/subscriptions-store";
import { createSubscriptionPreference } from "@/lib/server/mercadopago";
import { PLANS, type PlanId } from "@/lib/plans";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const subscription = await getActiveSubscription(user.id);
  const credits = await getUserCredits(user.id);

  return NextResponse.json({
    subscription,
    credits,
    planId: subscription?.planId ?? "free",
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { planId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const planId = body.planId as PlanId;

  if (!planId || !PLANS[planId]) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const plan = PLANS[planId];

  if (plan.price === 0) {
    return NextResponse.json(
      { error: "El plan gratuito no requiere pago" },
      { status: 400 }
    );
  }

  try {
    const { preferenceId, initPoint } = await createSubscriptionPreference({
      userId: user.id,
      planId,
      userEmail: user.email,
    });

    return NextResponse.json({
      preferenceId,
      initPoint,
    });
  } catch (err) {
    console.error("Error creating subscription preference:", err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia de pago" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const subscription = await cancelSubscription(user.id);

  if (!subscription) {
    return NextResponse.json(
      { error: "No hay suscripción activa" },
      { status: 400 }
    );
  }

  return NextResponse.json({ subscription });
}
