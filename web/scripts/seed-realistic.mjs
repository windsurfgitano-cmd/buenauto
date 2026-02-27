#!/usr/bin/env node
// @ts-check
/**
 * Seed listings with realistic Chilean car data
 * Generates 30+ listings from the catalog CSV
 */

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const LISTINGS_FILE = path.join(process.cwd(), "data", "listings.json");
const CATALOG_FILE = path.join("c:", "Users", "Ozymandias", "Documents", "BuenAuto", "catalogo_autos_chile_2000_2025.csv");

const REGIONS = [
  "Metropolitana de Santiago",
  "Valparaíso",
  "Biobío",
  "Maule",
  "Araucanía",
  "Los Lagos",
  "Coquimbo",
  "O'Higgins",
  "Antofagasta",
  "Tarapacá",
];

const CITIES = {
  "Metropolitana de Santiago": ["Santiago", "Las Condes", "Ñuñoa", "La Florida", "Puente Alto", "Maipú", "Providencia"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
  "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Chillán"],
  "Maule": ["Talca", "Curicó", "Linares"],
  "Araucanía": ["Temuco", "Villarrica", "Pucón"],
  "Los Lagos": ["Puerto Montt", "Osorno", "Valdivia"],
  "Coquimbo": ["La Serena", "Coquimbo", "Ovalle"],
  "O'Higgins": ["Rancagua", "San Fernando"],
  "Antofagasta": ["Antofagasta", "Calama"],
  "Tarapacá": ["Iquique", "Alto Hospicio"],
};

const TRANSMISSIONS = ["Manual", "Automática"];
const FUELS = ["Bencina", "Diésel", "Híbrido"];

const DESCRIPTIONS = [
  "Excelente estado, único dueño. Mantenciones al día en concesionario oficial. Documentos al día, sin multas.",
  "Auto familiar, muy cuidado. Neumáticos nuevos, batería recién cambiada. Listo para transferir.",
  "Segundo dueño, impecable. Full equipo: aire acondicionado, cierre centralizado, alzavidrios eléctricos.",
  "Vehículo de trabajo, motor impecable. Papeles al día, revisión técnica vigente. Precio conversable.",
  "Oportunidad! Auto económico, ideal para ciudad. Consumo eficiente, poco kilometraje para el año.",
  "Versión full, cuero, sunroof, navegador. Muy equipado, se aceptan permutas por menor valor.",
  "Auto de seniors, siempre en garage. Pintura original, sin choques. Inmejorable estado general.",
  "Primera mano, comprado en Chile. Kit de distribución recién cambiado. Mecánica 100%.",
];

const CONTACT_NAMES = ["Juan", "María", "Pedro", "Ana", "Carlos", "Laura", "Diego", "Carmen", "José", "Patricia"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomPhone() {
  const prefix = "9";
  const num = randomInt(10000000, 99999999);
  return `+56 ${prefix} ${String(num).slice(0, 4)} ${String(num).slice(4, 8)}`;
}

function formatPrice(year) {
  // Older cars = cheaper
  const base = 2026 - year;
  const min = Math.max(3000000, 15000000 - base * 800000);
  const max = Math.max(6000000, 25000000 - base * 500000);
  return randomInt(min, max);
}

function formatKM(year) {
  const age = 2026 - year;
  const annualKM = randomInt(8000, 25000);
  return age * annualKM;
}

async function loadCatalog() {
  try {
    const raw = await fs.readFile(CATALOG_FILE, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    
    const header = lines[0].split(",");
    const brandIdx = header.indexOf("Brand");
    const modelIdx = header.indexOf("Model");
    const yearsIdx = header.indexOf("Years");
    
    if (brandIdx === -1 || modelIdx === -1) return [];
    
    const cars = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const brand = cols[brandIdx]?.trim();
      const model = cols[modelIdx]?.trim();
      const years = cols[yearsIdx]?.trim();
      
      if (!brand || !model) continue;
      
      // Parse year range
      let minYear = 2000, maxYear = 2025;
      if (years) {
        const match = years.match(/(\d{4})\s*-\s*(\d{4}|Presente)/i);
        if (match) {
          minYear = parseInt(match[1]);
          maxYear = match[2].toLowerCase() === "presente" ? 2025 : parseInt(match[2]);
        }
      }
      
      cars.push({ brand, model, minYear, maxYear });
    }
    
    return cars;
  } catch (err) {
    console.error("Error loading catalog:", err.message);
    return [];
  }
}

async function main() {
  console.log("Loading catalog...");
  const catalog = await loadCatalog();
  
  if (catalog.length === 0) {
    console.error("No cars found in catalog");
    process.exit(1);
  }
  
  console.log(`Found ${catalog.length} cars in catalog`);
  
  // Generate 35 listings
  const listings = [];
  const used = new Set();
  
  for (let i = 0; i < 35; i++) {
    // Pick random car from catalog
    let car;
    let key;
    let attempts = 0;
    
    do {
      car = randomChoice(catalog);
      const year = randomInt(Math.max(car.minYear, 2010), Math.min(car.maxYear, 2024));
      key = `${car.brand}-${car.model}-${year}`;
      attempts++;
    } while (used.has(key) && attempts < 100);
    
    if (attempts >= 100) {
      console.log("Running out of unique combinations");
      break;
    }
    
    used.add(key);
    
    const year = randomInt(Math.max(car.minYear, 2010), Math.min(car.maxYear, 2024));
    const region = randomChoice(REGIONS);
    const city = randomChoice(CITIES[region] || ["Santiago"]);
    
    const listing = {
      id: `ls_${String(i + 1).padStart(4, "0")}`,
      brand: car.brand.toUpperCase(),
      model: car.model,
      year,
      price: formatPrice(year),
      km: formatKM(year),
      region,
      city,
      transmission: randomChoice(TRANSMISSIONS),
      fuel: randomChoice(FUELS),
      description: randomChoice(DESCRIPTIONS),
      images: ["/car-placeholder.svg"],
      contactName: randomChoice(CONTACT_NAMES),
      contactPhone: randomPhone(),
      createdAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
      status: "published",
      publishedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    listings.push(listing);
  }
  
  // Read existing listings to preserve them
  let existing = [];
  try {
    const raw = await fs.readFile(LISTINGS_FILE, "utf8");
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    // File doesn't exist or is empty
  }
  
  // Merge: new listings first, then existing
  const merged = [...listings, ...existing];
  
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(merged, null, 2) + "\n", "utf8");
  
  console.log(`✅ Generated ${listings.length} listings`);
  console.log(`📁 Total listings in database: ${merged.length}`);
  console.log("\nSample listings:");
  listings.slice(0, 5).forEach(l => {
    console.log(`  - ${l.brand} ${l.model} ${l.year} - $${l.price.toLocaleString("es-CL")} - ${l.region}`);
  });
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
