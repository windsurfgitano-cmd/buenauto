"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listingId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  loginHref: string;
};

type ToggleResponse =
  | {
      user: {
        favorites: string[];
      };
    }
  | { error: string };

export function FavoriteToggleButton({
  listingId,
  initialFavorited,
  isLoggedIn,
  loginHref,
}: Props) {
  const router = useRouter();

  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId }),
      });

      const data = (await res.json().catch(() => null)) as ToggleResponse | null;

      if (!res.ok) {
        if (res.status === 401) {
          router.push(loginHref);
          return;
        }

        setError(data && "error" in data ? data.error : "No se pudo guardar");
        return;
      }

      if (!data || !("user" in data) || !Array.isArray(data.user.favorites)) {
        setError("No se pudo guardar");
        return;
      }

      setFavorited(data.user.favorites.includes(listingId));
      router.refresh();
    } catch {
      setError("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={loginHref}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
      >
        Guardar
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        className={
          favorited
            ? "inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
            : "inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
        }
        aria-pressed={favorited}
      >
        {loading ? "Guardando..." : favorited ? "Guardado" : "Guardar"}
      </button>
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
