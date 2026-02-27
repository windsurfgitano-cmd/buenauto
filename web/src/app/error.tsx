'use client';

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-red-600">Error en la aplicación</h1>
      <p className="mt-4 text-slate-700 dark:text-slate-300">
        {error?.message || "Error desconocido"}
      </p>
      {error?.digest && (
        <p className="mt-2 text-xs text-slate-500">Digest: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        >
          Reintentar
        </button>
        <Link
          href="/autos"
          className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
        >
          Ir a Autos
        </Link>
      </div>
    </div>
  );
}
