import fs from 'fs';

const REGIONS = ['Metropolitana de Santiago', 'Valparaiso', 'Biobio', 'Maule', 'Araucania', 'Los Lagos', 'Coquimbo', 'OHiggins', 'Antofagasta'];
const CITIES = {
  'Metropolitana de Santiago': ['Santiago', 'Las Condes', 'Nuñoa', 'La Florida', 'Puente Alto'],
  'Valparaiso': ['Valparaiso', 'Viña del Mar', 'Quilpue'],
  'Biobio': ['Concepcion', 'Talcahuano', 'Chillan'],
  'Maule': ['Talca', 'Curico'],
  'Araucania': ['Temuco', 'Villarrica'],
  'Los Lagos': ['Puerto Montt', 'Osorno'],
  'Coquimbo': ['La Serena', 'Coquimbo'],
  'OHiggins': ['Rancagua'],
  'Antofagasta': ['Antofagasta']
};

const CARS = [
  {brand: 'TOYOTA', model: 'Corolla', years: [2015, 2018, 2019, 2020, 2021, 2022, 2023]},
  {brand: 'TOYOTA', model: 'Hilux', years: [2015, 2017, 2018, 2019, 2020, 2021, 2022, 2023]},
  {brand: 'TOYOTA', model: 'RAV4', years: [2015, 2017, 2018, 2019, 2020, 2021, 2022]},
  {brand: 'TOYOTA', model: 'Yaris', years: [2015, 2017, 2018, 2019, 2020, 2021, 2022, 2023]},
  {brand: 'TOYOTA', model: 'Fortuner', years: [2016, 2018, 2019, 2020, 2021, 2022]},
  {brand: 'TOYOTA', model: 'Prius', years: [2016, 2018, 2019, 2020, 2021]},
  {brand: 'TOYOTA', model: 'Camry', years: [2015, 2017, 2018, 2019, 2020]},
  {brand: 'SUZUKI', model: 'Swift', years: [2015, 2017, 2018, 2019, 2020, 2021, 2022]},
  {brand: 'SUZUKI', model: 'Vitara', years: [2015, 2017, 2018, 2019, 2020, 2021]},
  {brand: 'SUZUKI', model: 'Jimny', years: [2015, 2018, 2019, 2020, 2021, 2022, 2023]},
  {brand: 'SUZUKI', model: 'Alto', years: [2015, 2017, 2018, 2019, 2020]},
  {brand: 'NISSAN', model: 'Versa', years: [2015, 2017, 2018, 2019, 2020, 2021, 2022]},
  {brand: 'NISSAN', model: 'X-Trail', years: [2015, 2017, 2018, 2019, 2020, 2021]},
  {brand: 'NISSAN', model: 'Navara', years: [2015, 2017, 2019, 2020, 2021, 2022]},
  {brand: 'NISSAN', model: 'Kicks', years: [2017, 2019, 2020, 2021, 2022, 2023]},
  {brand: 'NISSAN', model: 'March', years: [2015, 2017, 2018, 2019, 2020, 2021]},
  {brand: 'NISSAN', model: 'Qashqai', years: [2015, 2017, 2018, 2019, 2020]},
  {brand: 'TOYOTA', model: 'Land Cruiser', years: [2010, 2012, 2014, 2015, 2016, 2018]},
  {brand: 'TOYOTA', model: '4Runner', years: [2010, 2012, 2014, 2015]},
  {brand: 'SUZUKI', model: 'S-Cross', years: [2015, 2017, 2019, 2020]},
];

const DESCS = [
  'Excelente estado, unico dueño. Mantenciones al dia en concesionario oficial.',
  'Auto familiar muy cuidado. Documentos al dia, sin multas. Listo para transferir.',
  'Segundo dueño, impecable. Full equipo: aire, cierre centralizado, alzavidrios.',
  'Vehiculo de trabajo, motor impecable. Revision tecnica vigente.',
  'Oportunidad! Economico, ideal para ciudad. Consumo eficiente.',
  'Version full equipada. Se aceptan permutas.',
  'Siempre en garage. Pintura original, sin choques.',
  'Primera mano, kit de distribucion recien cambiado.'
];

const NAMES = ['Juan', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Laura', 'Diego', 'Carmen'];

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const listings = [];
for (let i = 1; i <= 30; i++) {
  const car = random(CARS);
  const year = random(car.years);
  const region = random(REGIONS);
  const age = 2026 - year;
  const km = age * randInt(8000, 25000);
  const basePrice = car.brand === 'TOYOTA' ? 15000000 : car.brand === 'NISSAN' ? 12000000 : 10000000;
  const price = Math.max(4000000, basePrice - (age * 800000) + randInt(-1000000, 2000000));
  
  listings.push({
    id: 'ls_' + String(i).padStart(4, '0'),
    brand: car.brand,
    model: car.model,
    year: year,
    price: price,
    km: km,
    region: region,
    city: random(CITIES[region]),
    transmission: random(['Manual', 'Automatica']),
    fuel: random(['Bencina', 'Diesel', 'Hibrido']),
    description: random(DESCS),
    images: ['/car-placeholder.svg'],
    contactName: random(NAMES),
    contactPhone: '+56 9 ' + randInt(1000, 9999) + ' ' + randInt(1000, 9999),
    createdAt: new Date(Date.now() - randInt(1, 30) * 86400000).toISOString(),
    status: 'published',
    publishedAt: new Date(Date.now() - randInt(1, 30) * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
  });
}

fs.writeFileSync('data/listings.json', JSON.stringify(listings, null, 2) + '\n');
console.log('Created', listings.length, 'listings');
listings.slice(0, 5).forEach(l => console.log('- ' + l.brand + ' ' + l.model + ' ' + l.year + ' $' + l.price.toLocaleString('es-CL')));
