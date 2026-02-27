import "server-only";

import { MercadoPagoConfig, Preference } from "mercadopago";

import { PLANS, BOOSTS, PACKS, type PlanId, type BoostType, type PackId } from "@/lib/plans";

const LISTING_PRICE_CLP = 5000;

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "TEST-0000000000000000-000000-00000000000000000000000000000000-000000000";

  if (!accessToken || accessToken.includes("00000000")) {
    console.warn("[MercadoPago] Using dummy token - payments will not work");
  }

  return new MercadoPagoConfig({ accessToken });
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
}

export async function createListingPreference(input: {
  userId: string;
  listingId: string;
  userEmail: string;
}): Promise<{ preferenceId: string; initPoint: string }> {
  const client = getClient();
  const preference = new Preference(client);

  const siteUrl = getSiteUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          id: `listing_${input.listingId}`,
          title: "Publicación de aviso - BuenAuto",
          description: "Publicar aviso por 30 días",
          quantity: 1,
          unit_price: LISTING_PRICE_CLP,
          currency_id: "CLP",
        },
      ],
      payer: {
        email: input.userEmail,
      },
      back_urls: {
        success: `${siteUrl}/mis-avisos?pay=ok`,
        failure: `${siteUrl}/mis-avisos?pay=fail`,
        pending: `${siteUrl}/mis-avisos?pay=pending`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: "listing",
        userId: input.userId,
        listingId: input.listingId,
      }),
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Failed to create MercadoPago preference");
  }

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
  };
}

export async function createSubscriptionPreference(input: {
  userId: string;
  planId: PlanId;
  userEmail: string;
}): Promise<{ preferenceId: string; initPoint: string }> {
  const plan = PLANS[input.planId];

  if (!plan || plan.price === 0) {
    throw new Error("Invalid plan for subscription");
  }

  const client = getClient();
  const preference = new Preference(client);

  const siteUrl = getSiteUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          id: `plan_${plan.id}`,
          title: `BuenAuto ${plan.name} - Suscripción Mensual`,
          description: plan.features.slice(0, 3).join(", "),
          quantity: 1,
          unit_price: plan.price,
          currency_id: "CLP",
        },
      ],
      payer: {
        email: input.userEmail,
      },
      back_urls: {
        success: `${siteUrl}/planes/exito?plan=${plan.id}`,
        failure: `${siteUrl}/planes/error`,
        pending: `${siteUrl}/planes/pendiente`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: "subscription",
        userId: input.userId,
        planId: input.planId,
      }),
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Failed to create MercadoPago preference");
  }

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
  };
}

export async function createBoostPreference(input: {
  userId: string;
  listingId: string;
  boostType: BoostType;
  userEmail: string;
}): Promise<{ preferenceId: string; initPoint: string }> {
  const boost = BOOSTS[input.boostType];

  if (!boost) {
    throw new Error("Invalid boost type");
  }

  const client = getClient();
  const preference = new Preference(client);

  const siteUrl = getSiteUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          id: `boost_${boost.id}`,
          title: `BuenAuto - ${boost.name}`,
          description: boost.description,
          quantity: 1,
          unit_price: boost.price,
          currency_id: "CLP",
        },
      ],
      payer: {
        email: input.userEmail,
      },
      back_urls: {
        success: `${siteUrl}/autos/${input.listingId}?boosted=1`,
        failure: `${siteUrl}/autos/${input.listingId}?boost_error=1`,
        pending: `${siteUrl}/autos/${input.listingId}?boost_pending=1`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: "boost",
        userId: input.userId,
        listingId: input.listingId,
        boostType: input.boostType,
      }),
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Failed to create MercadoPago preference");
  }

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
  };
}

export async function createPackPreference(input: {
  userId: string;
  packId: PackId;
  userEmail: string;
}): Promise<{ preferenceId: string; initPoint: string }> {
  const pack = PACKS[input.packId];

  if (!pack) {
    throw new Error("Invalid pack");
  }

  const client = getClient();
  const preference = new Preference(client);

  const siteUrl = getSiteUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          id: `pack_${pack.id}`,
          title: `BuenAuto - ${pack.name}`,
          description: `${pack.boostCredits} destacados para usar cuando quieras. ${pack.savings}`,
          quantity: 1,
          unit_price: pack.price,
          currency_id: "CLP",
        },
      ],
      payer: {
        email: input.userEmail,
      },
      back_urls: {
        success: `${siteUrl}/cuenta?pack_success=1`,
        failure: `${siteUrl}/cuenta?pack_error=1`,
        pending: `${siteUrl}/cuenta?pack_pending=1`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        type: "pack",
        userId: input.userId,
        packId: input.packId,
      }),
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Failed to create MercadoPago preference");
  }

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
  };
}
