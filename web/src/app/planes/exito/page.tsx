import Link from "next/link";

import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Pago Exitoso | BuenAuto",
};

type Props = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function PlanesExitoPage({ searchParams }: Props) {
  const { plan } = await searchParams;

  return (
    <main className="py-12">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
            ¡Pago exitoso!
          </h1>

          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            Tu suscripción{plan ? ` al plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : ""} ha sido activada correctamente.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/mis-avisos"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-xs font-semibold tracking-[0.18em] uppercase text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Mis avisos
            </Link>
            <Link
              href="/publicar"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Publicar aviso
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
