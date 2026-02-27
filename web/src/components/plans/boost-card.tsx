import type { Boost } from "@/lib/plans";

type Props = {
  boost: Boost;
};

export function BoostCard({ boost }: Props) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white/60 p-6 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="h-4 w-4 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </span>
          <h3 className="font-semibold text-zinc-900 dark:text-white">{boost.name}</h3>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {boost.description}
        </p>
      </div>

      <div className="mt-auto">
        <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
          ${boost.price.toLocaleString("es-CL")}
        </span>
        <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">
          por {boost.durationDays} días
        </span>
      </div>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Activa el destacado desde la página de tu aviso publicado
      </p>
    </div>
  );
}
