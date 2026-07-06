import { NextResponse } from "next/server";

import {
  deleteSession,
  deleteUser,
  SESSION_COOKIE_NAME,
  updateUserName,
  updateUserPassword,
} from "@/lib/server/auth";
import { deleteListingsByOwner } from "@/lib/server/listings-store";
import { getCurrentUser, getSessionId } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateBody = {
  name?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
};

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as UpdateBody;

  const name = typeof input.name === "string" ? input.name : undefined;
  const currentPassword =
    typeof input.currentPassword === "string" ? input.currentPassword : undefined;
  const newPassword =
    typeof input.newPassword === "string" ? input.newPassword : undefined;

  if (name === undefined && currentPassword === undefined && newPassword === undefined) {
    return NextResponse.json(
      { error: "No hay cambios" },
      { status: 400 },
    );
  }

  try {
    let nextUser = user;

    if (name !== undefined) {
      nextUser = await updateUserName(user.id, name);
    }

    if (currentPassword !== undefined || newPassword !== undefined) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Completa la contraseña actual y la nueva" },
          { status: 400 },
        );
      }

      nextUser = await updateUserPassword(user.id, currentPassword, newPassword);
    }

    return NextResponse.json({ user: nextUser });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to update";
    const message =
      raw === "Invalid credentials"
        ? "La contraseña actual no coincide"
        : raw === "Invalid password"
          ? "La nueva contraseña debe tener al menos 6 caracteres"
          : raw === "Missing user"
            ? "Usuario inválido"
            : "No se pudo actualizar";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

type DeleteBody = {
  currentPassword?: unknown;
};

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as DeleteBody;
  const currentPassword =
    typeof input.currentPassword === "string" ? input.currentPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Ingresa tu contraseña para confirmar" },
      { status: 400 },
    );
  }

  try {
    await deleteUser(user.id, currentPassword);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to delete";
    const message =
      raw === "Invalid credentials" ? "La contraseña no coincide" : "No se pudo eliminar la cuenta";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await deleteListingsByOwner(user.id);

  const sessionId = await getSessionId();
  if (sessionId) await deleteSession(sessionId);

  const res = NextResponse.json({ ok: true });
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
