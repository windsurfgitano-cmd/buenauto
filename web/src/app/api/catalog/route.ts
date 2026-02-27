import { NextResponse } from "next/server";

import {
  getCatalogBrands,
  getCatalogModelsByBrand,
} from "@/lib/server/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const brand = (url.searchParams.get("brand") ?? "").trim();

  if (brand) {
    const models = await getCatalogModelsByBrand(brand);
    return NextResponse.json({ brand: brand.toUpperCase(), models });
  }

  const brands = await getCatalogBrands();
  return NextResponse.json({ brands });
}
