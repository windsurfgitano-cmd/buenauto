import { NextResponse } from "next/server";

import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { getSessionId } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sessionId = await getSessionId();

  if (sessionId) {
    await deleteSession(sessionId);
  }

  const accept = req.headers.get("accept") ?? "";
  const wantsHtml = accept.includes("text/html");

  const res = wantsHtml
    ? NextResponse.redirect(new URL("/", req.url), { status: 303 })
    : NextResponse.json({ ok: true });

  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
