import Image from "next/image";
import Link from "next/link";

import { RevealAnimations } from "@/components/animations/reveal-animations";
import { ListingCard } from "@/components/listings/listing-card";
import { SearchForm } from "@/components/search/search-form";
import { Container } from "@/components/ui/container";
import { formatCLP } from "@/lib/format";
import {
  getCatalogBrands,
  getCatalogModelsByBrand,
} from "@/lib/server/catalog";
import { searchListings } from "@/lib/server/listings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Autos usados y nuevos en Chile",
  description:
    "Busca entre cientos de autos en venta en todo Chile: filtra por marca, modelo, año, precio y región. Fotos reales y contacto directo con el vendedor.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function buildQuery(sp: SearchParams, overrides: Record<string, string | undefined>) {
  const qp = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value[0] !== undefined) qp.set(key, value[0]);
      continue;
    }
    qp.set(key, value);
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      qp.delete(key);
      continue;
    }
    qp.set(key, value);
  }

  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

export default async function AutosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  const q = first(sp.q);
  const brand = first(sp.brand);
  const model = first(sp.model);
  const region = first(sp.region);

  const minYearRaw = first(sp.minYear);
  const maxYearRaw = first(sp.maxYear);
  const minPriceRaw = first(sp.minPrice);
  const maxPriceRaw = first(sp.maxPrice);

  const minYear = toNumber(minYearRaw);
  const maxYear = toNumber(maxYearRaw);
  const minPrice = toNumber(minPriceRaw);
  const maxPrice = toNumber(maxPriceRaw);

  const sort = first(sp.sort);

  const page = Math.max(1, toNumber(first(sp.page)) ?? 1);
  const pageSize = 24;

  const [brands, models, result] = await Promise.all([
    getCatalogBrands(),
    brand ? getCatalogModelsByBrand(brand) : Promise.resolve(undefined),
    searchListings({
      q,
      brand,
      model,
      region,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      sort:
        (sort as
          | "newest"
          | "price_asc"
          | "price_desc"
          | "year_desc"
          | "km_asc"
          | "km_desc"
          | undefined) ?? undefined,
      page,
      pageSize,
    }),
  ]);

  const total = result.total;
  const totalPages = result.totalPages;
  const safePage = result.page;
  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(total, safePage * pageSize);
  const pageItems = result.items;

  const values = {
    q: q ?? "",
    brand: brand ?? "",
    model: model ?? "",
    region: region ?? "",
    minYear: minYearRaw ?? "",
    maxYear: maxYearRaw ?? "",
    minPrice: minPriceRaw ?? "",
    maxPrice: maxPriceRaw ?? "",
    sort: sort ?? "newest",
  };

  const sortLabel =
    sort === "price_asc"
      ? "Precio: menor a mayor"
      : sort === "price_desc"
        ? "Precio: mayor a menor"
        : sort === "year_desc"
          ? "Año: más nuevo"
          : sort === "km_asc"
            ? "Km: menor a mayor"
            : sort === "km_desc"
              ? "Km: mayor a menor"
              : null;

  const activeFilters = [
    q
      ? { key: "q", label: `Búsqueda: ${q}`, overrides: { q: undefined, page: undefined } }
      : null,
    brand
      ? {
          key: "brand",
          label: `Marca: ${brand}`,
          overrides: { brand: undefined, model: undefined, page: undefined },
        }
      : null,
    model
      ? {
          key: "model",
          label: `Modelo: ${model}`,
          overrides: { model: undefined, page: undefined },
        }
      : null,
    region
      ? {
          key: "region",
          label: `Región: ${region}`,
          overrides: { region: undefined, page: undefined },
        }
      : null,
    minYearRaw
      ? {
          key: "minYear",
          label: `Año mín: ${minYearRaw}`,
          overrides: { minYear: undefined, page: undefined },
        }
      : null,
    maxYearRaw
      ? {
          key: "maxYear",
          label: `Año máx: ${maxYearRaw}`,
          overrides: { maxYear: undefined, page: undefined },
        }
      : null,
    minPriceRaw
      ? {
          key: "minPrice",
          label: `Precio mín: ${minPrice !== undefined ? formatCLP(minPrice) : minPriceRaw}`,
          overrides: { minPrice: undefined, page: undefined },
        }
      : null,
    maxPriceRaw
      ? {
          key: "maxPrice",
          label: `Precio máx: ${maxPrice !== undefined ? formatCLP(maxPrice) : maxPriceRaw}`,
          overrides: { maxPrice: undefined, page: undefined },
        }
      : null,
    sort && sort !== "newest" && sortLabel
      ? {
          key: "sort",
          label: `Orden: ${sortLabel}`,
          overrides: { sort: undefined, page: undefined },
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    overrides: Record<string, string | undefined>;
  }>;

  return (
    <div id="autos">
      <RevealAnimations rootId="autos" />
      <section className="relative overflow-hidden bg-[#0f172a]">
        <Image
          src="/autos-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/85" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-lg">
            Autos en venta
          </h1>
          <p className="mt-1 text-sm text-zinc-200 drop-shadow">
            Filtra por marca, modelo, año, precio y región.
          </p>
        </div>
      </section>
      <Container className="py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div data-anim="fade-up">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {total} resultados
              {total > 0 ? ` · Mostrando ${startIndex}–${endIndex}` : ""}
            </p>
          </div>
          {activeFilters.length > 0 ? (
            <Link
              href="/autos"
              className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:text-white"
            >
              Limpiar filtros
            </Link>
          ) : null}
        </div>

      {activeFilters.length > 0 ? (
        <div data-anim="fade-up" className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Link
              key={filter.key}
              href={`/autos${buildQuery(sp, filter.overrides)}`}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200/70 bg-white/60 px-3 text-xs font-semibold tracking-[0.06em] text-zinc-900 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] dark:border-zinc-800/70 dark:bg-black/30 dark:text-white dark:hover:bg-black/55"
            >
              <span>{filter.label}</span>
              <span className="text-zinc-500 dark:text-zinc-400">×</span>
            </Link>
          ))}
        </div>
      ) : null}

        <div data-anim="fade-up" className="mt-6">
          <SearchForm
            key={JSON.stringify(values)}
            brands={brands}
            models={models}
            values={values}
          />
        </div>

      {pageItems.length === 0 ? (
        <div
          data-anim="fade-up"
          className="relative mt-10 rounded-2xl border border-zinc-200/60 bg-white/60 p-8 text-center shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
        >
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            No encontramos autos con esos filtros.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Prueba con menos filtros o cambia la búsqueda.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/autos"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55"
            >
              Limpiar filtros
            </Link>
            <Link
              href="/publicar"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Publicar aviso
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div
            data-anim-stagger
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pageItems.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <div data-anim="fade-up" className="mt-8 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-600/80 dark:text-zinc-300/80">
              Página {safePage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              {safePage > 1 ? (
                <Link
                  href={`/autos${buildQuery(sp, { page: String(safePage - 1) })}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55"
                >
                  ← Anterior
                </Link>
              ) : null}

              {safePage < totalPages ? (
                <Link
                  href={`/autos${buildQuery(sp, { page: String(safePage + 1) })}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Siguiente →
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}
      </Container>
    </div>
  );
}
