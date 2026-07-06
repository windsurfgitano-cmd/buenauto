import crypto from "crypto";

import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

import {
  createSubscription,
  createBoost,
  addUserCredits,
  createPayment,
  approvePayment,
  getPaymentByPreferenceId,
  getPaymentByMpPaymentId,
} from "@/lib/server/subscriptions-store";
import { BOOSTS, PACKS, type PlanId, type BoostType, type PackId } from "@/lib/plans";
import { publishListing } from "@/lib/server/listings-store";

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
  }

  return new MercadoPagoConfig({ accessToken });
}

/**
 * Valida la firma x-signature de MercadoPago (HMAC-SHA256 sobre
 * "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con el secret del
 * panel de webhooks). Sin MERCADOPAGO_WEBHOOK_SECRET configurado no se
 * puede validar: se acepta con warning (solo aceptable en sandbox).
 */
function verifyWebhookSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      "[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — firma NO validada. Configúralo antes de usar credenciales de producción.",
    );
    return true;
  }

  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";

  const parts = new Map<string, string>();
  for (const piece of signature.split(",")) {
    const idx = piece.indexOf("=");
    if (idx === -1) continue;
    parts.set(piece.slice(0, idx).trim(), piece.slice(idx + 1).trim());
  }

  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type ExternalReference = {
  type: "subscription" | "boost" | "pack" | "listing";
  userId: string;
  planId?: PlanId;
  listingId?: string;
  boostType?: BoostType;
  packId?: PackId;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MercadoPago sends different notification types
    const { type, data } = body;

    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    // El data.id oficial para la firma viene en el query string.
    const paymentId =
      req.nextUrl.searchParams.get("data.id") ?? (data?.id ? String(data.id) : null);

    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    if (!verifyWebhookSignature(req, String(paymentId))) {
      console.error("[MP Webhook] Firma inválida, notificación rechazada");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Idempotencia: si este pago de MP ya fue procesado, no repetir
    // (evita duplicar créditos/boosts ante reenvíos o replays).
    const alreadyProcessed = await getPaymentByMpPaymentId(String(paymentId));
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // Fetch payment details from MercadoPago
    const client = getClient();
    const paymentApi = new Payment(client);

    const mpPayment = await paymentApi.get({ id: paymentId });

    if (!mpPayment || mpPayment.status !== "approved") {
      return NextResponse.json({ received: true, status: mpPayment?.status });
    }

    // Parse external reference
    let ref: ExternalReference;

    try {
      ref = JSON.parse(mpPayment.external_reference ?? "{}");
    } catch {
      console.error("Invalid external reference:", mpPayment.external_reference);
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
    }

    const { type: refType, userId, planId, listingId, boostType, packId } = ref;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Process based on payment type
    switch (refType) {
      case "subscription": {
        if (!planId) {
          return NextResponse.json({ error: "Missing planId" }, { status: 400 });
        }

        await createSubscription({
          userId,
          planId,
          mpSubscriptionId: String(paymentId),
        });

        // Record payment
        await createPayment({
          userId,
          type: "subscription",
          amount: mpPayment.transaction_amount ?? 0,
          mpPreferenceId: undefined,
          metadata: { planId },
        }).then((p) => approvePayment(p.id, String(paymentId)));

        break;
      }

      case "listing": {
        if (!listingId) {
          return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
        }

        const existingPayment = mpPayment.id
          ? await getPaymentByPreferenceId(mpPayment.external_reference ?? "")
          : null;

        // Record payment if not created via our checkout (safety)
        const payment = existingPayment
          ? await approvePayment(existingPayment.id, String(paymentId))
          : await createPayment({
              userId,
              type: "listing",
              amount: mpPayment.transaction_amount ?? 0,
              mpPreferenceId: mpPayment.external_reference ?? undefined,
              metadata: { listingId },
            }).then((p) => approvePayment(p.id, String(paymentId)));

        // publish listing
        await publishListing(listingId, userId, { paymentId: payment?.id });

        break;
      }

      case "boost": {
        if (!listingId || !boostType) {
          return NextResponse.json(
            { error: "Missing listingId or boostType" },
            { status: 400 }
          );
        }

        const boost = BOOSTS[boostType];

        if (!boost) {
          return NextResponse.json({ error: "Invalid boostType" }, { status: 400 });
        }

        await createBoost({
          listingId,
          userId,
          boostType,
          durationDays: boost.durationDays,
        });

        // Record payment
        await createPayment({
          userId,
          type: "boost",
          amount: mpPayment.transaction_amount ?? 0,
          mpPreferenceId: undefined,
          metadata: { boostType, listingId },
        }).then((p) => approvePayment(p.id, String(paymentId)));

        break;
      }

      case "pack": {
        if (!packId) {
          return NextResponse.json({ error: "Missing packId" }, { status: 400 });
        }

        const pack = PACKS[packId];

        if (!pack) {
          return NextResponse.json({ error: "Invalid packId" }, { status: 400 });
        }

        await addUserCredits(userId, pack.boostCredits);

        // Record payment
        await createPayment({
          userId,
          type: "pack",
          amount: mpPayment.transaction_amount ?? 0,
          mpPreferenceId: undefined,
          metadata: { packId },
        }).then((p) => approvePayment(p.id, String(paymentId)));

        break;
      }

      default:
        console.error("Unknown payment type:", refType);
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// MercadoPago may also send GET requests for verification
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
