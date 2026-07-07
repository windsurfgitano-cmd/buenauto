import { NextResponse } from "next/server";

import type { ListingUpdateInput } from "@/lib/types";
import {
  deleteListing,
  getListingById,
  updateListing,
} from "@/lib/server/listings-store";
import { resolveBrandModel } from "@/lib/server/catalog";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const input = body as ListingUpdateInput;

  // Si viene marca/modelo, resolverlos contra el catálogo antes de guardar.
  if (input.brand !== undefined || input.model !== undefined) {
    const resolved = await resolveBrandModel(
      String(input.brand ?? ""),
      String(input.model ?? ""),
    );
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    input.brand = resolved.brand;
    input.model = resolved.model;
    input.needsReview = resolved.needsReview;
  }

  try {
    const listing = await updateListing(id, user.id, input);
    return NextResponse.json({ listing });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to update listing";
    const message =
      raw === "Not found"
        ? "No encontrado"
        : raw === "Forbidden"
          ? "No autorizado"
          : raw === "Missing required fields"
            ? "Faltan campos obligatorios"
            : raw === "Invalid year"
              ? "Ingresa un año válido"
              : raw === "Invalid price"
                ? "Ingresa un precio válido"
                : raw === "Invalid mileage"
                  ? "Ingresa un kilometraje válido"
                  : raw;

    const status = raw === "Not found" ? 404 : raw === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión" },
      { status: 401 },
    );
  }

  try {
    await deleteListing(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to delete listing";
    const message =
      raw === "Not found" ? "No encontrado" : raw === "Forbidden" ? "No autorizado" : raw;

    const status = raw === "Not found" ? 404 : raw === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
