import "server-only";

import { promises as fs } from "fs";
import path from "path";

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

function getListingsFilePath() {
  return path.join(process.cwd(), "data", "listings.json");
}

let cachedListings: Listing[] | null = null;
let cachedListingsMtimeMs: number | null = null;

const PUBLISH_DURATION_DAYS = 30;

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

async function saveListings(items: Listing[]) {
  const filePath = getListingsFilePath();
  await fs.writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8");

  try {
    const stat = await fs.stat(filePath);
    cachedListings = items;
    cachedListingsMtimeMs = stat.mtimeMs;
  } catch {
    cachedListings = items;
    cachedListingsMtimeMs = null;
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function loadListingsRaw() {
  const filePath = getListingsFilePath();

  try {
    const stat = await fs.stat(filePath);
    const mtimeMs = stat.mtimeMs;

    if (cachedListings !== null && cachedListingsMtimeMs === mtimeMs) {
      return cachedListings;
    }

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      cachedListings = [];
      cachedListingsMtimeMs = mtimeMs;
      return [];
    }

    const items = parsed as Listing[];
    cachedListings = items;
    cachedListingsMtimeMs = mtimeMs;
    return items;
  } catch {
    cachedListings = [];
    cachedListingsMtimeMs = null;
    return [];
  }
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

const MIN_LISTING_YEAR = 2000;
const MAX_LISTING_YEAR = 2025;

function getNextListingId(existing: Listing[]) {
  let max = 0;

  for (const item of existing) {
    const match = /^ls_(\d+)$/.exec(item.id);
    if (!match) continue;

    const num = Number(match[1]);
    if (!Number.isFinite(num)) continue;

    max = Math.max(max, num);
  }

  const next = max + 1;
  return `ls_${String(next).padStart(4, "0")}`;
}

export function applyListingSearch(listings: Listing[], search: ListingSearch) {
  const q = (search.q ?? "").trim().toLowerCase();
  const brand = (search.brand ?? "").trim().toUpperCase();
  const model = (search.model ?? "").trim().toLowerCase();
  const region = (search.region ?? "").trim().toLowerCase();

  let items = listings.filter((l) => {
    if (q) {
      const hay = `${l.brand} ${l.model} ${l.year} ${l.region} ${l.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (brand && l.brand.toUpperCase() !== brand) return false;
    if (model && !l.model.toLowerCase().includes(model)) return false;
    if (region && l.region.toLowerCase() !== region) return false;

    if (typeof search.minYear === "number" && l.year < search.minYear) return false;
    if (typeof search.maxYear === "number" && l.year > search.maxYear) return false;

    if (typeof search.minPrice === "number" && l.price < search.minPrice) return false;
    if (typeof search.maxPrice === "number" && l.price > search.maxPrice) return false;

    return true;
  });

  const sort = search.sort ?? "newest";

  items = [...items].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "year_desc") return b.year - a.year;
    if (sort === "km_asc") return a.km - b.km;
    if (sort === "km_desc") return b.km - a.km;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return items;
}

export async function getListings() {
  const items = await loadListingsRaw();
  const visible = items.filter((l) => isListingPublic(l));
  return applyListingSearch(visible, { sort: "newest" });
}

export async function getListingById(id: string) {
  const items = await loadListingsRaw();
  return items.find((l) => l.id === id) ?? null;
}

export async function getListingByIdForOwner(id: string, ownerId: string) {
  const items = await loadListingsRaw();
  const listing = items.find((l) => l.id === id);
  if (!listing || listing.ownerId !== ownerId) return null;
  return listing;
}

export async function createListing(
  input: ListingCreateInput,
  options?: {
    ownerId?: string;
  },
) {
  // Usar la lista cruda: con la lista filtrada se reusarían IDs de avisos
  // no públicos y saveListings borraría borradores y avisos pendientes.
  const existing = await loadListingsRaw();
  const id = getNextListingId(existing);

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

  const listing: Listing = {
    id,
    ownerId: options?.ownerId,
    status: "draft",
    brand: normalizeBrand(input.brand),
    model: normalizeText(input.model),
    year,
    price,
    km,
    region: normalizeText(input.region),
    city: normalizeText(input.city ?? ""),
    transmission: normalizeText(input.transmission ?? "No especificado"),
    fuel: normalizeText(input.fuel ?? "No especificado"),
    description: normalizeText(input.description ?? ""),
    images: input.images && input.images.length > 0 ? input.images : ["/car-placeholder.svg"],
    contactName: normalizeText(input.contactName ?? "") || "Vendedor",
    contactPhone: normalizeText(input.contactPhone ?? ""),
    createdAt: new Date().toISOString(),
    paymentId: undefined,
    publishedAt: undefined,
    expiresAt: undefined,
    invoiceEmail: input.invoiceEmail ? normalizeText(input.invoiceEmail) : undefined,
    invoiceRUT: input.invoiceRUT ? normalizeText(input.invoiceRUT) : undefined,
  };

  const next = [listing, ...existing];
  await saveListings(next);

  return listing;
}

export async function getListingsByOwner(ownerId: string) {
  const items = await loadListingsRaw();
  return items.filter((l) => l.ownerId === ownerId);
}

export async function updateListing(id: string, ownerId: string, input: ListingUpdateInput) {
  const existing = await loadListingsRaw();
  const idx = existing.findIndex((l) => l.id === id);

  if (idx === -1) {
    throw new Error("Not found");
  }

  const current = existing[idx];

  if (!current.ownerId || current.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }

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

  const nextListing: Listing = {
    ...current,
    brand: nextBrand,
    model: nextModel,
    year: nextYearRaw,
    price: nextPriceRaw,
    km: nextKmRaw,
    region: nextRegion,
    city: input.city !== undefined ? normalizeText(String(input.city)) : current.city,
    transmission:
      input.transmission !== undefined
        ? normalizeText(String(input.transmission))
        : current.transmission,
    fuel: input.fuel !== undefined ? normalizeText(String(input.fuel)) : current.fuel,
    description:
      input.description !== undefined
        ? normalizeText(String(input.description))
        : current.description,
    images:
      input.images !== undefined && Array.isArray(input.images)
        ? input.images.length > 0
          ? input.images
          : ["/car-placeholder.svg"]
        : current.images,
    contactName:
      input.contactName !== undefined
        ? normalizeText(String(input.contactName)) || "Vendedor"
        : current.contactName,
    contactPhone:
      input.contactPhone !== undefined
        ? normalizeText(String(input.contactPhone))
        : current.contactPhone,
    status: input.status ?? current.status ?? "published",
    paymentId: input.paymentId ?? current.paymentId,
    publishedAt: input.publishedAt ?? current.publishedAt,
    expiresAt: input.expiresAt ?? current.expiresAt,
    invoiceEmail: input.invoiceEmail ?? current.invoiceEmail,
    invoiceRUT: input.invoiceRUT ?? current.invoiceRUT,
  };

  const next = [...existing];
  next[idx] = nextListing;
  await saveListings(next);

  return nextListing;
}

export async function markListingPendingPayment(
  id: string,
  ownerId: string,
  input: Pick<ListingUpdateInput, "invoiceEmail" | "invoiceRUT"> & { paymentId: string },
) {
  const existing = await loadListingsRaw();
  const idx = existing.findIndex((l) => l.id === id);

  if (idx === -1) {
    throw new Error("Not found");
  }

  const current = existing[idx];

  if (!current.ownerId || current.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }

  const next: Listing = {
    ...current,
    status: "pending_payment",
    paymentId: input.paymentId,
    invoiceEmail: input.invoiceEmail ?? current.invoiceEmail,
    invoiceRUT: input.invoiceRUT ?? current.invoiceRUT,
  };

  const all = [...existing];
  all[idx] = next;
  await saveListings(all);
  return next;
}

export async function publishListing(
  id: string,
  ownerId: string,
  input?: { paymentId?: string },
) {
  const existing = await loadListingsRaw();
  const idx = existing.findIndex((l) => l.id === id);

  if (idx === -1) {
    throw new Error("Not found");
  }

  const current = existing[idx];

  if (!current.ownerId || current.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }

  const now = new Date();
  const next: Listing = {
    ...current,
    status: "published",
    paymentId: input?.paymentId ?? current.paymentId,
    publishedAt: now.toISOString(),
    expiresAt: addDays(now, PUBLISH_DURATION_DAYS).toISOString(),
  };

  const all = [...existing];
  all[idx] = next;
  await saveListings(all);
  return next;
}

export async function deleteListing(id: string, ownerId: string) {
  const existing = await loadListingsRaw();
  const listing = existing.find((l) => l.id === id);

  if (!listing) {
    throw new Error("Not found");
  }

  if (!listing.ownerId || listing.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }

  const next = existing.filter((l) => l.id !== id);
  await saveListings(next);
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

  const items = await loadListingsRaw();
  const publicItems = items.filter((l) => isListingPublic(l));
  const all = applyListingSearch(publicItems, search);

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: all.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export type { ListingSearch, ListingSearchResult };
