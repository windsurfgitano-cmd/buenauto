import Link from "next/link";

import { HomeAnimations } from "@/components/home/home-animations";
import { HomeHero3D } from "@/components/home/home-hero-3d";
import { ListingCard } from "@/components/listings/listing-card";
import { Container } from "@/components/ui/container";
import { getCatalogBrands } from "@/lib/server/catalog";
import { getListings } from "@/lib/server/listings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const [brands, listings] = await Promise.all([getCatalogBrands(), getListings()]);
  const featured = listings.slice(0, 6);

  return (
    <div id="home">
      <HomeAnimations />
      <HomeHero3D brands={brands} />

      <section className="relative">
        <Container className="py-12">
          <div className="flex items-end justify-between gap-4">
            <div data-anim="fade-up">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Avisos destacados
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Los más recientes en BuenAuto
              </p>
            </div>
            <Link
              href="/autos"
              className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:text-white"
            >
              Ver todos →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-zinc-200/60 bg-white/60 p-8 text-center shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-black/30">
              <p className="text-base font-semibold text-zinc-900 dark:text-white">
                Aún no hay avisos.
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Publica el primero y comienza a recibir contactos.
              </p>
              <Link
                href="/publicar"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
              >
                Publicar aviso
              </Link>
            </div>
          ) : (
            <div
              data-anim-stagger
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            <div
              data-anim="fade-up"
              className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10 lg:col-span-5"
            >
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                Cómo funciona
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Un flujo simple para vender y comprar.
              </p>

              <div className="mt-5 grid gap-3">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-black">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Publica tu aviso
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Marca, modelo, año, precio y región. Listo.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-black">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Llega a compradores
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Los interesados ven tu aviso y te contactan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-black">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Administra y mejora
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Edita, elimina y guarda favoritos en un click.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/publicar"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
                >
                  Publicar ahora
                </Link>
                <Link
                  href="/autos"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
                >
                  Explorar
                </Link>
              </div>
            </div>

            <div data-anim-stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              <div
                data-anim-item
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Búsqueda simple
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Filtros por marca, modelo, región, año y precio.
                </p>
              </div>

              <div
                data-anim-item
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Favoritos
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Guarda avisos y vuelve cuando estés listo.
                </p>
              </div>

              <div
                data-anim-item
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Mis avisos (CRUD)
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Edita y elimina publicaciones, todo con autorización.
                </p>
              </div>

              <div
                data-anim-item
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Catálogo Chile 2000–2025
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Marcas y modelos desde tu CSV para evitar errores.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative border-t border-zinc-200/60 bg-white/30 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-black/20">
        <Container className="py-10">
          <div
            data-anim="fade-up"
            className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10 sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  ¿Listo para vender?
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Publica tu auto y administra todo desde tu cuenta.
                </p>
              </div>
              <Link
                href="/publicar"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
              >
                Publicar mi auto
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
