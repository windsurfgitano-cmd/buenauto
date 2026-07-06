#!/usr/bin/env node
// @ts-check
/**
 * Crea el esquema en Neon/Postgres e importa los datos existentes de data/*.json.
 * Idempotente: CREATE TABLE IF NOT EXISTS + INSERT ... ON CONFLICT DO NOTHING.
 *
 * Uso: node scripts/migrate-to-neon.mjs
 * Lee DATABASE_URL (o NETLIFY_DATABASE_URL) del entorno o de .env.local.
 */

import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

async function loadEnvLocal() {
  if (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) return;

  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const key = match[1];
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // sin .env.local
  }
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS listings (
    id text PRIMARY KEY,
    owner_id text,
    status text NOT NULL DEFAULT 'published',
    brand text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    price integer NOT NULL,
    km integer NOT NULL,
    region text NOT NULL DEFAULT '',
    city text NOT NULL DEFAULT '',
    transmission text NOT NULL DEFAULT '',
    fuel text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    contact_name text NOT NULL DEFAULT '',
    contact_phone text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    expires_at timestamptz,
    payment_id text,
    invoice_email text,
    invoice_rut text
  )`,
  `CREATE INDEX IF NOT EXISTS listings_public_idx ON listings (status, expires_at)`,
  `CREATE INDEX IF NOT EXISTS listings_brand_idx ON listings (brand)`,
  `CREATE INDEX IF NOT EXISTS listings_owner_idx ON listings (owner_id)`,
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text,
    password_hash text NOT NULL,
    password_salt text NOT NULL,
    favorites jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    email text PRIMARY KEY,
    failed_count integer NOT NULL DEFAULT 0,
    last_attempt_at timestamptz NOT NULL DEFAULT now(),
    locked_until timestamptz
  )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    status text NOT NULL,
    mp_subscription_id text,
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    cancelled_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions (user_id, status)`,
  `CREATE TABLE IF NOT EXISTS payments (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    currency text NOT NULL DEFAULT 'CLP',
    status text NOT NULL,
    mp_payment_id text,
    mp_preference_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS payments_preference_idx ON payments (mp_preference_id)`,
  `CREATE TABLE IF NOT EXISTS boosts (
    id text PRIMARY KEY,
    listing_id text NOT NULL,
    user_id text NOT NULL,
    boost_type text NOT NULL,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS boosts_listing_idx ON boosts (listing_id, ends_at)`,
  `CREATE TABLE IF NOT EXISTS credits (
    user_id text PRIMARY KEY,
    boost_credits integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS catalog_custom (
    brand text NOT NULL,
    model text NOT NULL,
    PRIMARY KEY (brand, model)
  )`,
];

async function readJson(relPath) {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), relPath), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  await loadEnvLocal();

  const url = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    console.error(
      "Falta DATABASE_URL. Agrégala a web/.env.local o al entorno y reintenta.",
    );
    process.exit(1);
  }

  const sql = neon(url);

  console.log("Creando esquema...");
  for (const stmt of SCHEMA) {
    await sql.query(stmt);
  }

  const listings = await readJson("data/listings.json");
  if (Array.isArray(listings)) {
    let inserted = 0;
    for (const l of listings) {
      if (!l || typeof l.id !== "string") continue;
      const rows = await sql.query(
        `INSERT INTO listings (
          id, owner_id, status, brand, model, year, price, km,
          region, city, transmission, fuel, description, images,
          contact_name, contact_phone, created_at, published_at,
          expires_at, payment_id, invoice_email, invoice_rut
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        ON CONFLICT (id) DO NOTHING
        RETURNING id`,
        [
          l.id,
          l.ownerId ?? null,
          l.status ?? "published",
          l.brand,
          l.model,
          l.year,
          l.price,
          l.km,
          l.region ?? "",
          l.city ?? "",
          l.transmission ?? "",
          l.fuel ?? "",
          l.description ?? "",
          JSON.stringify(Array.isArray(l.images) ? l.images : []),
          l.contactName ?? "",
          l.contactPhone ?? "",
          l.createdAt ?? new Date().toISOString(),
          l.publishedAt ?? null,
          l.expiresAt ?? null,
          l.paymentId ?? null,
          l.invoiceEmail ?? null,
          l.invoiceRUT ?? null,
        ],
      );
      inserted += rows.length;
    }
    console.log(`listings: ${inserted} importados (${listings.length} en JSON)`);
  }

  const users = await readJson("data/users.json");
  if (Array.isArray(users)) {
    let inserted = 0;
    for (const u of users) {
      if (!u || typeof u.id !== "string") continue;
      const rows = await sql.query(
        `INSERT INTO users (id, email, name, password_hash, password_salt, favorites, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [
          u.id,
          u.email,
          u.name ?? null,
          u.passwordHash,
          u.passwordSalt,
          JSON.stringify(Array.isArray(u.favorites) ? u.favorites : []),
          u.createdAt ?? new Date().toISOString(),
        ],
      );
      inserted += rows.length;
    }
    console.log(`users: ${inserted} importados`);
  }

  const customCatalog = await readJson("data/catalog_custom.json");
  const customBrands =
    customCatalog && typeof customCatalog === "object" && customCatalog.brands
      ? customCatalog.brands
      : {};
  let customInserted = 0;
  for (const [brand, models] of Object.entries(customBrands)) {
    if (!Array.isArray(models)) continue;
    for (const model of models) {
      if (typeof model !== "string" || !model.trim()) continue;
      const rows = await sql.query(
        `INSERT INTO catalog_custom (brand, model) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING brand`,
        [brand.trim().toUpperCase(), model.trim()],
      );
      customInserted += rows.length;
    }
  }
  if (customInserted > 0) {
    console.log(`catalog_custom: ${customInserted} modelos importados`);
  }

  const counts = await sql.query(
    `SELECT
      (SELECT count(*) FROM listings) AS listings,
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM catalog_custom) AS catalog_custom`,
  );
  console.log("Totales en la base:", counts[0]);
  console.log("Migración OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
