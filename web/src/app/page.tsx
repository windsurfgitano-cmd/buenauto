import Image from "next/image";
import Link from "next/link";
import {
  getFeaturedListings,
  getTopBrands,
  getPublicListingsCount,
} from "@/lib/server/listings-store";
import { getCatalogBrands } from "@/lib/server/catalog";
import { SearchBox } from "@/components/search/search-box";
import type { Listing } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("es-CL");
}

export default async function Home() {
  let featured: Listing[] = [];
  let brands: string[] = [];
  let topBrands: Array<[string, number]> = [];
  let total = 0;

  try {
    // Agregaciones en SQL: no se cargan los avisos completos en memoria.
    [featured, topBrands, total, brands] = await Promise.all([
      getFeaturedListings(12),
      getTopBrands(4),
      getPublicListingsCount(),
      getCatalogBrands(),
    ]);
  } catch (e) {
    console.error("Error loading home data:", e);
  }

  return (
    <div className="bg-[#f8f6f3]">
      {/* Hero - Sin header ya que está en layout */}
      <section className="relative overflow-hidden bg-[#0f172a] py-16 lg:py-24">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-bg.jpg"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/70 via-[#0f172a]/40 to-[#0f172a]/85" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 drop-shadow-lg">
            Encuentra tu auto ideal
          </h1>
          <p className="text-lg md:text-xl text-[#c9a962] mb-8 drop-shadow">
            {total.toLocaleString('es-CL')} vehículos disponibles en Chile
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
              {topBrands.map(([marca, count], i) => (
                <Link
                  key={marca}
                  href={`/autos?brand=${encodeURIComponent(marca)}`}
                  className="group relative overflow-hidden rounded-xl bg-[#0f172a] text-white"
                >
                  <Image
                    src={`/brand-${i + 1}.jpg`}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover opacity-40 transition duration-300 group-hover:opacity-60 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-transparent" />
                  <div className="relative flex flex-col items-center justify-center p-6 text-center min-h-[130px]">
                    <span className="font-bold text-lg block drop-shadow">{marca}</span>
                    <span className="text-sm text-[#c9a962] drop-shadow">{count} {count === 1 ? "aviso" : "avisos"}</span>
                  </div>
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
                  <div className="h-48 bg-gradient-to-br from-[#1e3a5f]/10 to-[#c9a962]/10 relative overflow-hidden">
                    <Image
                      src={car.images?.[0] ?? "/car-placeholder.svg"}
                      alt={`${car.brand} ${car.model}`}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
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
      <section className="relative overflow-hidden bg-[#0f172a] py-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/cta-bg.jpg"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
        >
          <source src="/cta-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#1e3a5f]/85" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">¿Quieres vender tu vehículo?</h2>
          <p className="text-[#c9a962] text-lg mb-8">Publica y llega a miles de compradores</p>
          <Link href="/publicar" className="inline-block px-8 py-4 bg-[#c9a962] text-[#0f172a] rounded-xl font-bold hover:bg-[#d4af37] transition shadow-lg shadow-black/30">
            Publicar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
