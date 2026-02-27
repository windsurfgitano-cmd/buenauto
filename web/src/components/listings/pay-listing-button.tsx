"use client";

import { useState } from "react";

type Props = {
  listingId: string;
  defaultInvoiceEmail?: string;
  defaultInvoiceRUT?: string;
};

export function PayListingButton({ listingId, defaultInvoiceEmail, defaultInvoiceRUT }: Props) {
  const [invoiceEmail, setInvoiceEmail] = useState(defaultInvoiceEmail ?? "");
  const [invoiceRUT, setInvoiceRUT] = useState(defaultInvoiceRUT ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPay() {
    if (loading) return;

    if (!invoiceEmail.trim() || !invoiceRUT.trim()) {
      setError("Ingresa email y RUT para la boleta");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceEmail, invoiceRUT }),
      });

      const data = (await res.json()) as { initPoint?: string; error?: string };

      if (!res.ok || !data.initPoint) {
        setError(data.error ?? "No se pudo iniciar el pago");
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setError("No se pudo iniciar el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm dark:border-zinc-800/60 dark:bg-black/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          value={invoiceEmail}
          onChange={(e) => setInvoiceEmail(e.target.value)}
          placeholder="Email para boleta"
          className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-700 dark:bg-black dark:text-white"
        />
        <input
          value={invoiceRUT}
          onChange={(e) => setInvoiceRUT(e.target.value)}
          placeholder="RUT para boleta"
          className="h-10 w-full flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-700 dark:bg-black dark:text-white"
        />
        <button
          type="button"
          onClick={onPay}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creando pago..." : "Pagar y publicar"}
        </button>
      </div>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
        Se cobra CLP $5.000 y el aviso se publica por 30 días al aprobar el pago.
      </p>
    </div>
  );
}
