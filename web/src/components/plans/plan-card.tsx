"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Plan } from "@/lib/plans";

type Props = {
  plan: Plan;
  isCurrentPlan: boolean;
  isLoggedIn: boolean;
};

export function PlanCard({ plan, isCurrentPlan, isLoggedIn }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFree = plan.price === 0;

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/ingresar?next=/planes");
      return;
    }

    if (isFree || isCurrentPlan) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
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
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition ${
        plan.highlighted
          ? "border-zinc-900 bg-zinc-900 text-white shadow-xl dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200/60 bg-white/60 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40"
      }`}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-zinc-900">
          Más popular
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <div className="mt-2">
          {isFree ? (
            <span className="text-3xl font-bold">Gratis</span>
          ) : (
            <>
              <span className="text-3xl font-bold tabular-nums">
                ${plan.price.toLocaleString("es-CL")}
              </span>
              <span className="text-sm opacity-70">/mes</span>
            </>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <svg
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                plan.highlighted
                  ? "text-amber-400 dark:text-amber-500"
                  : "text-emerald-500"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className={plan.highlighted ? "opacity-90" : "text-zinc-600 dark:text-zinc-300"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mb-3 text-sm text-red-500">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading || isCurrentPlan}
        className={`inline-flex h-11 w-full items-center justify-center rounded-xl text-xs font-semibold tracking-[0.18em] uppercase transition disabled:opacity-50 ${
          plan.highlighted
            ? "bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            : isCurrentPlan
              ? "border border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        }`}
      >
        {loading ? (
          "Procesando..."
        ) : isCurrentPlan ? (
          "Plan actual"
        ) : isFree ? (
          "Plan básico"
        ) : (
          "Suscribirse"
        )}
      </button>
    </div>
  );
}
