import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { query } from "@/lib/server/db";

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

type CustomCatalog = {
  brands: Record<string, string[]>;
};

// El CSV es estático: se cachea en memoria por instancia.
let cachedRows: CatalogRow[] | null = null;

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

async function loadCustomCatalog(): Promise<CustomCatalog> {
  const rows = await query<{ brand: string; model: string }>(
    `SELECT brand, model FROM catalog_custom ORDER BY brand, model`,
  );

  const brands: Record<string, string[]> = {};
  for (const row of rows) {
    const Brand = normalizeBrand(row.brand);
    if (!Brand) continue;
    if (!brands[Brand]) brands[Brand] = [];
    brands[Brand].push(row.model);
  }

  for (const models of Object.values(brands)) {
    models.sort((a, b) => a.localeCompare(b, "es"));
  }

  return { brands: sortBrandsRecord(brands) };
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

  for (const model of nextModels) {
    await query(
      `INSERT INTO catalog_custom (brand, model) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [Brand, model],
    );
  }

  return loadCustomCatalog();
}

export async function deleteCustomCatalogModel(input: { brand: string; model?: string }) {
  const Brand = normalizeBrand(input.brand);
  if (!Brand) {
    throw new Error("Invalid brand");
  }

  if (!input.model) {
    await query(`DELETE FROM catalog_custom WHERE brand = $1`, [Brand]);
  } else {
    const target = normalizeModel(input.model);
    if (!target) {
      throw new Error("Invalid model");
    }

    await query(
      `DELETE FROM catalog_custom WHERE brand = $1 AND lower(model) = lower($2)`,
      [Brand, target],
    );
  }

  return loadCustomCatalog();
}

/** Pares marca/modelo de avisos creados por usuarios (con dueño). */
async function loadListingPairs() {
  const rows = await query<{ brand: string; model: string }>(
    `SELECT DISTINCT brand, model FROM listings
     WHERE owner_id IS NOT NULL AND owner_id <> ''`,
  );

  const pairs: Array<{ Brand: string; Model: string }> = [];
  for (const row of rows) {
    const Brand = normalizeBrand(row.brand);
    const Model = normalizeModel(row.model);
    if (!Brand || !Model) continue;
    pairs.push({ Brand, Model });
  }

  return pairs;
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
    cachedRows = [];
    return [];
  }

  const raw = await fs.readFile(filePath, "utf8");
  const cleanedRaw = raw.replace(/^﻿/, "");
  const lines = cleanedRaw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  if (header[0]) header[0] = header[0].replace(/^﻿/, "");
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
  const [rows, listingPairs, customCatalog] = await Promise.all([
    loadRows(),
    loadListingPairs(),
    loadCustomCatalog(),
  ]);

  const set = new Set<string>();

  for (const r of rows) set.add(r.Brand);
  for (const pair of listingPairs) set.add(pair.Brand);
  for (const Brand of Object.keys(customCatalog.brands)) set.add(Brand);

  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export async function getCatalogModelsByBrand(brand: string) {
  const normalized = normalizeBrand(brand);

  const [rows, listingPairs, customCatalog] = await Promise.all([
    loadRows(),
    loadListingPairs(),
    loadCustomCatalog(),
  ]);

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

  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Valida y canoniza marca/modelo contra el catálogo.
 * - La marca DEBE existir en el catálogo (los selects del formulario ya la
 *   limitan; esto es la defensa del servidor).
 * - Si el modelo coincide con uno del catálogo (sin importar mayúsculas), se
 *   guarda con la grafía canónica y needsReview = false.
 * - Si no coincide (opción "Otro"), se acepta pero se marca needsReview = true
 *   para que un admin lo revise; así las métricas quedan limpias.
 */
export async function resolveBrandModel(
  rawBrand: string,
  rawModel: string,
): Promise<
  | { ok: true; brand: string; model: string; needsReview: boolean }
  | { ok: false; error: string }
> {
  const brand = normalizeBrand(rawBrand ?? "");
  const model = normalizeModel(rawModel ?? "");

  if (!brand) return { ok: false, error: "Falta la marca" };
  if (!model) return { ok: false, error: "Falta el modelo" };

  const brands = await getCatalogBrands();
  if (!brands.includes(brand)) {
    return { ok: false, error: "Marca no válida" };
  }

  const models = await getCatalogModelsByBrand(brand);
  const canonical = models.find((m) => m.toLowerCase() === model.toLowerCase());

  if (canonical) {
    return { ok: true, brand, model: canonical, needsReview: false };
  }

  return { ok: true, brand, model, needsReview: true };
}

export type { CatalogRow };
