import Link from "next/link";

import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Pago Pendiente | BuenAuto",
};

export default function PlanesPendientePage() {
  return (
    <main className="py-12">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="h-8 w-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
            Pago pendiente
          </h1>

          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            Tu pago está siendo procesado. Te notificaremos cuando se confirme y tu plan será activado automáticamente.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/cuenta"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-xs font-semibold tracking-[0.18em] uppercase text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Mi cuenta
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
