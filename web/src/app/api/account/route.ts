import { NextResponse } from "next/server";

import { updateUserName, updateUserPassword } from "@/lib/server/auth";
import { getCurrentUser } from "@/lib/server/session";

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
