import { NextResponse } from "next/server";

import {
  addCustomCatalogModels,
  deleteCustomCatalogModel,
  getCustomCatalog,
} from "@/lib/server/catalog";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCatalogAdmin(email: string) {
  const raw = process.env.CATALOG_ADMIN_EMAILS;
  if (!raw) return process.env.NODE_ENV !== "production";

  const normalized = email.trim().toLowerCase();
  const allowed = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return process.env.NODE_ENV !== "production";
  return allowed.includes(normalized);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 }),
    };
  }

  if (!isCatalogAdmin(user.email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const catalog = await getCustomCatalog();
  return NextResponse.json({ catalog });
}

type UpsertBody = {
  brand?: unknown;
  model?: unknown;
  models?: unknown;
};

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as UpsertBody;
  const brand = typeof input.brand === "string" ? input.brand : "";

  let models: string[] = [];

  if (typeof input.model === "string") {
    models = [input.model];
  } else if (Array.isArray(input.models)) {
    models = input.models.filter((m): m is string => typeof m === "string");
  } else if (typeof input.models === "string") {
    models = input.models.split(/[\n,]+/);
  }

  const cleanedModels = models.map((m) => m.trim()).filter(Boolean);

  if (!brand.trim() || cleanedModels.length === 0) {
    return NextResponse.json(
      { error: "Faltan datos" },
      {
        status: 400,
      },
    );
  }

  try {
    const catalog = await addCustomCatalogModels({ brand, models: cleanedModels });
    return NextResponse.json({ catalog });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to update";
    const message = raw === "Invalid brand" ? "Marca inválida" : "No se pudo guardar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

type DeleteBody = {
  brand?: unknown;
  model?: unknown;
};

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as DeleteBody;
  const brand = typeof input.brand === "string" ? input.brand : "";
  const model = typeof input.model === "string" ? input.model : undefined;

  if (!brand.trim()) {
    return NextResponse.json({ error: "Falta marca" }, { status: 400 });
  }

  try {
    const catalog = await deleteCustomCatalogModel({ brand, model });
    return NextResponse.json({ catalog });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to update";
    const message =
      raw === "Invalid brand"
        ? "Marca inválida"
        : raw === "Invalid model"
          ? "Modelo inválido"
          : "No se pudo guardar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
