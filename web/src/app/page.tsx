import Link from "next/link";
import { getListings } from "@/lib/server/listings-store";
import { SearchBox } from "@/components/search/search-box";
import type { Listing } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("es-CL");
}

export default async function Home() {
  let listings: Listing[] = [];
  let brands: string[] = [];

  try {
    listings = await getListings();
    brands = [...new Set(listings.map(l => l.brand))].sort();
  } catch (e) {
    console.error("Error loading listings:", e);
  }

  const featured = listings.slice(0, 12);

  const brandCounts = new Map<string, number>();
  for (const l of listings) {
    brandCounts.set(l.brand, (brandCounts.get(l.brand) ?? 0) + 1);
  }
  const topBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="bg-[#f8f6f3]">
      {/* Hero - Sin header ya que está en layout */}
      <section className="relative bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            Encuentra tu auto ideal
          </h1>
          <p className="text-lg md:text-xl text-[#c9a962] mb-8">
            {listings.length.toLocaleString('es-CL')} vehículos disponibles en Chile
          </p>
          <SearchBox brands={brands} />
        </div>
      </section>

      {/* Marcas */}
      {topBrands.length > 0 && (
        <section className="py-12 bg-white border-b border-[#e8e4df]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-[#0f172a] mb-8 text-center">Explora por marca</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topBrands.map(([marca, count]) => (
                <Link
                  key={marca}
                  href={`/autos?brand=${encodeURIComponent(marca)}`}
                  className="p-6 bg-[#f8f6f3] rounded-xl text-center hover:bg-[#0f172a] hover:text-white transition group"
                >
                  <span className="text-3xl mb-2 block group-hover:scale-110 transition">🚗</span>
                  <span className="font-semibold block">{marca}</span>
                  <span className="text-sm text-[#64748b] group-hover:text-[#c9a962]">{count} {count === 1 ? "aviso" : "avisos"}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Destacados */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0f172a]">Destacados</h2>
            <Link href="/autos" className="text-[#1e3a5f] hover:text-[#c9a962] transition font-medium">
              Ver todos →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <p className="text-[#64748b]">No hay autos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featured.map((car) => (
                <Link 
                  key={car.id} 
                  href={`/autos/${car.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition border border-[#e8e4df]"
                >
                  <div className="h-48 bg-gradient-to-br from-[#1e3a5f]/10 to-[#c9a962]/10 flex items-center justify-center relative">
                    <span className="text-6xl opacity-30">🚗</span>
                    <span className="absolute bottom-3 left-3 px-2 py-1 bg-[#0f172a] text-white text-xs rounded">
                      {car.year}
                    </span>
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold text-[#1e3a5f] uppercase">{car.brand}</span>
                    <h3 className="font-bold text-[#0f172a] mb-2 text-lg">{car.model}</h3>
                    <p className="text-sm text-[#64748b] mb-3">{car.km.toLocaleString('es-CL')} km • {car.city}</p>
                    <p className="text-xl font-bold text-[#c9a962]">{formatPrice(car.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Vender */}
      <section className="py-20 bg-gradient-to-r from-[#0f172a] to-[#1e3a5f]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">¿Quieres vender tu vehículo?</h2>
          <p className="text-[#c9a962] text-lg mb-8">Publica gratis y llega a miles de compradores</p>
          <Link href="/publicar" className="px-8 py-4 bg-[#c9a962] text-[#0f172a] rounded-xl font-bold hover:bg-[#d4af37] transition">
            Publicar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
