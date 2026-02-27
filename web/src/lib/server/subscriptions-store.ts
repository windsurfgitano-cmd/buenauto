import "server-only";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import type { PlanId, BoostType } from "@/lib/plans";

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

function getSubscriptionsFilePath() {
  return path.join(process.cwd(), "data", "subscriptions.json");
}

function getPaymentsFilePath() {
  return path.join(process.cwd(), "data", "payments.json");
}

function getBoostsFilePath() {
  return path.join(process.cwd(), "data", "boosts.json");
}

function getCreditsFilePath() {
  return path.join(process.cwd(), "data", "credits.json");
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filePath: string, value: unknown[]) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Subscriptions

export async function loadSubscriptions(): Promise<Subscription[]> {
  return readJsonArray<Subscription>(getSubscriptionsFilePath());
}

async function saveSubscriptions(subs: Subscription[]) {
  await writeJsonArray(getSubscriptionsFilePath(), subs);
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const subs = await loadSubscriptions();
  const now = Date.now();

  return (
    subs.find(
      (s) =>
        s.userId === userId &&
        s.status === "active" &&
        new Date(s.currentPeriodEnd).getTime() > now
    ) ?? null
  );
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
  const subs = await loadSubscriptions();

  // Cancel any existing active subscription
  const updated = subs.map((s) => {
    if (s.userId === input.userId && s.status === "active") {
      return { ...s, status: "cancelled" as const, cancelledAt: nowIso() };
    }
    return s;
  });

  const now = new Date();
  const sub: Subscription = {
    id: newId("sub"),
    userId: input.userId,
    planId: input.planId,
    status: "active",
    mpSubscriptionId: input.mpSubscriptionId,
    currentPeriodStart: nowIso(),
    currentPeriodEnd: addDays(now, 30).toISOString(),
    createdAt: nowIso(),
  };

  await saveSubscriptions([sub, ...updated]);
  return sub;
}

export async function cancelSubscription(userId: string): Promise<Subscription | null> {
  const subs = await loadSubscriptions();
  const idx = subs.findIndex((s) => s.userId === userId && s.status === "active");

  if (idx === -1) return null;

  const updated = { ...subs[idx], status: "cancelled" as const, cancelledAt: nowIso() };
  const next = [...subs];
  next[idx] = updated;

  await saveSubscriptions(next);
  return updated;
}

// Payments

export async function loadPayments(): Promise<Payment[]> {
  return readJsonArray<Payment>(getPaymentsFilePath());
}

async function savePayments(payments: Payment[]) {
  await writeJsonArray(getPaymentsFilePath(), payments);
}

export async function createPayment(input: {
  userId: string;
  type: Payment["type"];
  amount: number;
  mpPreferenceId?: string;
  metadata: Payment["metadata"];
}): Promise<Payment> {
  const payments = await loadPayments();

  const payment: Payment = {
    id: newId("pay"),
    userId: input.userId,
    type: input.type,
    amount: input.amount,
    currency: "CLP",
    status: "pending",
    mpPreferenceId: input.mpPreferenceId,
    metadata: input.metadata,
    createdAt: nowIso(),
  };

  await savePayments([payment, ...payments]);
  return payment;
}

export async function approvePayment(paymentId: string, mpPaymentId?: string): Promise<Payment | null> {
  const payments = await loadPayments();
  const idx = payments.findIndex((p) => p.id === paymentId);

  if (idx === -1) return null;

  const updated: Payment = {
    ...payments[idx],
    status: "approved",
    mpPaymentId,
    paidAt: nowIso(),
  };

  const next = [...payments];
  next[idx] = updated;

  await savePayments(next);
  return updated;
}

export async function getPaymentByPreferenceId(preferenceId: string): Promise<Payment | null> {
  const payments = await loadPayments();
  return payments.find((p) => p.mpPreferenceId === preferenceId) ?? null;
}

// Boosts

export async function loadBoosts(): Promise<ListingBoost[]> {
  return readJsonArray<ListingBoost>(getBoostsFilePath());
}

async function saveBoosts(boosts: ListingBoost[]) {
  await writeJsonArray(getBoostsFilePath(), boosts);
}

export async function getActiveBoost(listingId: string): Promise<ListingBoost | null> {
  const boosts = await loadBoosts();
  const now = Date.now();

  return (
    boosts.find(
      (b) => b.listingId === listingId && new Date(b.endsAt).getTime() > now
    ) ?? null
  );
}

export async function createBoost(input: {
  listingId: string;
  userId: string;
  boostType: BoostType;
  durationDays: number;
}): Promise<ListingBoost> {
  const boosts = await loadBoosts();
  const now = new Date();

  const boost: ListingBoost = {
    id: newId("boost"),
    listingId: input.listingId,
    userId: input.userId,
    boostType: input.boostType,
    startsAt: nowIso(),
    endsAt: addDays(now, input.durationDays).toISOString(),
    createdAt: nowIso(),
  };

  await saveBoosts([boost, ...boosts]);
  return boost;
}

export async function getBoostedListingIds(): Promise<string[]> {
  const boosts = await loadBoosts();
  const now = Date.now();

  return boosts
    .filter((b) => new Date(b.endsAt).getTime() > now)
    .map((b) => b.listingId);
}

// Credits

export async function loadCredits(): Promise<UserCredits[]> {
  return readJsonArray<UserCredits>(getCreditsFilePath());
}

async function saveCredits(credits: UserCredits[]) {
  await writeJsonArray(getCreditsFilePath(), credits);
}

export async function getUserCredits(userId: string): Promise<number> {
  const credits = await loadCredits();
  const record = credits.find((c) => c.userId === userId);
  return record?.boostCredits ?? 0;
}

export async function addUserCredits(userId: string, amount: number): Promise<number> {
  const credits = await loadCredits();
  const idx = credits.findIndex((c) => c.userId === userId);

  if (idx === -1) {
    const record: UserCredits = {
      userId,
      boostCredits: amount,
      updatedAt: nowIso(),
    };
    await saveCredits([record, ...credits]);
    return amount;
  }

  const current = credits[idx].boostCredits ?? 0;
  const updated: UserCredits = {
    ...credits[idx],
    boostCredits: current + amount,
    updatedAt: nowIso(),
  };

  const next = [...credits];
  next[idx] = updated;
  await saveCredits(next);

  return updated.boostCredits;
}

export async function consumeUserCredit(userId: string): Promise<boolean> {
  const credits = await loadCredits();
  const idx = credits.findIndex((c) => c.userId === userId);

  if (idx === -1 || credits[idx].boostCredits < 1) {
    return false;
  }

  const updated: UserCredits = {
    ...credits[idx],
    boostCredits: credits[idx].boostCredits - 1,
    updatedAt: nowIso(),
  };

  const next = [...credits];
  next[idx] = updated;
  await saveCredits(next);

  return true;
}
