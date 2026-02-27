import { NextResponse } from "next/server";

import {
  authenticateUser,
  createSessionForUser,
  getSessionTtlSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as LoginBody;

  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";

  try {
    const user = await authenticateUser({ email, password });
    const session = await createSessionForUser(user.id);

    const res = NextResponse.json({ user }, { status: 200 });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.id,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return res;
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to login";
    const message = raw === "Invalid credentials" ? "Credenciales inválidas" : "No se pudo ingresar";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
