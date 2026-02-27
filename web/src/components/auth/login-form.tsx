"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type LoginResponse =
  | {
      user: {
        id: string;
        email: string;
        name?: string;
      };
    }
  | { error: string };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/mis-avisos";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim() && password);
  }, [email, password]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await res.json()) as LoginResponse;

      if (!res.ok) {
        setError("error" in data ? data.error : "No se pudo ingresar");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("No se pudo ingresar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md focus-within:ring-4 focus-within:ring-zinc-900/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:focus-within:ring-white/10 dark:before:via-white/10"
    >
      <div className="grid gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Email
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Contraseña
          </span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
        className="mt-5 h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {submitting ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-300">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-zinc-900 underline underline-offset-4 hover:no-underline dark:text-white"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
