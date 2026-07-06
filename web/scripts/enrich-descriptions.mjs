#!/usr/bin/env node
// @ts-check
/**
 * Reemplaza las descripciones genéricas de los avisos seed
 * ("MARCA Modelo AÑO. Documentos al día.") por descripciones variadas
 * y coherentes con año/km/combustible. Determinístico por id, así que
 * re-ejecutarlo no cambia nada. Solo toca avisos sin dueño (seeds).
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
    // sin .env.local
  }
}

/** PRNG determinístico a partir del id del aviso. */
function makeRng(seedText) {
  let h = 2166136261;
  for (const ch of seedText) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function maybe(rng, prob, value) {
  return rng() < prob ? value : null;
}

function buildDescription(l) {
  const rng = makeRng(l.id);
  const age = 2026 - l.year;
  const kmPerYear = age > 0 ? l.km / age : l.km;
  const nombre = `${cap(l.brand)} ${l.model}`;

  const opener = pick(rng, [
    `Vendo ${nombre} ${l.year} en excelente estado.`,
    `Se vende ${nombre} año ${l.year}, muy cuidado.`,
    `A la venta ${nombre} ${l.year}.`,
    `Vendo por renovación ${nombre} ${l.year}.`,
    `${nombre} ${l.year} impecable, listo para transferir.`,
  ]);

  const kmComment =
    kmPerYear < 9000
      ? pick(rng, [
          "Pocos kilómetros para el año, uso de ciudad.",
          "Kilometraje bajo, siempre estacionado en techado.",
        ])
      : kmPerYear > 16000
        ? pick(rng, [
            "Kilometraje mayormente de carretera, motor suave.",
            "Uso de carretera, mecánica al día.",
          ])
        : pick(rng, [
            "Kilometraje acorde al año.",
            "Uso mixto ciudad/carretera.",
          ]);

  const mantencion = pick(rng, [
    "Mantenciones al día con respaldo.",
    "Mantenciones recientes, con boletas.",
    age >= 6 ? "Kit de distribución y frenos recién hechos." : "Mantenciones en servicio oficial.",
    "Aceite y filtros recién cambiados.",
  ]);

  const extras = [];
  if (l.year >= 2018) extras.push(maybe(rng, 0.6, "pantalla con Android Auto/CarPlay"));
  if (l.year >= 2015) extras.push(maybe(rng, 0.5, "sensores de retroceso"));
  extras.push(maybe(rng, 0.5, "aire acondicionado"));
  extras.push(maybe(rng, 0.35, "llantas originales"));
  if (l.fuel === "Eléctrico") extras.push("batería con excelente salud");
  if (l.fuel === "Híbrido") extras.push("consumo híbrido muy económico");
  if (l.fuel === "Diésel") extras.push(maybe(rng, 0.6, "muy económico en carretera"));
  const extrasClean = extras.filter(Boolean);
  const extrasText =
    extrasClean.length > 0 ? `Cuenta con ${listInSpanish(extrasClean)}.` : null;

  const dueno =
    age <= 7 ? maybe(rng, 0.55, pick(rng, ["Único dueño.", "Segundo dueño."])) : null;

  const papeles = pick(rng, [
    "Documentos al día, revisión técnica vigente.",
    "Papeles al día, sin multas ni prendas.",
    "Todo al día, transferencia inmediata.",
  ]);

  const cierre = maybe(
    rng,
    0.5,
    pick(rng, [
      "Cualquier prueba con mecánico, bienvenida.",
      "Conversable con papeles en mano.",
      "Se escuchan ofertas razonables.",
      "Solo interesados serios, por favor.",
    ]),
  );

  return [opener, kmComment, mantencion, dueno, extrasText, papeles, cierre]
    .filter(Boolean)
    .join(" ");
}

function cap(text) {
  const lower = text.toLowerCase();
  if (text.length <= 3) return text; // BMW, BYD, MG, JAC...
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function listInSpanish(items) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

async function main() {
  await loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
  if (!dbUrl) {
    console.error("Falta DATABASE_URL");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  const rows = await sql.query(
    `SELECT id, brand, model, year, km, fuel FROM listings
     WHERE owner_id IS NULL OR owner_id = ''`,
  );
  console.log(`Avisos seed: ${rows.length}`);

  const byId = new Map();
  for (const l of rows) {
    byId.set(l.id, buildDescription(l));
  }

  let updated = 0;
  for (const [id, description] of byId) {
    const res = await sql.query(
      `UPDATE listings SET description = $2 WHERE id = $1 RETURNING id`,
      [id, description],
    );
    updated += res.length;
  }
  console.log(`Actualizados en la base: ${updated}`);

  const jsonPath = path.join(process.cwd(), "data", "listings.json");
  const listings = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  let jsonUpdated = 0;
  for (const l of listings) {
    const description = byId.get(l.id);
    if (description) {
      l.description = description;
      jsonUpdated++;
    }
  }
  await fs.writeFile(jsonPath, `${JSON.stringify(listings, null, 2)}\n`, "utf8");
  console.log(`Seed JSON actualizado: ${jsonUpdated}`);

  console.log("Ejemplo:", byId.get(rows[0].id));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
