import "server-only";

import crypto from "crypto";

import { query, toIso } from "@/lib/server/db";

export const SESSION_COOKIE_NAME = "ba_session";

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  password_salt: string;
  favorites: unknown;
  created_at: unknown;
};

export type PublicUser = {
  id: string;
  email: string;
  name?: string;
  favorites: string[];
  createdAt: string;
};

const USER_COLUMNS = `id, email, name, password_hash, password_salt, favorites, created_at`;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return /^\S+@\S+\.\S+$/.test(normalized);
}

function newSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string) {
  return crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
}

function safeEqualHex(a: string, b: string) {
  try {
    const aa = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

function rowToPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    favorites: Array.isArray(row.favorites) ? (row.favorites as string[]) : [],
    createdAt: toIso(row.created_at),
  };
}

async function getNextUserId() {
  const rows = await query<{ max_num: number | null }>(
    `SELECT max((substring(id from 'u_(\\d+)'))::int) AS max_num
     FROM users WHERE id ~ '^u_\\d+$'`,
  );
  const next = (rows[0]?.max_num ?? 0) + 1;
  return `u_${String(next).padStart(4, "0")}`;
}

function newSessionId() {
  return `s_${crypto.randomBytes(24).toString("hex")}`;
}

export async function getUserBySessionId(sessionId: string): Promise<PublicUser | null> {
  if (!sessionId) return null;

  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS.split(", ")
      .map((c) => `u.${c}`)
      .join(", ")}
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId],
  );

  return rows.length > 0 ? rowToPublicUser(rows[0]) : null;
}

export async function createSessionForUser(userId: string) {
  // Limpieza oportunista de sesiones vencidas (antes se hacía en cada purge).
  await query(`DELETE FROM sessions WHERE expires_at <= now()`);

  const id = newSessionId();
  const rows = await query<{ id: string; user_id: string; created_at: unknown; expires_at: unknown }>(
    `INSERT INTO sessions (id, user_id, created_at, expires_at)
     VALUES ($1, $2, now(), now() + make_interval(secs => $3))
     RETURNING id, user_id, created_at, expires_at`,
    [id, userId, SESSION_TTL_SECONDS],
  );

  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: toIso(row.created_at),
    expiresAt: toIso(row.expires_at),
  };
}

export async function deleteSession(sessionId: string) {
  if (!sessionId) return;
  await query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const name = input.name?.trim();

  if (!isValidEmail(email)) {
    throw new Error("Invalid email");
  }

  if (!password || password.length < 6) {
    throw new Error("Invalid password");
  }

  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = $1`,
    [email],
  );

  if (existing.length > 0) {
    throw new Error("Email already exists");
  }

  const salt = newSalt();
  const passwordHash = hashPassword(password, salt);

  // Reintento por si dos registros concurrentes calculan el mismo id.
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = await getNextUserId();

    const rows = await query<UserRow>(
      `INSERT INTO users (id, email, name, password_hash, password_salt, favorites, created_at)
       VALUES ($1, $2, $3, $4, $5, '[]'::jsonb, now())
       ON CONFLICT (id) DO NOTHING
       RETURNING ${USER_COLUMNS}`,
      [id, email, name || null, passwordHash, salt],
    );

    if (rows.length > 0) {
      return rowToPublicUser(rows[0]);
    }
  }

  throw new Error("Could not allocate user id");
}

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

/**
 * Ventana de fuerza bruta: bloquea un email tras varios intentos
 * fallidos seguidos. Se resetea al iniciar sesión con éxito.
 */
export async function checkLoginLock(email: string): Promise<void> {
  const normalized = normalizeEmail(email);

  const rows = await query<{ locked_until: unknown }>(
    `SELECT locked_until FROM login_attempts
     WHERE email = $1 AND locked_until > now()`,
    [normalized],
  );

  if (rows.length > 0) {
    throw new Error("Too many attempts");
  }
}

async function recordLoginFailure(email: string): Promise<void> {
  const normalized = normalizeEmail(email);

  await query(
    `INSERT INTO login_attempts (email, failed_count, last_attempt_at, locked_until)
     VALUES ($1, 1, now(), NULL)
     ON CONFLICT (email) DO UPDATE SET
       failed_count = CASE
         WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until <= now()
           THEN 1
         ELSE login_attempts.failed_count + 1
       END,
       last_attempt_at = now(),
       locked_until = CASE
         WHEN (CASE
           WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until <= now()
             THEN 1
           ELSE login_attempts.failed_count + 1
         END) >= $2
           THEN now() + make_interval(mins => $3)
         ELSE NULL
       END`,
    [normalized, LOGIN_MAX_ATTEMPTS, LOGIN_LOCK_MINUTES],
  );
}

async function recordLoginSuccess(email: string): Promise<void> {
  await query(`DELETE FROM login_attempts WHERE email = $1`, [normalizeEmail(email)]);
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  await checkLoginLock(email);

  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = $1`,
    [email],
  );

  const user = rows[0];

  if (!user) {
    await recordLoginFailure(email);
    throw new Error("Invalid credentials");
  }

  const expected = user.password_hash;
  const actual = hashPassword(password, user.password_salt);

  if (!safeEqualHex(expected, actual)) {
    await recordLoginFailure(email);
    throw new Error("Invalid credentials");
  }

  await recordLoginSuccess(email);
  return rowToPublicUser(user);
}

export async function toggleFavorite(userId: string, listingId: string) {
  if (!userId) throw new Error("Missing user");
  if (!listingId) throw new Error("Missing listing");

  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );
  const user = rows[0];
  if (!user) throw new Error("Missing user");

  const favorites = Array.isArray(user.favorites)
    ? [...(user.favorites as string[])]
    : [];
  const pos = favorites.indexOf(listingId);

  if (pos === -1) {
    favorites.unshift(listingId);
  } else {
    favorites.splice(pos, 1);
  }

  const updated = await query<UserRow>(
    `UPDATE users SET favorites = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, JSON.stringify(favorites)],
  );

  return rowToPublicUser(updated[0]);
}

export async function getUserById(userId: string) {
  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );
  return rows.length > 0 ? rowToPublicUser(rows[0]) : null;
}

export async function getUserByEmail(email: string) {
  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = $1`,
    [normalizeEmail(email)],
  );
  return rows.length > 0 ? rowToPublicUser(rows[0]) : null;
}

export async function updateUserName(userId: string, name: string) {
  if (!userId) throw new Error("Missing user");

  const normalized = name.trim();

  const rows = await query<UserRow>(
    `UPDATE users SET name = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, normalized || null],
  );

  if (rows.length === 0) throw new Error("Missing user");
  return rowToPublicUser(rows[0]);
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (!userId) throw new Error("Missing user");

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Invalid password");
  }

  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );
  const user = rows[0];
  if (!user) throw new Error("Missing user");

  const expected = user.password_hash;
  const actual = hashPassword(currentPassword, user.password_salt);

  if (!safeEqualHex(expected, actual)) {
    throw new Error("Invalid credentials");
  }

  const salt = newSalt();
  const passwordHash = hashPassword(newPassword, salt);

  const updated = await query<UserRow>(
    `UPDATE users SET password_salt = $2, password_hash = $3 WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [userId, salt, passwordHash],
  );

  return rowToPublicUser(updated[0]);
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}

/**
 * Elimina la cuenta y sus sesiones (cascade por FK). Los avisos del
 * usuario se borran aparte, desde el caller, con
 * deleteListingsByOwner. Los pagos/suscripciones quedan (registro
 * contable), sin datos personales asociados una vez borrado el user.
 */
export async function deleteUser(userId: string, currentPassword: string) {
  const rows = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
    userId,
  ]);
  const user = rows[0];
  if (!user) throw new Error("Missing user");

  const expected = user.password_hash;
  const actual = hashPassword(currentPassword, user.password_salt);

  if (!safeEqualHex(expected, actual)) {
    throw new Error("Invalid credentials");
  }

  await query(`DELETE FROM login_attempts WHERE email = $1`, [user.email]);
  await query(`DELETE FROM users WHERE id = $1`, [userId]);
}
