"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { compressImage } from "@/lib/compress-image";
import { formatCLP } from "@/lib/format";
import { CHILE_REGIONS } from "@/lib/regions";
import type { Listing, ListingCreateInput } from "@/lib/types";
import { YEARS_2000_2025 } from "@/lib/years";

type Props = {
  brands: string[];
};

type CatalogModelsResponse = {
  brand?: string;
  models?: string[];
};

type CreateListingResponse =
  | { listing: Listing }
  | { error: string };

export function PublishForm({ brands }: Props) {
  const brandsListId = useId();
  const modelsListId = useId();

  const [brand, setBrand] = useState("");
  const [models, setModels] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [km, setKm] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [transmission, setTransmission] = useState("Manual");
  const [fuel, setFuel] = useState("Bencina");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceRUT, setInvoiceRUT] = useState("");

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_PHOTOS = 6;

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    const incoming = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_PHOTOS - photos.length);

    if (incoming.length === 0) return;

    const compressed = await Promise.all(incoming.map(compressImage));
    setPhotos((prev) => [
      ...prev,
      ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index]?.preview ?? "");
      return prev.filter((_, i) => i !== index);
    });
  }

  useEffect(() => {
    let active = true;

    async function loadModels(nextBrand: string) {
      if (!nextBrand) {
        setModels(null);
        setModelsLoading(false);
        return;
      }

      setModels(null);
      setModelsLoading(true);

      try {
        const res = await fetch(
          `/api/catalog?brand=${encodeURIComponent(nextBrand)}`,
        );
        const data = (await res.json()) as CatalogModelsResponse;

        if (!active) return;

        if (res.ok && Array.isArray(data.models)) {
          setModels(data.models);
        } else {
          setModels(null);
        }
      } catch {
        if (!active) return;
        setModels(null);
      } finally {
        if (!active) return;
        setModelsLoading(false);
      }
    }

    loadModels(brand);

    return () => {
      active = false;
    };
  }, [brand]);

  useEffect(() => {
    setError((prev) => (prev ? null : prev));
  }, [brand, model, year, price, km, region]);

  const canSubmit = useMemo(() => {
    return Boolean(
      brand &&
      model &&
      year &&
      price &&
      km &&
      region &&
      invoiceEmail.trim() &&
      invoiceRUT.trim(),
    );
  }, [brand, model, year, price, km, region, invoiceEmail, invoiceRUT]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit || submitting) return;

    const yearNum = Number(year);
    const priceNum = Number(price);
    const kmNum = Number(km);

    const minYear = 2000;
    const maxYear = 2025;

    if (!Number.isInteger(yearNum) || yearNum < minYear || yearNum > maxYear) {
      setError("Ingresa un año válido");
      return;
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Ingresa un precio válido");
      return;
    }

    if (!Number.isFinite(kmNum) || kmNum < 0) {
      setError("Ingresa un kilometraje válido");
      return;
    }

    setSubmitting(true);
    setError(null);

    const images: string[] = [];

    try {
      for (const photo of photos) {
        const fd = new FormData();
        fd.append("file", photo.file);

        const upRes = await fetch("/api/uploads", { method: "POST", body: fd });
        const upData = (await upRes.json().catch(() => null)) as
          | { url?: string; error?: string }
          | null;

        if (!upRes.ok || !upData?.url) {
          setError(upData?.error ?? "No se pudo subir una de las fotos");
          setSubmitting(false);
          return;
        }

        images.push(upData.url);
      }
    } catch {
      setError("No se pudieron subir las fotos");
      setSubmitting(false);
      return;
    }

    const payload: ListingCreateInput = {
      brand,
      model,
      year: yearNum,
      price: priceNum,
      km: kmNum,
      region,
      city,
      transmission,
      fuel,
      description,
      images,
      contactName,
      contactPhone,
      invoiceEmail,
      invoiceRUT,
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as CreateListingResponse;

      if (!res.ok) {
        setError("error" in data ? data.error : "No se pudo crear el aviso");
        return;
      }

      if (!("listing" in data)) {
        setError("No se pudo crear el aviso");
        return;
      }
      const listingId = data.listing.id;

      const payRes = await fetch(`/api/listings/${listingId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceEmail, invoiceRUT }),
      });

      const payData = (await payRes.json()) as { preferenceId?: string; initPoint?: string; error?: string };

      if (!payRes.ok || !payData.initPoint) {
        setError(payData.error ?? "No se pudo iniciar el pago");
        return;
      }

      window.location.href = payData.initPoint;
    } catch {
      setError("No se pudo crear el aviso");
    } finally {
      setSubmitting(false);
    }
  }

  const modelOptions = models ?? [];

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md focus-within:ring-4 focus-within:ring-zinc-900/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10 dark:focus-within:ring-white/10"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Marca
          </span>
          <input
            required
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setModel("");
            }}
            list={brandsListId}
            placeholder="Ej: TOYOTA"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
          <datalist id={brandsListId}>
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Modelo
          </span>
          <input
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 disabled:opacity-70 dark:border-zinc-800 dark:bg-black dark:text-white"
            disabled={!brand || modelsLoading}
            list={modelsListId}
            placeholder={
              !brand ? "Selecciona marca" : modelsLoading ? "Cargando..." : "Ej: Corolla"
            }
          />
          <datalist id={modelsListId}>
            {modelOptions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Año
          </span>
          <select
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          >
            <option value="">Selecciona</option>
            {YEARS_2000_2025.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Precio (CLP)
          </span>
          <input
            required
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej: 9500000"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
          {price && Number(price) > 0 ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              {formatCLP(Number(price))}
            </p>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Kilometraje
          </span>
          <input
            required
            inputMode="numeric"
            value={km}
            onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej: 78000"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
          {km ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              {Number(km).toLocaleString("es-CL")} km
            </p>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Región
          </span>
          <select
            required
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          >
            <option value="">Selecciona</option>
            {CHILE_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Ciudad (opcional)
          </span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ej: Santiago"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Transmisión
          </span>
          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          >
            <option value="Manual">Manual</option>
            <option value="Automática">Automática</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Combustible
          </span>
          <select
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          >
            <option value="Bencina">Bencina</option>
            <option value="Diésel">Diésel</option>
            <option value="Híbrido">Híbrido</option>
            <option value="Eléctrico">Eléctrico</option>
            <option value="Otro">Otro</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Descripción (opcional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuenta el estado, mantenciones, extras..."
            rows={5}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Nombre de contacto (opcional)
          </span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Ej: Juan"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Teléfono (opcional)
          </span>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Ej: +56 9 1234 5678"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Fotos del vehículo ({photos.length}/{MAX_PHOTOS})
          </span>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, i) => (
              <div key={photo.preview} className="relative h-24 w-32 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={`Foto ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Quitar foto ${i + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS ? (
              <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500">
                <span className="text-2xl leading-none">+</span>
                <span className="text-[11px]">Agregar fotos</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onPickPhotos}
                  className="hidden"
                />
              </label>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            La primera foto será la portada del aviso. Se comprimen automáticamente.
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Email para la boleta
          </span>
          <input
            required
            type="email"
            value={invoiceEmail}
            onChange={(e) => setInvoiceEmail(e.target.value)}
            placeholder="Ej: juan@correo.cl"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            RUT para la boleta
          </span>
          <input
            required
            value={invoiceRUT}
            onChange={(e) => setInvoiceRUT(e.target.value)}
            placeholder="Ej: 12.345.678-9"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-5 h-11 w-full rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {submitting ? "Procesando pago..." : "Pagar y publicar ($5.000)"}
      </button>

      <div className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <p>Los avisos duran 30 días. Se publica al aprobar el pago en MercadoPago.</p>
        <p>Se emitirá boleta con el email y RUT ingresados.</p>
      </div>
    </form>
  );
}
