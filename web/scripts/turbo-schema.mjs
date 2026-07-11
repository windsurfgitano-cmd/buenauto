#!/usr/bin/env node
// @ts-check
/**
 * Esquema de la capa TURBO 2.0 (encima de buenauto): puntos, swipes y leads.
 * Aditivo e idempotente (CREATE TABLE IF NOT EXISTS). Uso: node scripts/turbo-schema.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

async function loadEnvLocal() {
  if (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) return;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch {
    // sin .env.local
  }
}

const SCHEMA = [
  // Ledger de puntos (gamificación). Saldo = SUM(points). Idempotente por (user, action, ref).
  `CREATE TABLE IF NOT EXISTS turbo_points (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    action text NOT NULL,
    points integer NOT NULL,
    ref text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, action, ref)
  )`,
  `CREATE INDEX IF NOT EXISTS turbo_points_user_idx ON turbo_points (user_id)`,

  // Swipes del feed. like/pass por usuario+aviso (una fila por par).
  `CREATE TABLE IF NOT EXISTS turbo_swipes (
    user_id text NOT NULL,
    listing_id text NOT NULL,
    direction text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
  )`,
  `CREATE INDEX IF NOT EXISTS turbo_swipes_user_idx ON turbo_swipes (user_id)`,

  // Leads = cotizaciones que van al vendedor del aviso.
  `CREATE TABLE IF NOT EXISTS turbo_leads (
    id bigserial PRIMARY KEY,
    user_id text,
    listing_id text NOT NULL,
    owner_id text,
    down_payment integer NOT NULL,
    term_months integer NOT NULL,
    monthly_estimate integer NOT NULL,
    applied_points integer NOT NULL DEFAULT 0,
    benefit text,
    contact_name text NOT NULL,
    contact_phone text NOT NULL,
    contact_email text NOT NULL,
    status text NOT NULL DEFAULT 'new',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS turbo_leads_owner_idx ON turbo_leads (owner_id)`,
  `CREATE INDEX IF NOT EXISTS turbo_leads_user_idx ON turbo_leads (user_id)`,
];

async function main() {
  await loadEnvLocal();
  const url = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL en el entorno o en web/.env.local");
    process.exit(1);
  }
  const sql = neon(url);
  console.log("Creando esquema TURBO...");
  for (const stmt of SCHEMA) await sql.query(stmt);
  const counts = await sql.query(
    `SELECT
      (SELECT count(*) FROM turbo_points) AS points,
      (SELECT count(*) FROM turbo_swipes) AS swipes,
      (SELECT count(*) FROM turbo_leads) AS leads`,
  );
  console.log("Tablas TURBO listas:", counts[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
