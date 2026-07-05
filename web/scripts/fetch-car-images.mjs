#!/usr/bin/env node
// @ts-check
/**
 * Descarga una foto real por modelo (Wikipedia es/en) a public/cars/ y
 * actualiza los avisos para usarla como asset local.
 * - Local = sin hotlinking: Wikimedia rate-limitea (429) y restringe
 *   anchos de thumbnail, así que servir remoto en runtime es frágil.
 * - Actualiza la tabla listings (DATABASE_URL) y data/listings.json (seed).
 *
 * Uso: node scripts/fetch-car-images.mjs
 */

import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

const USER_AGENT = "BuenAutoBot/1.0 (marketplace demo; contacto@buenauto.cl)";
const OUT_DIR = path.join(process.cwd(), "public", "cars");

async function loadEnvLocal() {
  if (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) return;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
  } catch {
    // sin .env.local
  }
}

const BRAND_TITLES = {
  BMW: "BMW",
  BYD: "BYD",
  DFSK: "DFSK",
  MG: "MG",
  JAC: "JAC",
  GAC: "GAC",
  SEAT: "SEAT",
  KIA: "Kia",
  SSANGYONG: "SsangYong",
  "CITROËN": "Citroën",
  "MERCEDES-BENZ": "Mercedes-Benz",
  "GREAT WALL": "Great Wall",
  "LAND ROVER": "Land Rover",
  "ALFA ROMEO": "Alfa Romeo",
  RAM: "Ram",
};

function brandTitle(brand) {
  const upper = brand.trim().toUpperCase();
  if (BRAND_TITLES[upper]) return BRAND_TITLES[upper];
  return upper
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function upscaleThumb(url, width) {
  return url.replace(/\/(\d+)px-/, `/${width}px-`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch con reintentos ante 429 (rate limit de Wikimedia). */
async function politeFetch(url, options = {}, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, {
      ...options,
      headers: { "User-Agent": USER_AGENT, ...(options.headers ?? {}) },
    });
    if (res.status !== 429) return res;
    const wait = 4000 * (i + 1);
    console.log(`  429, esperando ${wait / 1000}s...`);
    await sleep(wait);
  }
  return null;
}

async function wikiSummary(lang, title) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const res = await politeFetch(url, { headers: { Accept: "application/json" } });
  if (!res || !res.ok) return null;
  return res.json();
}

async function downloadImage(brand, model) {
  const title = `${brandTitle(brand)} ${model.trim()}`;

  for (const lang of ["es", "en"]) {
    const data = await wikiSummary(lang, title);
    const thumb = data?.thumbnail?.source;
    const original = data?.originalimage;
    if (!thumb && !original?.source) continue;

    // Candidatos de mayor a menor calidad; Wikimedia solo sirve ciertos
    // anchos por archivo, así que probamos hasta que uno funcione.
    const candidates = [];
    if (thumb && original?.width >= 500) candidates.push(upscaleThumb(thumb, 500));
    if (thumb) candidates.push(thumb);
    if (original?.source) candidates.push(original.source);

    for (const url of candidates) {
      const res = await politeFetch(url);
      if (!res || !res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1000) continue;

      const ext = url.toLowerCase().includes(".png") ? "png" : "jpg";
      const filename = `${slugify(`${brand}-${model}`)}.${ext}`;
      await fs.writeFile(path.join(OUT_DIR, filename), buffer);
      return `/cars/${filename}`;
    }
  }

  return null;
}

async function main() {
  await loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
  if (!dbUrl) {
    console.error("Falta DATABASE_URL");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const sql = neon(dbUrl);

  const pairs = await sql.query(
    `SELECT DISTINCT brand, model FROM listings ORDER BY brand, model`,
  );
  console.log(`Modelos distintos: ${pairs.length}`);

  const imageByPair = new Map();
  let found = 0;

  for (const { brand, model } of pairs) {
    const existing = `${slugify(`${brand}-${model}`)}`;
    const existingJpg = path.join(OUT_DIR, `${existing}.jpg`);
    const existingPng = path.join(OUT_DIR, `${existing}.png`);

    let local = null;
    try {
      await fs.access(existingJpg);
      local = `/cars/${existing}.jpg`;
    } catch {
      try {
        await fs.access(existingPng);
        local = `/cars/${existing}.png`;
      } catch {
        local = await downloadImage(brand, model);
      }
    }

    if (local) {
      imageByPair.set(`${brand}|||${model}`, local);
      found++;
      console.log(`✓ ${brand} ${model} -> ${local}`);
    } else {
      console.log(`✗ ${brand} ${model} (queda placeholder)`);
    }
    await sleep(300);
  }

  console.log(`Fotos descargadas: ${found}/${pairs.length}`);

  let updated = 0;
  for (const [key, image] of imageByPair) {
    const [brand, model] = key.split("|||");
    const res = await sql.query(
      `UPDATE listings SET images = $3::jsonb
       WHERE brand = $1 AND model = $2
         AND (images = '[]'::jsonb
           OR images->>0 = '/car-placeholder.svg'
           OR images->>0 LIKE '%wikimedia%')
       RETURNING id`,
      [brand, model, JSON.stringify([image])],
    );
    updated += res.length;
  }
  console.log(`Avisos actualizados en la base: ${updated}`);

  const jsonPath = path.join(process.cwd(), "data", "listings.json");
  try {
    const listings = JSON.parse(await fs.readFile(jsonPath, "utf8"));
    let jsonUpdated = 0;
    for (const l of listings) {
      const image = imageByPair.get(`${l.brand}|||${l.model}`);
      if (
        image &&
        (!Array.isArray(l.images) ||
          l.images.length === 0 ||
          l.images[0] === "/car-placeholder.svg" ||
          l.images[0].includes("wikimedia"))
      ) {
        l.images = [image];
        jsonUpdated++;
      }
    }
    await fs.writeFile(jsonPath, `${JSON.stringify(listings, null, 2)}\n`, "utf8");
    console.log(`Seed JSON actualizado: ${jsonUpdated} avisos`);
  } catch (e) {
    console.log("No se pudo actualizar el seed JSON:", e.message);
  }

  console.log("Listo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
