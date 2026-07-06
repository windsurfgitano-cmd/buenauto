import "server-only";

import { escapeLike, query, toIso, toIsoOrUndefined } from "@/lib/server/db";
import type { Listing, ListingCreateInput, ListingUpdateInput } from "@/lib/types";

type ListingSearch = {
  q?: string;
  brand?: string;
  model?: string;
  region?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "year_desc" | "km_asc" | "km_desc";
};

const PUBLISH_DURATION_DAYS = 30;

const MIN_LISTING_YEAR = 2000;
const MAX_LISTING_YEAR = 2025;

const LISTING_COLUMNS = `
  id, owner_id, status, brand, model, year, price, km, region, city,
  transmission, fuel, description, images, contact_name, contact_phone,
  created_at, published_at, expires_at, payment_id, invoice_email, invoice_rut
`;

/** Condición SQL equivalente a isListingPublic(). */
const PUBLIC_WHERE = `status = 'published' AND (expires_at IS NULL OR expires_at > now())`;

type ListingRow = {
  id: string;
  owner_id: string | null;
  status: string | null;
  brand: string;
  model: string;
  year: number;
  price: number;
  km: number;
  region: string;
  city: string;
  transmission: string;
  fuel: string;
  description: string;
  images: unknown;
  contact_name: string;
  contact_phone: string;
  created_at: unknown;
  published_at: unknown;
  expires_at: unknown;
  payment_id: string | null;
  invoice_email: string | null;
  invoice_rut: string | null;
};

function rowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    ownerId: row.owner_id ?? undefined,
    status: (row.status ?? "published") as Listing["status"],
    brand: row.brand,
    model: row.model,
    year: Number(row.year),
    price: Number(row.price),
    km: Number(row.km),
    region: row.region,
    city: row.city,
    transmission: row.transmission,
    fuel: row.fuel,
    description: row.description,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    createdAt: toIso(row.created_at),
    publishedAt: toIsoOrUndefined(row.published_at),
    expiresAt: toIsoOrUndefined(row.expires_at),
    paymentId: row.payment_id ?? undefined,
    invoiceEmail: row.invoice_email ?? undefined,
    invoiceRUT: row.invoice_rut ?? undefined,
  };
}

export function isListingPublic(listing: Listing, nowMs: number = Date.now()) {
  const status = listing.status ?? "published";
  if (status !== "published") return false;

  if (listing.expiresAt) {
    const expiresMs = new Date(listing.expiresAt).getTime();
    if (Number.isFinite(expiresMs) && expiresMs <= nowMs) {
      return false;
    }
  }

  return true;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function toNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeBrand(brand: string) {
  return brand.trim().toUpperCase();
}

function normalizeText(value: string) {
  return value.trim();
}

function sortToOrderBy(sort: ListingSearch["sort"]) {
  switch (sort) {
    case "price_asc":
      return "price ASC";
    case "price_desc":
      return "price DESC";
    case "year_desc":
      return "year DESC";
    case "km_asc":
      return "km ASC";
    case "km_desc":
      return "km DESC";
    default:
      return "created_at DESC";
  }
}

function buildSearchWhere(search: ListingSearch) {
  const conditions: string[] = [PUBLIC_WHERE];
  const params: unknown[] = [];

  const q = (search.q ?? "").trim();
  const brand = (search.brand ?? "").trim();
  const model = (search.model ?? "").trim();
  const region = (search.region ?? "").trim();

  if (q) {
    params.push(`%${escapeLike(q)}%`);
    conditions.push(
      `(brand || ' ' || model || ' ' || year::text || ' ' || region || ' ' || city) ILIKE $${params.length}`,
    );
  }

  if (brand) {
    params.push(brand.toUpperCase());
    conditions.push(`upper(brand) = $${params.length}`);
  }

  if (model) {
    params.push(`%${escapeLike(model)}%`);
    conditions.push(`model ILIKE $${params.length}`);
  }

  if (region) {
    params.push(region.toLowerCase());
    conditions.push(`lower(region) = $${params.length}`);
  }

  if (typeof search.minYear === "number") {
    params.push(search.minYear);
    conditions.push(`year >= $${params.length}`);
  }

  if (typeof search.maxYear === "number") {
    params.push(search.maxYear);
    conditions.push(`year <= $${params.length}`);
  }

  if (typeof search.minPrice === "number") {
    params.push(search.minPrice);
    conditions.push(`price >= $${params.length}`);
  }

  if (typeof search.maxPrice === "number") {
    params.push(search.maxPrice);
    conditions.push(`price <= $${params.length}`);
  }

  return { where: conditions.join(" AND "), params };
}

export async function getListings() {
  const rows = await query<ListingRow>(
    `SELECT ${LISTING_COLUMNS} FROM listings WHERE ${PUBLIC_WHERE} ORDER BY created_at DESC`,
  );
  return rows.map(rowToListing);
}

export async function getListingById(id: string) {
  const rows = await query<ListingRow>(
    `SELECT ${LISTING_COLUMNS} FROM listings WHERE id = $1`,
    [id],
  );
  return rows.length > 0 ? rowToListing(rows[0]) : null;
}

export async function getListingByIdForOwner(id: string, ownerId: string) {
  const listing = await getListingById(id);
  if (!listing || listing.ownerId !== ownerId) return null;
  return listing;
}

async function getNextListingId() {
  const rows = await query<{ max_num: number | null }>(
    `SELECT max((substring(id from 'ls_(\\d+)'))::int) AS max_num
     FROM listings WHERE id ~ '^ls_\\d+$'`,
  );
  const next = (rows[0]?.max_num ?? 0) + 1;
  return `ls_${String(next).padStart(4, "0")}`;
}

export async function createListing(
  input: ListingCreateInput,
  options?: {
    ownerId?: string;
  },
) {
  const year = toNumber(input.year);
  const price = toNumber(input.price);
  const km = toNumber(input.km);

  if (
    !input.brand ||
    !input.model ||
    !input.region ||
    year === undefined ||
    price === undefined ||
    km === undefined
  ) {
    throw new Error("Missing required fields");
  }

  if (
    !Number.isInteger(year) ||
    year < MIN_LISTING_YEAR ||
    year > MAX_LISTING_YEAR
  ) {
    throw new Error("Invalid year");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid price");
  }

  if (!Number.isFinite(km) || km < 0) {
    throw new Error("Invalid mileage");
  }

  const images =
    input.images && input.images.length > 0 ? input.images : ["/car-placeholder.svg"];

  // Reintento por si dos creaciones concurrentes calculan el mismo id.
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = await getNextListingId();

    const rows = await query<ListingRow>(
      `INSERT INTO listings (
        id, owner_id, status, brand, model, year, price, km, region, city,
        transmission, fuel, description, images, contact_name, contact_phone,
        created_at, invoice_email, invoice_rut
      ) VALUES ($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),$16,$17)
      ON CONFLICT (id) DO NOTHING
      RETURNING ${LISTING_COLUMNS}`,
      [
        id,
        options?.ownerId ?? null,
        normalizeBrand(input.brand),
        normalizeText(input.model),
        year,
        price,
        km,
        normalizeText(input.region),
        normalizeText(input.city ?? ""),
        normalizeText(input.transmission ?? "No especificado"),
        normalizeText(input.fuel ?? "No especificado"),
        normalizeText(input.description ?? ""),
        JSON.stringify(images),
        normalizeText(input.contactName ?? "") || "Vendedor",
        normalizeText(input.contactPhone ?? ""),
        input.invoiceEmail ? normalizeText(input.invoiceEmail) : null,
        input.invoiceRUT ? normalizeText(input.invoiceRUT) : null,
      ],
    );

    if (rows.length > 0) {
      return rowToListing(rows[0]);
    }
  }

  throw new Error("Could not allocate listing id");
}

export async function getListingsByOwner(ownerId: string) {
  const rows = await query<ListingRow>(
    `SELECT ${LISTING_COLUMNS} FROM listings WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId],
  );
  return rows.map(rowToListing);
}

/** Usado al eliminar una cuenta: borra todos los avisos de ese dueño. */
export async function deleteListingsByOwner(ownerId: string) {
  await query(`DELETE FROM listings WHERE owner_id = $1`, [ownerId]);
}

async function getOwnedListingOrThrow(id: string, ownerId: string) {
  const current = await getListingById(id);

  if (!current) {
    throw new Error("Not found");
  }

  if (!current.ownerId || current.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }

  return current;
}

export async function updateListing(id: string, ownerId: string, input: ListingUpdateInput) {
  const current = await getOwnedListingOrThrow(id, ownerId);

  const nextBrand =
    input.brand !== undefined ? normalizeBrand(String(input.brand)) : current.brand;
  const nextModel =
    input.model !== undefined ? normalizeText(String(input.model)) : current.model;
  const nextRegion =
    input.region !== undefined ? normalizeText(String(input.region)) : current.region;

  const nextYearRaw = input.year !== undefined ? toNumber(input.year) : current.year;
  const nextPriceRaw = input.price !== undefined ? toNumber(input.price) : current.price;
  const nextKmRaw = input.km !== undefined ? toNumber(input.km) : current.km;

  if (!nextBrand || !nextModel || !nextRegion) {
    throw new Error("Missing required fields");
  }

  if (
    nextYearRaw === undefined ||
    !Number.isInteger(nextYearRaw) ||
    nextYearRaw < MIN_LISTING_YEAR ||
    nextYearRaw > MAX_LISTING_YEAR
  ) {
    throw new Error("Invalid year");
  }

  if (nextPriceRaw === undefined || !Number.isFinite(nextPriceRaw) || nextPriceRaw <= 0) {
    throw new Error("Invalid price");
  }

  if (nextKmRaw === undefined || !Number.isFinite(nextKmRaw) || nextKmRaw < 0) {
    throw new Error("Invalid mileage");
  }

  const nextImages =
    input.images !== undefined && Array.isArray(input.images)
      ? input.images.length > 0
        ? input.images
        : ["/car-placeholder.svg"]
      : current.images;

  const rows = await query<ListingRow>(
    `UPDATE listings SET
      brand = $2, model = $3, year = $4, price = $5, km = $6, region = $7,
      city = $8, transmission = $9, fuel = $10, description = $11, images = $12,
      contact_name = $13, contact_phone = $14, status = $15, payment_id = $16,
      published_at = $17, expires_at = $18, invoice_email = $19, invoice_rut = $20
    WHERE id = $1
    RETURNING ${LISTING_COLUMNS}`,
    [
      id,
      nextBrand,
      nextModel,
      nextYearRaw,
      nextPriceRaw,
      nextKmRaw,
      nextRegion,
      input.city !== undefined ? normalizeText(String(input.city)) : current.city,
      input.transmission !== undefined
        ? normalizeText(String(input.transmission))
        : current.transmission,
      input.fuel !== undefined ? normalizeText(String(input.fuel)) : current.fuel,
      input.description !== undefined
        ? normalizeText(String(input.description))
        : current.description,
      JSON.stringify(nextImages),
      input.contactName !== undefined
        ? normalizeText(String(input.contactName)) || "Vendedor"
        : current.contactName,
      input.contactPhone !== undefined
        ? normalizeText(String(input.contactPhone))
        : current.contactPhone,
      input.status ?? current.status ?? "published",
      input.paymentId ?? current.paymentId ?? null,
      input.publishedAt ?? current.publishedAt ?? null,
      input.expiresAt ?? current.expiresAt ?? null,
      input.invoiceEmail ?? current.invoiceEmail ?? null,
      input.invoiceRUT ?? current.invoiceRUT ?? null,
    ],
  );

  return rowToListing(rows[0]);
}

export async function markListingPendingPayment(
  id: string,
  ownerId: string,
  input: Pick<ListingUpdateInput, "invoiceEmail" | "invoiceRUT"> & { paymentId: string },
) {
  const current = await getOwnedListingOrThrow(id, ownerId);

  const rows = await query<ListingRow>(
    `UPDATE listings SET
      status = 'pending_payment', payment_id = $2, invoice_email = $3, invoice_rut = $4
    WHERE id = $1
    RETURNING ${LISTING_COLUMNS}`,
    [
      id,
      input.paymentId,
      input.invoiceEmail ?? current.invoiceEmail ?? null,
      input.invoiceRUT ?? current.invoiceRUT ?? null,
    ],
  );

  return rowToListing(rows[0]);
}

export async function publishListing(
  id: string,
  ownerId: string,
  input?: { paymentId?: string },
) {
  const current = await getOwnedListingOrThrow(id, ownerId);

  const now = new Date();
  const rows = await query<ListingRow>(
    `UPDATE listings SET
      status = 'published', payment_id = $2, published_at = $3, expires_at = $4
    WHERE id = $1
    RETURNING ${LISTING_COLUMNS}`,
    [
      id,
      input?.paymentId ?? current.paymentId ?? null,
      now.toISOString(),
      addDays(now, PUBLISH_DURATION_DAYS).toISOString(),
    ],
  );

  return rowToListing(rows[0]);
}

export async function deleteListing(id: string, ownerId: string) {
  await getOwnedListingOrThrow(id, ownerId);
  await query(`DELETE FROM listings WHERE id = $1`, [id]);
}

type ListingSearchResult = {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function searchListings(
  search: ListingSearch & { page?: number; pageSize?: number },
): Promise<ListingSearchResult> {
  const rawPage = typeof search.page === "number" ? search.page : 1;
  const rawPageSize = typeof search.pageSize === "number" ? search.pageSize : 24;

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSizeUnclamped =
    Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.floor(rawPageSize) : 24;
  const pageSize = Math.min(100, pageSizeUnclamped);

  const { where, params } = buildSearchWhere(search);

  const countRows = await query<{ total: number }>(
    `SELECT count(*)::int AS total FROM listings WHERE ${where}`,
    params,
  );
  const total = countRows[0]?.total ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await query<ListingRow>(
    `SELECT ${LISTING_COLUMNS} FROM listings
     WHERE ${where}
     ORDER BY ${sortToOrderBy(search.sort)}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset],
  );

  return {
    items: rows.map(rowToListing),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export type { ListingSearch, ListingSearchResult };
