"use client";

import { useEffect, useId, useState } from "react";

import { CHILE_REGIONS } from "@/lib/regions";
import { YEARS_2000_2025 } from "@/lib/years";

type Values = {
  q?: string;
  brand?: string;
  model?: string;
  region?: string;
  minYear?: string;
  maxYear?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

type Props = {
  brands: string[];
  models?: string[];
  values?: Values;
  showAdvanced?: boolean;
  action?: string;
};

type CatalogModelsResponse = {
  brand?: string;
  models?: string[];
};

export function SearchForm({
  brands,
  models,
  values,
  showAdvanced = true,
  action = "/autos",
}: Props) {
  const [brand, setBrand] = useState(values?.brand ?? "");
  const [model, setModel] = useState(values?.model ?? "");
  const [modelOptions, setModelOptions] = useState<string[]>(
    models && models.length > 0 ? models : [],
  );
  const [modelsLoading, setModelsLoading] = useState(false);
  const modelsListId = useId();

  useEffect(() => {
    setBrand(values?.brand ?? "");
    setModel(values?.model ?? "");
    setModelOptions(models && models.length > 0 ? models : []);
  }, [models, values?.brand, values?.model]);

  useEffect(() => {
    let active = true;

    async function loadModels(selectedBrand: string) {
      if (!selectedBrand) {
        setModelOptions([]);
        setModelsLoading(false);
        return;
      }

      if (selectedBrand === (values?.brand ?? "") && models && models.length > 0) {
        setModelOptions(models);
        setModelsLoading(false);
        return;
      }

      setModelsLoading(true);

      try {
        const res = await fetch(
          `/api/catalog?brand=${encodeURIComponent(selectedBrand)}`,
        );
        const data = (await res.json()) as CatalogModelsResponse;

        if (!active) return;

        if (res.ok && Array.isArray(data.models)) {
          setModelOptions(data.models);
        } else {
          setModelOptions([]);
        }
      } catch {
        if (!active) return;
        setModelOptions([]);
      } finally {
        if (!active) return;
        setModelsLoading(false);
      }
    }

    loadModels(brand);

    return () => {
      active = false;
    };
  }, [brand, models, values?.brand]);

  return (
    <form
      action={action}
      method="get"
      className="rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md focus-within:ring-4 focus-within:ring-zinc-900/10 dark:border-zinc-800/60 dark:bg-black/30 dark:focus-within:ring-white/10"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Búsqueda
          </span>
          <input
            name="q"
            defaultValue={values?.q ?? ""}
            placeholder="Ej: Corolla 2017"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Marca
          </span>
          <select
            name="brand"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setModel("");
              setModelOptions([]);
            }}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          >
            <option value="">Todas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Modelo
          </span>
          <input
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!brand || modelsLoading}
            list={modelsListId}
            placeholder={
              !brand
                ? "Selecciona marca"
                : modelsLoading
                  ? "Cargando..."
                  : "Todos"
            }
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 disabled:opacity-70 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
          <datalist id={modelsListId}>
            {modelOptions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Región
          </span>
          <select
            name="region"
            defaultValue={values?.region ?? ""}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          >
            <option value="">Todas</option>
            {CHILE_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {showAdvanced ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                Año mín.
              </span>
              <select
                name="minYear"
                defaultValue={values?.minYear ?? ""}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
              >
                <option value="">Cualquiera</option>
                {YEARS_2000_2025.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                Año máx.
              </span>
              <select
                name="maxYear"
                defaultValue={values?.maxYear ?? ""}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
              >
                <option value="">Cualquiera</option>
                {YEARS_2000_2025.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                Precio mín.
              </span>
              <input
                name="minPrice"
                defaultValue={values?.minPrice ?? ""}
                placeholder="Ej: 5000000"
                inputMode="numeric"
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                Precio máx.
              </span>
              <input
                name="maxPrice"
                defaultValue={values?.maxPrice ?? ""}
                placeholder="Ej: 12000000"
                inputMode="numeric"
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-1 lg:col-span-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                Ordenar
              </span>
              <select
                name="sort"
                defaultValue={values?.sort ?? "newest"}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="year_desc">Año: más nuevo</option>
                <option value="km_asc">Km: menor a mayor</option>
                <option value="km_desc">Km: mayor a menor</option>
              </select>
            </label>
          </>
        ) : null}

        <div className="flex items-end lg:col-span-2">
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
