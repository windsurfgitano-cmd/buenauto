"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BOOSTS, type BoostType } from "@/lib/plans";

type Props = {
  listingId: string;
  isOwner: boolean;
  isBoosted: boolean;
  userCredits: number;
};

export function BoostListingButton({ listingId, isOwner, isBoosted, userCredits }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  if (!isOwner) return null;

  if (isBoosted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Aviso destacado
      </div>
    );
  }

  async function handleBoost(boostType: BoostType, useCredit: boolean) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, boostType, useCredit }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar");
      }

      if (data.usedCredit) {
        router.refresh();
        setShowOptions(false);
        return;
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-amber-800 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Destacar
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="font-medium text-zinc-900 dark:text-white">Elige una opción</h4>

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <div className="mt-4 space-y-3">
            {userCredits > 0 && (
              <button
                type="button"
                onClick={() => handleBoost("7days", true)}
                disabled={loading}
                className="flex w-full items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-left transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Usar crédito
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    7 días de destacado
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {userCredits} disponible{userCredits !== 1 ? "s" : ""}
                </span>
              </button>
            )}

            {Object.values(BOOSTS).map((boost) => (
              <button
                key={boost.id}
                type="button"
                onClick={() => handleBoost(boost.id, false)}
                disabled={loading}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {boost.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {boost.description}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                  ${boost.price.toLocaleString("es-CL")}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowOptions(false)}
            className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
