#!/usr/bin/env node
// @ts-check
/**
 * Genera un mercado realista de avisos de autos chilenos e inserta en Neon.
 *
 * - Marcas/modelos tomados del CSV del catálogo, ponderados por popularidad
 *   real del mercado chileno de compraventa.
 * - Precios por año + tier de marca, km por antigüedad, regiones por
 *   población, combustible/transmisión coherentes.
 * - Reutiliza las fotos de public/cars/<marca-modelo>.jpg cuando existen;
 *   si no, usa el placeholder de marca.
 * - Descripciones variadas (determinísticas por índice).
 * - Inserción por lotes con reintento ante errores transitorios de red.
 *
 * Uso: node scripts/generate-market.mjs [--count 10000]
 */

import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

async function loadEnvLocal() {
  if (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) return;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {
    /* sin .env.local */
  }
}

function argNumber(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) return fallback;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}

// PRNG determinístico (mulberry32) sembrado por índice.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const randInt = (r, min, max) => Math.floor(r() * (max - min + 1)) + min;

// Peso de popularidad por marca en el mercado chileno de usados.
const BRAND_WEIGHT = {
  CHEVROLET: 14, HYUNDAI: 13, KIA: 11, TOYOTA: 11, NISSAN: 9, SUZUKI: 8,
  MAZDA: 6, PEUGEOT: 5, FORD: 5, VOLKSWAGEN: 4, MITSUBISHI: 4, HONDA: 3,
  RENAULT: 3, CHERY: 3, MG: 3, "GREAT WALL": 2, CITROËN: 2, SUBARU: 2,
  BYD: 2, JAC: 1, CHANGAN: 1, DFSK: 1, BMW: 2, "MERCEDES-BENZ": 2, AUDI: 1,
  VOLVO: 1, LEXUS: 1, JEEP: 1, "LAND ROVER": 1, OPEL: 1, FIAT: 1, GEELY: 1,
};

const BRAND_TIER = {
  luxury: new Set(["BMW", "MERCEDES-BENZ", "AUDI", "LEXUS", "PORSCHE", "LAND ROVER", "JAGUAR", "VOLVO"]),
  budget: new Set(["CHERY", "JAC", "CHANGAN", "DFSK", "GREAT WALL", "SUZUKI", "GEELY", "BAIC", "DONGFENG"]),
};

const REGIONS = [
  { region: "Región Metropolitana", cities: ["Santiago", "Maipú", "Las Condes", "Puente Alto", "La Florida", "Ñuñoa"], w: 42 },
  { region: "Valparaíso", cities: ["Viña del Mar", "Valparaíso", "Quilpué", "Villa Alemana"], w: 11 },
  { region: "Biobío", cities: ["Concepción", "Talcahuano", "Los Ángeles", "Chiguayante"], w: 9 },
  { region: "Maule", cities: ["Talca", "Curicó", "Linares"], w: 6 },
  { region: "La Araucanía", cities: ["Temuco", "Villarrica", "Angol"], w: 5 },
  { region: "Coquimbo", cities: ["La Serena", "Coquimbo", "Ovalle"], w: 5 },
  { region: "O'Higgins", cities: ["Rancagua", "San Fernando", "Machalí"], w: 5 },
  { region: "Los Lagos", cities: ["Puerto Montt", "Osorno", "Castro"], w: 4 },
  { region: "Antofagasta", cities: ["Antofagasta", "Calama"], w: 4 },
  { region: "Ñuble", cities: ["Chillán", "San Carlos"], w: 3 },
  { region: "Los Ríos", cities: ["Valdivia", "La Unión"], w: 2 },
  { region: "Tarapacá", cities: ["Iquique", "Alto Hospicio"], w: 2 },
  { region: "Atacama", cities: ["Copiapó", "Vallenar"], w: 1 },
  { region: "Arica y Parinacota", cities: ["Arica"], w: 1 },
  { region: "Aysén", cities: ["Coyhaique"], w: 0.5 },
  { region: "Magallanes", cities: ["Punta Arenas"], w: 0.5 },
];

const NOMBRES = ["Juan", "María", "Pedro", "Camila", "Diego", "Valentina", "José", "Francisca",
  "Matías", "Javiera", "Cristián", "Antonia", "Rodrigo", "Catalina", "Felipe", "Constanza",
  "Sebastián", "Fernanda", "Nicolás", "Daniela", "Andrés", "Paula", "Gonzalo", "Carla"];

function weightedPicker(entries) {
  const total = entries.reduce((s, e) => s + e.w, 0);
  return (r) => {
    let x = r() * total;
    for (const e of entries) {
      x -= e.w;
      if (x <= 0) return e;
    }
    return entries[entries.length - 1];
  };
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

async function loadCatalog() {
  const raw = await fs.readFile(
    path.join(process.cwd(), "data", "catalogo_autos_chile_2000_2025.csv"),
    "utf8",
  );
  const lines = raw.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const bi = header.indexOf("brand");
  const mi = header.indexOf("model");
  const yi = header.indexOf("years");

  const byBrand = new Map();
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const brand = (cols[bi] ?? "").trim().toUpperCase();
    const model = (cols[mi] ?? "").trim();
    if (!brand || !model) continue;
    let minY = 2000, maxY = 2025;
    const mm = String(cols[yi] ?? "").match(/(\d{4})\s*-\s*(\d{4})/);
    if (mm) { minY = Math.max(2000, +mm[1]); maxY = Math.min(2025, +mm[2]); if (minY > maxY) [minY, maxY] = [maxY, minY]; }
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand).push({ model, minY, maxY });
  }
  return byBrand;
}

function estimatePrice(r, year, tier) {
  const age = Math.max(0, 2026 - year);
  let base = 19000000 - age * randInt(r, 900000, 1300000);
  if (tier === "luxury") base *= 2.1;
  else if (tier === "budget") base *= 0.78;
  base *= 0.9 + r() * 0.25;
  return Math.max(1200000, Math.round(base / 50000) * 50000);
}

function estimateKm(r, year) {
  const age = Math.max(0, 2026 - year);
  return Math.max(0, age * randInt(r, 7000, 15000) + randInt(r, 0, 18000));
}

function buildDescription(r, brand, model, year, km, fuel) {
  const nombre = `${brand.charAt(0) + brand.slice(1).toLowerCase()} ${model}`;
  const age = 2026 - year;
  const opener = pick(r, [
    `Vendo ${nombre} ${year} en excelente estado.`,
    `Se vende ${nombre} año ${year}, muy cuidado.`,
    `${nombre} ${year} impecable, listo para transferir.`,
    `Vendo por cambio de auto ${nombre} ${year}.`,
    `A la venta ${nombre} ${year}, mantenciones al día.`,
  ]);
  const km_c = km / Math.max(1, age) < 9000
    ? "Pocos kilómetros para el año."
    : km / Math.max(1, age) > 16000
      ? "Uso mayormente carretera, motor suave."
      : "Kilometraje acorde al año.";
  const mant = pick(r, [
    "Mantenciones al día con respaldo.",
    "Últimas mantenciones en servicio oficial.",
    age >= 6 ? "Distribución y frenos recién hechos." : "Aceite y filtros recién cambiados.",
  ]);
  const extras = [];
  if (year >= 2018 && r() < 0.6) extras.push("pantalla con Android Auto/CarPlay");
  if (year >= 2015 && r() < 0.5) extras.push("cámara de retroceso");
  if (r() < 0.5) extras.push("aire acondicionado");
  if (fuel === "Diésel" && r() < 0.6) extras.push("muy económico");
  if (fuel === "Eléctrico") extras.push("carga rápida, cero bencina");
  const extrasT = extras.length ? `Cuenta con ${extras.join(", ")}.` : "";
  const dueno = age <= 7 && r() < 0.5 ? pick(r, ["Único dueño.", "Segundo dueño."]) : "";
  const papeles = pick(r, ["Documentos al día, revisión técnica vigente.", "Papeles al día, sin multas ni prendas."]);
  const cierre = r() < 0.5 ? pick(r, ["Conversable con papeles en mano.", "Se escuchan ofertas serias.", "Cualquier prueba, bienvenida."]) : "";
  return [opener, km_c, mant, dueno, extrasT, papeles, cierre].filter(Boolean).join(" ");
}

async function main() {
  await loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
  if (!dbUrl) { console.error("Falta DATABASE_URL"); process.exit(1); }
  const sql = neon(dbUrl);

  const count = argNumber("--count", 10000);

  const byBrand = await loadCatalog();
  const brandEntries = Object.entries(BRAND_WEIGHT)
    .filter(([b]) => byBrand.has(b))
    .map(([brand, w]) => ({ brand, w }));
  const pickBrand = weightedPicker(brandEntries);
  const pickRegion = weightedPicker(REGIONS);

  // Fotos de modelo disponibles
  const carFiles = await fs.readdir(path.join(process.cwd(), "public", "cars")).catch(() => []);
  const photoBySlug = new Map();
  for (const f of carFiles) {
    const m = /^(.*)\.(jpg|png)$/i.exec(f);
    if (m) photoBySlug.set(m[1], `/cars/${f}`);
  }

  // Marcar modelos con foto y separarlos por marca. Se sesga la elección
  // hacia modelos fotografiados (que además son los más comunes en Chile),
  // subiendo la cobertura de fotos reales sin romper el realismo.
  const modelsWithPhoto = new Map();
  for (const [brand, models] of byBrand) {
    for (const mdl of models) {
      mdl.hasPhoto = photoBySlug.has(slugify(`${brand}-${mdl.model}`));
    }
    const withPhoto = models.filter((mdl) => mdl.hasPhoto);
    if (withPhoto.length > 0) modelsWithPhoto.set(brand, withPhoto);
  }

  const transmissions = ["Manual", "Automática"];
  const fuels = ["Bencina", "Bencina", "Bencina", "Diésel", "Híbrido"];

  // Continuar los ids desde el máximo actual
  const maxRow = await sql.query(
    "SELECT COALESCE(max((substring(id from 'ls_(\\d+)'))::int), 0) AS m FROM listings WHERE id ~ '^ls_\\d+$'",
  );
  let nextNum = Number(maxRow[0].m) + 1;

  const now = Date.now();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const r = rng(0x9e37 ^ (i * 2654435761));
    const brand = pickBrand(r).brand;
    const withPhoto = modelsWithPhoto.get(brand);
    // 70% de las veces se elige un modelo fotografiado si la marca tiene.
    const modelPool = withPhoto && r() < 0.7 ? withPhoto : byBrand.get(brand);
    const { model, minY, maxY } = pick(r, modelPool);
    const year = randInt(r, minY, maxY);
    const tier = BRAND_TIER.luxury.has(brand) ? "luxury" : BRAND_TIER.budget.has(brand) ? "budget" : "std";
    const price = estimatePrice(r, year, tier);
    const km = estimateKm(r, year);
    const geo = pickRegion(r);
    const isEv = brand === "BYD" || brand === "TESLA";
    const fuel = isEv ? "Eléctrico" : pick(r, fuels);
    const transmission = year >= 2016 || r() < 0.5 ? pick(r, transmissions) : "Manual";
    const slug = slugify(`${brand}-${model}`);
    const image = photoBySlug.get(slug) ?? "/car-placeholder.svg";
    const createdAt = new Date(now - randInt(r, 0, 75) * 86400000).toISOString();
    const id = `ls_${String(nextNum++).padStart(6, "0")}`;

    rows.push([
      id, null, "published", brand, model, year, price, km,
      geo.region, pick(r, geo.cities), transmission, fuel,
      buildDescription(r, brand, model, year, km, fuel),
      JSON.stringify([image]), pick(r, NOMBRES),
      `+56 9 ${randInt(r, 1000, 9999)} ${randInt(r, 1000, 9999)}`,
      createdAt,
    ]);
  }

  console.log(`Generados ${rows.length} avisos. Insertando en lotes...`);

  const COLS = 17;
  const BATCH = 200;
  let inserted = 0;
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = rows.slice(start, start + BATCH);
    const values = [];
    const params = [];
    batch.forEach((row, bi) => {
      const base = bi * COLS;
      values.push(`(${Array.from({ length: COLS }, (_, k) => `$${base + k + 1}`).join(",")})`);
      params.push(...row);
    });
    const text = `INSERT INTO listings (
      id, owner_id, status, brand, model, year, price, km, region, city,
      transmission, fuel, description, images, contact_name, contact_phone, created_at
    ) VALUES ${values.join(",")} ON CONFLICT (id) DO NOTHING`;

    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        await sql.query(text, params);
        ok = true;
      } catch (e) {
        if (attempt === 3) throw e;
        await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
      }
    }
    inserted += batch.length;
    if (inserted % 1000 === 0 || inserted === rows.length) {
      console.log(`  ${inserted}/${rows.length}`);
    }
  }

  const totals = await sql.query("SELECT count(*)::int AS total, count(DISTINCT brand)::int AS marcas FROM listings");
  console.log("Totales en la base:", JSON.stringify(totals[0]));
  console.log("Listo");
}

main().catch((err) => { console.error(err); process.exit(1); });
