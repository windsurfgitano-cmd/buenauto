import "server-only";

import { promises as fs } from "fs";
import path from "path";

type CatalogRow = {
  Brand: string;
  Model: string;
  Country?: string;
  Founded?: string;
  Chile_Entry?: string;
  Segment?: string;
  Years?: string;
  Vehicle_Type?: string;
  Popular?: string;
};

const CATALOG_FILENAME = "catalogo_autos_chile_2000_2025.csv";
const LISTINGS_FILENAME = "listings.json";
const CUSTOM_CATALOG_FILENAME = "catalog_custom.json";

type CustomCatalog = {
  brands: Record<string, string[]>;
};

let cachedRows: CatalogRow[] | null = null;
let cachedBrands: string[] | null = null;
let cachedBrandsListingsMtimeMs: number | null = null;
let cachedBrandsCustomMtimeMs: number | null = null;
const cachedModelsByBrand = new Map<string, string[]>();
let cachedModelsListingsMtimeMs: number | null = null;
let cachedModelsCustomMtimeMs: number | null = null;

let cachedListingPairs: Array<{ Brand: string; Model: string }> | null = null;
let cachedListingsMtimeMs: number | null = null;

let cachedCustomCatalog: CustomCatalog | null = null;
let cachedCustomCatalogMtimeMs: number | null = null;

function normalizeBrand(brand: string) {
  return brand.trim().toUpperCase();
}

function normalizeModel(model: string) {
  return model.trim();
}

function sortBrandsRecord(input: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(input).sort(([a], [b]) => a.localeCompare(b, "es")),
  ) as Record<string, string[]>;
}

function sanitizeCustomCatalog(value: unknown): CustomCatalog {
  const brands: Record<string, string[]> = {};

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { brands };
  }

  const rawBrands = (value as { brands?: unknown }).brands;
  if (!rawBrands || typeof rawBrands !== "object" || Array.isArray(rawBrands)) {
    return { brands };
  }

  for (const [brandKey, rawModels] of Object.entries(
    rawBrands as Record<string, unknown>,
  )) {
    const Brand = normalizeBrand(brandKey);
    if (!Brand) continue;

    const models: string[] = [];
    const seen = new Set<string>();

    if (Array.isArray(rawModels)) {
      for (const item of rawModels) {
        if (typeof item !== "string") continue;
        const Model = normalizeModel(item);
        if (!Model) continue;
        const key = Model.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        models.push(Model);
      }
    }

    models.sort((a, b) => a.localeCompare(b, "es"));
    brands[Brand] = models;
  }

  return { brands: sortBrandsRecord(brands) };
}

async function loadCustomCatalog() {
  const filePath = path.join(process.cwd(), "data", CUSTOM_CATALOG_FILENAME);

  try {
    const stat = await fs.stat(filePath);
    const mtimeMs = stat.mtimeMs;

    if (cachedCustomCatalog !== null && cachedCustomCatalogMtimeMs === mtimeMs) {
      return cachedCustomCatalog;
    }

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const catalog = sanitizeCustomCatalog(parsed);
    cachedCustomCatalog = catalog;
    cachedCustomCatalogMtimeMs = mtimeMs;
    return catalog;
  } catch {
    cachedCustomCatalog = { brands: {} };
    cachedCustomCatalogMtimeMs = null;
    return cachedCustomCatalog;
  }
}

async function writeCustomCatalog(catalog: CustomCatalog) {
  const filePath = path.join(process.cwd(), "data", CUSTOM_CATALOG_FILENAME);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  try {
    const stat = await fs.stat(filePath);
    cachedCustomCatalog = catalog;
    cachedCustomCatalogMtimeMs = stat.mtimeMs;
  } catch {
    cachedCustomCatalog = catalog;
    cachedCustomCatalogMtimeMs = null;
  }
}

export async function getCustomCatalog() {
  return loadCustomCatalog();
}

export async function addCustomCatalogModels(input: { brand: string; models: string[] }) {
  const Brand = normalizeBrand(input.brand);
  if (!Brand) {
    throw new Error("Invalid brand");
  }

  const nextModels = input.models
    .filter((m) => typeof m === "string")
    .map(normalizeModel)
    .filter(Boolean);

  const current = await loadCustomCatalog();
  const brands = { ...current.brands };
  const existing = Array.isArray(brands[Brand]) ? [...brands[Brand]] : [];
  const seen = new Set(existing.map((m) => m.toLowerCase()));

  for (const m of nextModels) {
    const key = m.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    existing.push(m);
  }

  existing.sort((a, b) => a.localeCompare(b, "es"));
  brands[Brand] = existing;

  const next: CustomCatalog = { brands: sortBrandsRecord(brands) };
  await writeCustomCatalog(next);
  return next;
}

export async function deleteCustomCatalogModel(input: { brand: string; model?: string }) {
  const Brand = normalizeBrand(input.brand);
  if (!Brand) {
    throw new Error("Invalid brand");
  }

  const current = await loadCustomCatalog();
  const brands = { ...current.brands };

  if (!(Brand in brands)) {
    return current;
  }

  if (!input.model) {
    delete brands[Brand];
  } else {
    const target = normalizeModel(input.model).toLowerCase();
    if (!target) {
      throw new Error("Invalid model");
    }

    const nextModels = (brands[Brand] ?? []).filter(
      (m) => m.toLowerCase() !== target,
    );

    if (nextModels.length === 0) {
      delete brands[Brand];
    } else {
      brands[Brand] = nextModels;
    }
  }

  const next: CustomCatalog = { brands: sortBrandsRecord(brands) };
  await writeCustomCatalog(next);
  return next;
}

async function loadListingPairs() {
  const filePath = path.join(process.cwd(), "data", LISTINGS_FILENAME);

  try {
    const stat = await fs.stat(filePath);
    const mtimeMs = stat.mtimeMs;

    if (cachedListingPairs !== null && cachedListingsMtimeMs === mtimeMs) {
      return cachedListingPairs;
    }

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      cachedListingPairs = [];
      cachedListingsMtimeMs = mtimeMs;
      return [];
    }

    const pairs: Array<{ Brand: string; Model: string }> = [];

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;

      const ownerId = (item as { ownerId?: unknown }).ownerId;
      const brand = (item as { brand?: unknown }).brand;
      const model = (item as { model?: unknown }).model;

      if (typeof ownerId !== "string" || !ownerId.trim()) continue;
      if (typeof brand !== "string" || typeof model !== "string") continue;

      const Brand = normalizeBrand(brand);
      const Model = model.trim();

      if (!Brand || !Model) continue;

      pairs.push({ Brand, Model });
    }

    cachedListingPairs = pairs;
    cachedListingsMtimeMs = mtimeMs;
    return pairs;
  } catch {
    cachedListingPairs = [];
    cachedListingsMtimeMs = null;
    return [];
  }
}

async function resolveCatalogPath(): Promise<string | null> {
  const candidates = [
    path.join(process.cwd(), "data", CATALOG_FILENAME),
    path.join(process.cwd(), "..", CATALOG_FILENAME),
    path.join("/vercel/path0", CATALOG_FILENAME),
  ];

  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

async function loadRows() {
  if (cachedRows !== null) return cachedRows;

  const filePath = await resolveCatalogPath();
  if (!filePath) {
    // No catalog file found, return empty
    cachedRows = [];
    return [];
  }
  
  const raw = await fs.readFile(filePath, "utf8");
  const cleanedRaw = raw.replace(/^\uFEFF/, "");
  const lines = cleanedRaw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  if (header[0]) header[0] = header[0].replace(/^\uFEFF/, "");
  const rows: CatalogRow[] = [];

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};

    for (let i = 0; i < header.length; i++) {
      const key = header[i];
      row[key] = cols[i] ?? "";
    }

    const Brand = row.Brand ?? "";
    const Model = row.Model ?? "";

    if (!Brand || !Model) continue;

    rows.push({
      Brand: normalizeBrand(Brand),
      Model: Model.trim(),
      Country: row.Country,
      Founded: row.Founded,
      Chile_Entry: row.Chile_Entry,
      Segment: row.Segment,
      Years: row.Years,
      Vehicle_Type: row.Vehicle_Type,
      Popular: row.Popular,
    });
  }

  cachedRows = rows;
  return rows;
}

export async function getCatalogBrands() {
  console.log("[CATALOG] getCatalogBrands called");
  
  let listingPairs: Array<{ Brand: string; Model: string }> = [];
  let listingsMtimeMs = 0;
  let customCatalog: CustomCatalog = { brands: {} };
  let customMtimeMs = 0;
  
  try {
    listingPairs = await loadListingPairs();
    listingsMtimeMs = cachedListingsMtimeMs ?? 0;
    customCatalog = await loadCustomCatalog();
    customMtimeMs = cachedCustomCatalogMtimeMs ?? 0;
    console.log("[CATALOG] Loaded listing pairs:", listingPairs.length);
  } catch (err) {
    console.error("[CATALOG] Error loading listings/custom catalog:", err);
  }

  if (
    cachedBrands !== null &&
    cachedBrandsListingsMtimeMs === listingsMtimeMs &&
    cachedBrandsCustomMtimeMs === customMtimeMs
  ) {
    return cachedBrands;
  }

  const rows = await loadRows();
  const set = new Set<string>();

  for (const r of rows) set.add(r.Brand);
  for (const pair of listingPairs) set.add(pair.Brand);
  for (const Brand of Object.keys(customCatalog.brands)) set.add(Brand);

  const brands = [...set].sort((a, b) => a.localeCompare(b, "es"));
  cachedBrands = brands;
  cachedBrandsListingsMtimeMs = listingsMtimeMs;
  cachedBrandsCustomMtimeMs = customMtimeMs;
  return brands;
}

export async function getCatalogModelsByBrand(brand: string) {
  const normalized = normalizeBrand(brand);

  const listingPairs = await loadListingPairs();
  const listingsMtimeMs = cachedListingsMtimeMs ?? 0;
  const customCatalog = await loadCustomCatalog();
  const customMtimeMs = cachedCustomCatalogMtimeMs ?? 0;

  if (
    cachedModelsListingsMtimeMs !== listingsMtimeMs ||
    cachedModelsCustomMtimeMs !== customMtimeMs
  ) {
    cachedModelsByBrand.clear();
    cachedModelsListingsMtimeMs = listingsMtimeMs;
    cachedModelsCustomMtimeMs = customMtimeMs;
  }

  const cached = cachedModelsByBrand.get(normalized);
  if (cached) return cached;

  const rows = await loadRows();
  const set = new Set<string>();

  for (const r of rows) {
    if (r.Brand !== normalized) continue;
    set.add(r.Model);
  }

  for (const pair of listingPairs) {
    if (pair.Brand !== normalized) continue;
    set.add(pair.Model);
  }

  for (const Model of customCatalog.brands[normalized] ?? []) {
    set.add(Model);
  }

  const models = [...set].sort((a, b) => a.localeCompare(b, "es"));
  cachedModelsByBrand.set(normalized, models);
  return models;
}

export type { CatalogRow };
