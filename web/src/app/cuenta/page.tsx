import Link from "next/link";
import { redirect } from "next/navigation";

import { RevealAnimations } from "@/components/animations/reveal-animations";
import { AccountForm } from "@/components/account/account-form";
import { Container } from "@/components/ui/container";
import { getListingsByOwner } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCatalogAdmin(email: string) {
  const raw = process.env.CATALOG_ADMIN_EMAILS;
  if (!raw) return process.env.NODE_ENV !== "production";

  const normalized = email.trim().toLowerCase();
  const allowed = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return process.env.NODE_ENV !== "production";
  return allowed.includes(normalized);
}

export default async function CuentaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/ingresar?next=/cuenta");
  }

  const listings = await getListingsByOwner(user.id);
  const canManageCatalog = isCatalogAdmin(user.email);

  return (
    <div id="account">
      <RevealAnimations rootId="account" />
      <Container className="py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div data-anim="fade-up">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Cuenta
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Gestiona tu perfil, seguridad y accesos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mis-avisos"
              className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Mis avisos ({listings.length})
            </Link>
            {canManageCatalog ? (
              <Link
                href="/cuenta/catalogo"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Catálogo
              </Link>
            ) : null}
            <Link
              href="/favoritos"
              className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Favoritos ({user.favorites.length})
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        <div data-anim="fade-up" className="mt-8 max-w-2xl">
          <AccountForm
            user={{
              id: user.id,
              email: user.email,
              name: user.name,
            }}
          />
        </div>
      </Container>
    </div>
  );
}
