import "server-only";

import { cookies } from "next/headers";

import { getUserBySessionId, SESSION_COOKIE_NAME } from "@/lib/server/auth";

export async function getSessionId() {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser() {
  const sessionId = await getSessionId();
  if (!sessionId) return null;
  return getUserBySessionId(sessionId);
}
