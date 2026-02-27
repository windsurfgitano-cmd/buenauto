import { NextResponse } from "next/server";

import {
  createSessionForUser,
  getSessionTtlSeconds,
  registerUser,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  name?: unknown;
};

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as RegisterBody;

  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name : undefined;

  try {
    const user = await registerUser({ email, password, name });
    const session = await createSessionForUser(user.id);

    const res = NextResponse.json({ user }, { status: 201 });
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
    const raw = err instanceof Error ? err.message : "Unable to register";
    const message =
      raw === "Invalid email"
        ? "Email inválido"
        : raw === "Invalid password"
          ? "La contraseña debe tener al menos 6 caracteres"
          : raw === "Email already exists"
            ? "Ya existe una cuenta con ese email"
            : "No se pudo crear la cuenta";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
