import Link from "next/link";
import { redirect } from "next/navigation";

import { RevealAnimations } from "@/components/animations/reveal-animations";
import { ListingCard } from "@/components/listings/listing-card";
import { Container } from "@/components/ui/container";
import { getListingsByIds } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FavoritosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/ingresar?next=/favoritos");
  }

  // Solo trae los avisos favoritados, no todo el catálogo.
  const favorites = await getListingsByIds(user.favorites);

  return (
    <div id="favorites">
      <RevealAnimations rootId="favorites" />
      <Container className="py-12">
        <div data-anim="fade-up">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Favoritos
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Avisos que guardaste para revisarlos después.
          </p>
        </div>

      {favorites.length === 0 ? (
        <div
          data-anim="fade-up"
          className="relative mt-8 rounded-2xl border border-zinc-200/60 bg-white/60 p-8 text-center shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
        >
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            Aún no tienes favoritos.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Explora avisos y presiona “Guardar”.
          </p>
          <Link
            href="/autos"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
          >
            Ver avisos
          </Link>
        </div>
      ) : (
        <div data-anim-stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      </Container>
    </div>
  );
}
