import { NextResponse } from "next/server";

import type { ListingCreateInput } from "@/lib/types";
import { createListing, searchListings } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNumber(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const page = toNumber(sp.get("page")) ?? 1;
  const pageSize = toNumber(sp.get("pageSize")) ?? 24;

  const result = await searchListings({
    q: sp.get("q") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    model: sp.get("model") ?? undefined,
    region: sp.get("region") ?? undefined,
    minYear: toNumber(sp.get("minYear")),
    maxYear: toNumber(sp.get("maxYear")),
    minPrice: toNumber(sp.get("minPrice")),
    maxPrice: toNumber(sp.get("maxPrice")),
    sort:
      (sp.get("sort") as
        | "newest"
        | "price_asc"
        | "price_desc"
        | "year_desc"
        | "km_asc"
        | "km_desc"
        | null) ?? undefined,
    page,
    pageSize,
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para publicar" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = body as ListingCreateInput;

  try {
    const listing = await createListing(input, { ownerId: user.id });
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unable to create listing";
    const message =
      raw === "Missing required fields"
        ? "Faltan campos obligatorios"
        : raw === "Invalid year"
          ? "Ingresa un año válido"
          : raw === "Invalid price"
            ? "Ingresa un precio válido"
            : raw === "Invalid mileage"
              ? "Ingresa un kilometraje válido"
              : raw === "Unable to create listing"
                ? "No se pudo crear el aviso"
                : raw;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
