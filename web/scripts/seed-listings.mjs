import { promises as fs } from "fs";
import path from "path";

const CHILE_REGIONS = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Región Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

const CITIES_BY_REGION = {
  "Región Metropolitana": ["Santiago", "Maipú", "Las Condes", "Puente Alto"],
  Valparaíso: ["Viña del Mar", "Valparaíso", "Quilpué"],
  Biobío: ["Concepción", "Talcahuano", "Los Ángeles"],
  Coquimbo: ["La Serena", "Coquimbo"],
  "La Araucanía": ["Temuco", "Villarrica"],
  "Los Lagos": ["Puerto Montt", "Osorno"],
  Atacama: ["Copiapó"],
  Antofagasta: ["Antofagasta", "Calama"],
  Maule: ["Talca", "Curicó"],
};

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

 function argNumber(name, fallback) {
   const raw = argValue(name, fallback);
   if (raw === undefined) return undefined;
   const n = Number(raw);
   return Number.isFinite(n) ? n : undefined;
 }

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseCsvLine(line) {
  const out = [];
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

async function resolveCatalogPath() {
  const candidates = [
    path.join(process.cwd(), "..", "catalogo_autos_chile_2000_2025.csv"),
    path.join(process.cwd(), "catalogo_autos_chile_2000_2025.csv"),
  ];

  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // continue
    }
  }

  throw new Error("No se encontró el CSV de catálogo.");
}

async function loadCatalogPairs() {
  const csvPath = await resolveCatalogPath();
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const normHeader = header.map((h) =>
    String(h)
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase(),
  );
  const brandIdx = normHeader.indexOf("brand");
  const modelIdx = normHeader.indexOf("model");
  const yearsIdx = normHeader.indexOf("years");

  if (brandIdx === -1 || modelIdx === -1) {
    throw new Error("CSV inválido: faltan columnas Brand/Model");
  }

  const pairs = [];

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const brand = (cols[brandIdx] ?? "").trim().toUpperCase();
    const model = (cols[modelIdx] ?? "").trim();

     const yearsRaw = yearsIdx === -1 ? "" : (cols[yearsIdx] ?? "");
     const match = String(yearsRaw).match(/(\d{4})\s*-\s*(\d{4})/);
     let minYear = 2000;
     let maxYear = 2025;

     if (match) {
       let a = Number(match[1]);
       let b = Number(match[2]);

       if (Number.isFinite(a) && Number.isFinite(b)) {
         if (a > b) {
           const tmp = a;
           a = b;
           b = tmp;
         }

         a = Math.max(2000, a);
         b = Math.min(2025, b);

         if (a <= b) {
           minYear = a;
           maxYear = b;
         }
       }
     }

    if (!brand || !model) continue;
    pairs.push({ brand, model, minYear, maxYear });
  }

  return pairs;
}

 function shuffleInPlace(arr) {
   for (let i = arr.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     const tmp = arr[i];
     arr[i] = arr[j];
     arr[j] = tmp;
   }
   return arr;
 }

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pairKey(brand, model) {
  return `${String(brand).trim().toUpperCase()}|||${String(model)
    .trim()
    .toLowerCase()}`;
}

function getNextId(existing) {
  let max = 0;
  for (const item of existing) {
    const match = /^ls_(\d+)$/.exec(item.id);
    if (!match) continue;
    const num = Number(match[1]);
    if (!Number.isFinite(num)) continue;
    max = Math.max(max, num);
  }
  return max + 1;
}

function makePhone() {
  const a = randInt(1000, 9999);
  const b = randInt(1000, 9999);
  return `+56 9 ${a} ${b}`;
}

function makeCreatedAt() {
  const now = Date.now();
  const days = randInt(0, 60);
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
}

function estimateKm(year) {
  const age = Math.max(0, 2025 - year);
  const base = age * randInt(8000, 14000);
  const noise = randInt(0, 20000);
  return Math.max(0, base + noise);
}

function estimatePrice(year) {
  const age = Math.max(0, 2025 - year);
  const base = 22000000 - age * randInt(600000, 1100000);
  const noise = randInt(-1200000, 1200000);
  return Math.max(900000, base + noise);
}

async function main() {
  const reset = hasFlag("--reset");
  const append = hasFlag("--append") || !reset;
  const all = hasFlag("--all");
  const count = argNumber("--count", "120");
  const target = argNumber("--target", undefined);

  if (target !== undefined && target <= 0) {
    throw new Error("--target debe ser un número > 0");
  }

  if (target === undefined && !all && (!Number.isFinite(count) || count <= 0)) {
    throw new Error("--count debe ser un número > 0");
  }

  const listingsPath = path.join(process.cwd(), "data", "listings.json");
  const existing = append
    ? JSON.parse(await fs.readFile(listingsPath, "utf8"))
    : [];

  const base = Array.isArray(existing) ? existing : [];
  let nextNum = getNextId(base);

  const existingPairKeys = new Set();
  for (const item of base) {
    if (!item || !item.brand || !item.model) continue;
    existingPairKeys.add(pairKey(item.brand, item.model));
  }

  const pairs = await loadCatalogPairs();
  if (pairs.length === 0) {
    throw new Error("No se pudieron cargar marcas/modelos desde el CSV");
  }

  const transmissions = ["Manual", "Automática"];
  const fuels = ["Bencina", "Diésel", "Híbrido", "Eléctrico"];

  const newItems = [];

  function makeItem(pair) {
    const { brand, model, minYear = 2000, maxYear = 2025 } = pair;
    const year = randInt(minYear, maxYear);
    const region = pick(CHILE_REGIONS);
    const cities = CITIES_BY_REGION[region] ?? ["Ciudad"];

    return {
      id: `ls_${String(nextNum).padStart(4, "0")}`,
      brand,
      model,
      year,
      price: estimatePrice(year),
      km: estimateKm(year),
      region,
      city: pick(cities),
      transmission: pick(transmissions),
      fuel: pick(fuels),
      description: `${brand} ${model} ${year}. Documentos al día.`,
      images: ["/car-placeholder.svg"],
      contactName: "Vendedor BuenAuto",
      contactPhone: makePhone(),
      createdAt: makeCreatedAt(),
    };
  }

  if (all) {
    for (const pair of pairs) {
      const { brand, model } = pair;
      const key = pairKey(brand, model);
      if (existingPairKeys.has(key)) continue;
      existingPairKeys.add(key);

      const item = makeItem(pair);
      newItems.push(item);
      nextNum++;
    }
  }

  let pool = shuffleInPlace([...pairs]);
  let poolIdx = 0;
  function nextPair() {
    if (poolIdx >= pool.length) {
      pool = shuffleInPlace([...pairs]);
      poolIdx = 0;
    }
    return pool[poolIdx++];
  }

  const baseCountAfterAll = base.length + newItems.length;
  const remaining =
    target !== undefined
      ? Math.max(0, target - baseCountAfterAll)
      : all
        ? 0
        : count;

  for (let i = 0; i < remaining; i++) {
    const pair = nextPair();
    const item = makeItem(pair);
    newItems.push(item);
    nextNum++;
  }

  const merged = [...newItems, ...base];
  await fs.writeFile(listingsPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  console.log(
    `OK: ${newItems.length} avisos ${append ? "agregados" : "creados"} en ${listingsPath}`,
  );
  console.log("Ejemplo:", merged[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
