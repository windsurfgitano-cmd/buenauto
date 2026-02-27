"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Pack } from "@/lib/plans";

type Props = {
  pack: Pack;
  isLoggedIn: boolean;
};

export function PackCard({ pack, isLoggedIn }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBuy() {
    if (!isLoggedIn) {
      router.push("/ingresar?next=/planes");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar");
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white/60 p-6 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-white">{pack.name}</h3>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {pack.savings}
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {pack.boostCredits} créditos para destacar tus avisos cuando quieras
        </p>
      </div>

      <div className="mt-auto mb-4">
        <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
          ${pack.price.toLocaleString("es-CL")}
        </span>
        <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">
          (${Math.round(pack.price / pack.boostCredits).toLocaleString("es-CL")} c/u)
        </span>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-500">{error}</p>
      )}

      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold tracking-[0.18em] uppercase text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {loading ? "Procesando..." : "Comprar pack"}
      </button>
    </div>
  );
}
