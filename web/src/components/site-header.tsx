import Link from "next/link";

import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/server/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/60 dark:bg-black/50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-900/10 to-transparent dark:via-white/10" />

      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.22em] uppercase text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-white dark:focus-visible:ring-white/10"
        >
          BuenAuto
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/autos"
            className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
          >
            Buscar
          </Link>
          {user ? (
            <>
              <Link
                href="/mis-avisos"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Mis avisos
              </Link>
              <Link
                href="/favoritos"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Favoritos
              </Link>
              <Link
                href="/cuenta"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Cuenta
              </Link>
            </>
          ) : null}
          <Link
            href="/publicar"
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
          >
            Publicar
          </Link>
          {user ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Salir
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/ingresar"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>

        <details className="relative sm:hidden">
          <summary className="list-none rounded-full border border-zinc-200/70 bg-white/60 p-2 backdrop-blur transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:hover:bg-black/55 dark:focus-visible:ring-white/10 [&::-webkit-details-marker]:hidden">
            <span className="flex h-6 w-6 flex-col justify-center gap-1.5">
              <span className="h-px w-full bg-zinc-900 dark:bg-white" />
              <span className="h-px w-full bg-zinc-900 dark:bg-white" />
            </span>
          </summary>

          <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/90 p-1 shadow-xl shadow-zinc-900/10 backdrop-blur dark:border-zinc-800/70 dark:bg-black/80 dark:shadow-black/40">
            <Link
              href="/autos"
              className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Buscar
            </Link>
            <Link
              href="/planes"
              className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-amber-700/90 hover:bg-amber-100/60 hover:text-amber-800 dark:text-amber-400/90 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
            >
              Planes
            </Link>

            {user ? (
              <>
                <Link
                  href="/mis-avisos"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Mis avisos
                </Link>
                <Link
                  href="/favoritos"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Favoritos
                </Link>
                <Link
                  href="/cuenta"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Cuenta
                </Link>
              </>
            ) : null}

            <div className="my-1 h-px bg-zinc-200/70 dark:bg-zinc-800/70" />

            <Link
              href="/publicar"
              className="block rounded-xl bg-zinc-900 px-3 py-2 text-center text-xs font-semibold tracking-[0.18em] uppercase text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Publicar
            </Link>

            {user ? (
              <form action="/api/auth/logout" method="post" className="mt-1">
                <button
                  type="submit"
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Salir
                </button>
              </form>
            ) : (
              <div className="mt-1 grid gap-1">
                <Link
                  href="/ingresar"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="block rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/90 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/90 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </details>
      </Container>
    </header>
  );
}
