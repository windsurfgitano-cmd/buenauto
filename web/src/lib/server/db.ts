import "server-only";

import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL ?? "";
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. Crea una base en Neon y agrega DATABASE_URL a web/.env.local (local) o a las variables de entorno del hosting.",
    );
  }
  return url;
}

function getClient() {
  if (!client) {
    client = neon(getDatabaseUrl());
  }
  return client;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const sql = getClient();
  const rows = await sql.query(text, params);
  return rows as T[];
}

export function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const d = new Date(value);
    if (Number.isFinite(d.getTime())) return d.toISOString();
  }
  return String(value ?? "");
}

export function toIsoOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return toIso(value);
}

/** Escapa % _ y \ para usar input de usuario dentro de LIKE/ILIKE. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
