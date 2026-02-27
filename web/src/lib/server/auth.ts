import "server-only";

import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const SESSION_COOKIE_NAME = "ba_session";

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type UserRecord = {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  passwordSalt: string;
  favorites?: string[];
  createdAt: string;
};

type SessionRecord = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name?: string;
  favorites: string[];
  createdAt: string;
};

function getUsersFilePath() {
  return path.join(process.cwd(), "data", "users.json");
}

function getSessionsFilePath() {
  return path.join(process.cwd(), "data", "sessions.json");
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
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadUsers() {
  return readJsonArray<UserRecord>(getUsersFilePath());
}

async function saveUsers(users: UserRecord[]) {
  await writeJsonArray(getUsersFilePath(), users);
}

async function loadSessions() {
  return readJsonArray<SessionRecord>(getSessionsFilePath());
}

async function saveSessions(sessions: SessionRecord[]) {
  await writeJsonArray(getSessionsFilePath(), sessions);
}

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

function sanitizeUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    createdAt: user.createdAt,
  };
}

function getNextUserId(users: UserRecord[]) {
  let max = 0;

  for (const u of users) {
    const match = /^u_(\d+)$/.exec(u.id);
    if (!match) continue;

    const num = Number(match[1]);
    if (!Number.isFinite(num)) continue;

    max = Math.max(max, num);
  }

  const next = max + 1;
  return `u_${String(next).padStart(4, "0")}`;
}

function newSessionId() {
  return `s_${crypto.randomBytes(24).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

async function purgeExpiredSessions() {
  const sessions = await loadSessions();
  const now = Date.now();
  const alive = sessions.filter((s) => {
    const ts = new Date(s.expiresAt).getTime();
    return Number.isFinite(ts) && ts > now;
  });

  if (alive.length !== sessions.length) {
    await saveSessions(alive);
  }

  return alive;
}

export async function getUserBySessionId(sessionId: string): Promise<PublicUser | null> {
  if (!sessionId) return null;

  const sessions = await purgeExpiredSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const users = await loadUsers();
  const user = users.find((u) => u.id === session.userId);
  return user ? sanitizeUser(user) : null;
}

export async function createSessionForUser(userId: string) {
  const sessions = await purgeExpiredSessions();

  const session: SessionRecord = {
    id: newSessionId(),
    userId,
    createdAt: nowIso(),
    expiresAt: addSeconds(new Date(), SESSION_TTL_SECONDS).toISOString(),
  };

  await saveSessions([session, ...sessions]);
  return session;
}

export async function deleteSession(sessionId: string) {
  if (!sessionId) return;

  const sessions = await purgeExpiredSessions();
  const next = sessions.filter((s) => s.id !== sessionId);

  if (next.length !== sessions.length) {
    await saveSessions(next);
  }
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

  const users = await loadUsers();

  if (users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error("Email already exists");
  }

  const salt = newSalt();
  const user: UserRecord = {
    id: getNextUserId(users),
    email,
    name: name || undefined,
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    favorites: [],
    createdAt: nowIso(),
  };

  await saveUsers([user, ...users]);
  return sanitizeUser(user);
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  const users = await loadUsers();
  const user = users.find((u) => normalizeEmail(u.email) === email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const expected = user.passwordHash;
  const actual = hashPassword(password, user.passwordSalt);

  if (!safeEqualHex(expected, actual)) {
    throw new Error("Invalid credentials");
  }

  return sanitizeUser(user);
}

export async function toggleFavorite(userId: string, listingId: string) {
  if (!userId) throw new Error("Missing user");
  if (!listingId) throw new Error("Missing listing");

  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Missing user");

  const u = users[idx];
  const favorites = Array.isArray(u.favorites) ? [...u.favorites] : [];
  const pos = favorites.indexOf(listingId);

  if (pos === -1) {
    favorites.unshift(listingId);
  } else {
    favorites.splice(pos, 1);
  }

  const nextUser: UserRecord = {
    ...u,
    favorites,
  };

  const nextUsers = [...users];
  nextUsers[idx] = nextUser;

  await saveUsers(nextUsers);
  return sanitizeUser(nextUser);
}

export async function getUserById(userId: string) {
  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);
  return user ? sanitizeUser(user) : null;
}

export async function getUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const users = await loadUsers();
  const user = users.find((u) => normalizeEmail(u.email) === normalized);
  return user ? sanitizeUser(user) : null;
}

export async function updateUserName(userId: string, name: string) {
  if (!userId) throw new Error("Missing user");

  const normalized = name.trim();
  const nextName = normalized ? normalized : undefined;

  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Missing user");

  const u = users[idx];
  const nextUser: UserRecord = {
    ...u,
    name: nextName,
  };

  const nextUsers = [...users];
  nextUsers[idx] = nextUser;
  await saveUsers(nextUsers);

  return sanitizeUser(nextUser);
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

  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Missing user");

  const u = users[idx];
  const expected = u.passwordHash;
  const actual = hashPassword(currentPassword, u.passwordSalt);

  if (!safeEqualHex(expected, actual)) {
    throw new Error("Invalid credentials");
  }

  const salt = newSalt();

  const nextUser: UserRecord = {
    ...u,
    passwordSalt: salt,
    passwordHash: hashPassword(newPassword, salt),
  };

  const nextUsers = [...users];
  nextUsers[idx] = nextUser;
  await saveUsers(nextUsers);

  return sanitizeUser(nextUser);
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}
