import "server-only";

import crypto from "crypto";

import type { PlanId, BoostType } from "@/lib/plans";
import { query, toIso, toIsoOrUndefined } from "@/lib/server/db";

export type Subscription = {
  id: string;
  userId: string;
  planId: PlanId;
  status: "active" | "cancelled" | "expired";
  mpSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  cancelledAt?: string;
};

export type Payment = {
  id: string;
  userId: string;
  type: "subscription" | "boost" | "pack" | "listing";
  amount: number;
  currency: "CLP";
  status: "pending" | "approved" | "rejected";
  mpPaymentId?: string;
  mpPreferenceId?: string;
  metadata: {
    planId?: PlanId;
    boostType?: BoostType;
    packId?: string;
    listingId?: string;
  };
  createdAt: string;
  paidAt?: string;
};

export type ListingBoost = {
  id: string;
  listingId: string;
  userId: string;
  boostType: BoostType;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type UserCredits = {
  userId: string;
  boostCredits: number;
  updatedAt: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  mp_subscription_id: string | null;
  current_period_start: unknown;
  current_period_end: unknown;
  created_at: unknown;
  cancelled_at: unknown;
};

type PaymentRow = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  metadata: unknown;
  created_at: unknown;
  paid_at: unknown;
};

type BoostRow = {
  id: string;
  listing_id: string;
  user_id: string;
  boost_type: string;
  starts_at: unknown;
  ends_at: unknown;
  created_at: unknown;
};

type CreditsRow = {
  user_id: string;
  boost_credits: number;
  updated_at: unknown;
};

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id as PlanId,
    status: row.status as Subscription["status"],
    mpSubscriptionId: row.mp_subscription_id ?? undefined,
    currentPeriodStart: toIso(row.current_period_start),
    currentPeriodEnd: toIso(row.current_period_end),
    createdAt: toIso(row.created_at),
    cancelledAt: toIsoOrUndefined(row.cancelled_at),
  };
}

function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Payment["type"],
    amount: Number(row.amount),
    currency: "CLP",
    status: row.status as Payment["status"],
    mpPaymentId: row.mp_payment_id ?? undefined,
    mpPreferenceId: row.mp_preference_id ?? undefined,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Payment["metadata"])
        : {},
    createdAt: toIso(row.created_at),
    paidAt: toIsoOrUndefined(row.paid_at),
  };
}

function rowToBoost(row: BoostRow): ListingBoost {
  return {
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    boostType: row.boost_type as BoostType,
    startsAt: toIso(row.starts_at),
    endsAt: toIso(row.ends_at),
    createdAt: toIso(row.created_at),
  };
}

function rowToCredits(row: CreditsRow): UserCredits {
  return {
    userId: row.user_id,
    boostCredits: Number(row.boost_credits),
    updatedAt: toIso(row.updated_at),
  };
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

// Subscriptions

export async function loadSubscriptions(): Promise<Subscription[]> {
  const rows = await query<SubscriptionRow>(
    `SELECT * FROM subscriptions ORDER BY created_at DESC`,
  );
  return rows.map(rowToSubscription);
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const rows = await query<SubscriptionRow>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1 AND status = 'active' AND current_period_end > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  return rows.length > 0 ? rowToSubscription(rows[0]) : null;
}

export async function getUserPlanId(userId: string): Promise<PlanId> {
  const sub = await getActiveSubscription(userId);
  return sub?.planId ?? "free";
}

export async function createSubscription(input: {
  userId: string;
  planId: PlanId;
  mpSubscriptionId?: string;
}): Promise<Subscription> {
  await query(
    `UPDATE subscriptions SET status = 'cancelled', cancelled_at = now()
     WHERE user_id = $1 AND status = 'active'`,
    [input.userId],
  );

  const rows = await query<SubscriptionRow>(
    `INSERT INTO subscriptions (
      id, user_id, plan_id, status, mp_subscription_id,
      current_period_start, current_period_end, created_at
    ) VALUES ($1, $2, $3, 'active', $4, now(), now() + interval '30 days', now())
    RETURNING *`,
    [newId("sub"), input.userId, input.planId, input.mpSubscriptionId ?? null],
  );

  return rowToSubscription(rows[0]);
}

export async function cancelSubscription(userId: string): Promise<Subscription | null> {
  const rows = await query<SubscriptionRow>(
    `UPDATE subscriptions SET status = 'cancelled', cancelled_at = now()
     WHERE id = (
       SELECT id FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING *`,
    [userId],
  );

  return rows.length > 0 ? rowToSubscription(rows[0]) : null;
}

// Payments

export async function loadPayments(): Promise<Payment[]> {
  const rows = await query<PaymentRow>(
    `SELECT * FROM payments ORDER BY created_at DESC`,
  );
  return rows.map(rowToPayment);
}

export async function createPayment(input: {
  userId: string;
  type: Payment["type"];
  amount: number;
  mpPreferenceId?: string;
  metadata: Payment["metadata"];
}): Promise<Payment> {
  const rows = await query<PaymentRow>(
    `INSERT INTO payments (
      id, user_id, type, amount, currency, status,
      mp_preference_id, metadata, created_at
    ) VALUES ($1, $2, $3, $4, 'CLP', 'pending', $5, $6, now())
    RETURNING *`,
    [
      newId("pay"),
      input.userId,
      input.type,
      input.amount,
      input.mpPreferenceId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return rowToPayment(rows[0]);
}

export async function approvePayment(paymentId: string, mpPaymentId?: string): Promise<Payment | null> {
  const rows = await query<PaymentRow>(
    `UPDATE payments SET status = 'approved', mp_payment_id = $2, paid_at = now()
     WHERE id = $1
     RETURNING *`,
    [paymentId, mpPaymentId ?? null],
  );

  return rows.length > 0 ? rowToPayment(rows[0]) : null;
}

export async function getPaymentByPreferenceId(preferenceId: string): Promise<Payment | null> {
  const rows = await query<PaymentRow>(
    `SELECT * FROM payments WHERE mp_preference_id = $1 LIMIT 1`,
    [preferenceId],
  );
  return rows.length > 0 ? rowToPayment(rows[0]) : null;
}

// Boosts

export async function loadBoosts(): Promise<ListingBoost[]> {
  const rows = await query<BoostRow>(
    `SELECT * FROM boosts ORDER BY created_at DESC`,
  );
  return rows.map(rowToBoost);
}

export async function getActiveBoost(listingId: string): Promise<ListingBoost | null> {
  const rows = await query<BoostRow>(
    `SELECT * FROM boosts WHERE listing_id = $1 AND ends_at > now() LIMIT 1`,
    [listingId],
  );
  return rows.length > 0 ? rowToBoost(rows[0]) : null;
}

export async function createBoost(input: {
  listingId: string;
  userId: string;
  boostType: BoostType;
  durationDays: number;
}): Promise<ListingBoost> {
  const rows = await query<BoostRow>(
    `INSERT INTO boosts (id, listing_id, user_id, boost_type, starts_at, ends_at, created_at)
     VALUES ($1, $2, $3, $4, now(), now() + make_interval(days => $5), now())
     RETURNING *`,
    [newId("boost"), input.listingId, input.userId, input.boostType, input.durationDays],
  );

  return rowToBoost(rows[0]);
}

export async function getBoostedListingIds(): Promise<string[]> {
  const rows = await query<{ listing_id: string }>(
    `SELECT DISTINCT listing_id FROM boosts WHERE ends_at > now()`,
  );
  return rows.map((r) => r.listing_id);
}

// Credits

export async function loadCredits(): Promise<UserCredits[]> {
  const rows = await query<CreditsRow>(`SELECT * FROM credits`);
  return rows.map(rowToCredits);
}

export async function getUserCredits(userId: string): Promise<number> {
  const rows = await query<{ boost_credits: number }>(
    `SELECT boost_credits FROM credits WHERE user_id = $1`,
    [userId],
  );
  return rows.length > 0 ? Number(rows[0].boost_credits) : 0;
}

export async function addUserCredits(userId: string, amount: number): Promise<number> {
  const rows = await query<{ boost_credits: number }>(
    `INSERT INTO credits (user_id, boost_credits, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE
       SET boost_credits = credits.boost_credits + $2, updated_at = now()
     RETURNING boost_credits`,
    [userId, amount],
  );
  return Number(rows[0].boost_credits);
}

export async function consumeUserCredit(userId: string): Promise<boolean> {
  const rows = await query<{ boost_credits: number }>(
    `UPDATE credits SET boost_credits = boost_credits - 1, updated_at = now()
     WHERE user_id = $1 AND boost_credits >= 1
     RETURNING boost_credits`,
    [userId],
  );
  return rows.length > 0;
}
