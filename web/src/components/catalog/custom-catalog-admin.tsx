"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CustomCatalog = {
  brands: Record<string, string[]>;
};

type Props = {
  initialCatalog: CustomCatalog;
};

type CatalogResponse = { catalog: CustomCatalog } | { error: string };

export function CustomCatalogAdmin({ initialCatalog }: Props) {
  const router = useRouter();

  const [catalog, setCatalog] = useState<CustomCatalog>(initialCatalog);
  const [brand, setBrand] = useState("");
  const [modelsText, setModelsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandOptions = useMemo(() => {
    return Object.keys(catalog.brands).sort((a, b) => a.localeCompare(b, "es"));
  }, [catalog]);

  const canAdd = brand.trim().length > 0 && modelsText.trim().length > 0;

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/catalog/custom", { method: "GET" });
      const data = (await res.json().catch(() => null)) as CatalogResponse | null;

      if (!res.ok) {
        setError(data && "error" in data ? data.error : "No se pudo cargar");
        return;
      }

      if (data && "catalog" in data) {
        setCatalog(data.catalog);
      }
    } catch {
      setError("No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }

  async function addModels() {
    if (!canAdd || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/catalog/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand, models: modelsText }),
      });

      const data = (await res.json().catch(() => null)) as CatalogResponse | null;

      if (!res.ok) {
        setError(data && "error" in data ? data.error : "No se pudo guardar");
        return;
      }

      if (data && "catalog" in data) {
        setCatalog(data.catalog);
        setModelsText("");
        router.refresh();
      }
    } catch {
      setError("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  async function removeModel(selectedBrand: string, model: string) {
    if (loading) return;

    const ok = window.confirm(`¿Eliminar el modelo ${model} de ${selectedBrand}?`);
    if (!ok) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/catalog/custom", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand: selectedBrand, model }),
      });

      const data = (await res.json().catch(() => null)) as CatalogResponse | null;

      if (!res.ok) {
        setError(data && "error" in data ? data.error : "No se pudo guardar");
        return;
      }

      if (data && "catalog" in data) {
        setCatalog(data.catalog);
        router.refresh();
      }
    } catch {
      setError("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  async function removeBrand(selectedBrand: string) {
    if (loading) return;

    const ok = window.confirm(`¿Eliminar la marca ${selectedBrand} del catálogo manual?`);
    if (!ok) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/catalog/custom", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand: selectedBrand }),
      });

      const data = (await res.json().catch(() => null)) as CatalogResponse | null;

      if (!res.ok) {
        setError(data && "error" in data ? data.error : "No se pudo guardar");
        return;
      }

      if (data && "catalog" in data) {
        setCatalog(data.catalog);
        router.refresh();
      }
    } catch {
      setError("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md focus-within:ring-4 focus-within:ring-zinc-900/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:focus-within:ring-white/10 dark:before:via-white/10">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          Agregar marca / modelos
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Esto alimenta las sugerencias de marca y modelo (no crea avisos).
        </p>

        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Marca
            </span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej: TOYOTA"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Modelos (uno por línea o separado por coma)
            </span>
            <textarea
              value={modelsText}
              onChange={(e) => setModelsText(e.target.value)}
              placeholder="Ej:\nCorolla\nYaris\nRAV4"
              className="min-h-[120px] resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={addModels}
            disabled={!canAdd || loading}
            className="h-11 w-full rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Guardando..." : "Agregar"}
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55"
          >
            Actualizar
          </button>
        </div>
      </section>

      <section className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          Catálogo manual actual
        </h2>

        {brandOptions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Aún no hay marcas en el catálogo manual.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {brandOptions.map((b) => (
              <div
                key={b}
                className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 dark:border-zinc-800/70 dark:bg-black/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {b}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                      {(catalog.brands[b] ?? []).length} modelos
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBrand(b)}
                    disabled={loading}
                    className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Eliminar marca
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(catalog.brands[b] ?? []).map((m) => (
                    <span
                      key={`${b}-${m}`}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-xs text-zinc-900 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white"
                    >
                      <span className="max-w-[180px] truncate">{m}</span>
                      <button
                        type="button"
                        onClick={() => removeModel(b, m)}
                        disabled={loading}
                        className="rounded-full px-2 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
                        aria-label={`Eliminar ${m}`}
                        title="Eliminar"
                      >
                        X
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
