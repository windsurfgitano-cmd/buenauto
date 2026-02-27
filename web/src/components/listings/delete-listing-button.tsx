"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listingId: string;
};

type DeleteResponse = { ok: true } | { error: string };

export function DeleteListingButton({ listingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (loading) return;

    const ok = window.confirm(
      "¿Eliminar este aviso? Esta acción no se puede deshacer.",
    );
    if (!ok) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => null)) as DeleteResponse | null;

      if (!res.ok) {
        setError(data && "error" in data ? data.error : "No se pudo eliminar");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-red-700 transition active:scale-[0.99] hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
      >
        {loading ? "Eliminando..." : "Eliminar"}
      </button>
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
