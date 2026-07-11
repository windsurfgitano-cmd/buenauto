import Link from "next/link";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/server/session";
import { getFeedListings } from "@/lib/turbo/feed-store";
import { pointsBalance } from "@/lib/turbo/points-store";
import { FeedClient } from "@/components/turbo/feed-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Descubre autos deslizando",
  description: "El feed de autos con onda TikTok: desliza, dale me gusta y cotiza.",
};

export default async function DescubrePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="turbo-scope fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-carbon px-6 text-center">
        <Link href="/" className="inline-flex items-center text-2xl font-extrabold tracking-tight text-white">
          <span aria-hidden className="mr-2 inline-block h-[0.85em] w-[5px] -skew-x-12 bg-racing" />
          TURBO<span className="text-racing">.cl</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-paper">
          Descubre tu auto <span className="text-racing">deslizando</span>
        </h1>
        <p className="max-w-sm text-mutedwhite">
          Ingresa para explorar el feed, dar me gusta y ganar puntos que canjeas al cotizar.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/ingresar?next=/descubre"
            className="rounded-xl bg-racing px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-racing-bright"
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="rounded-xl border border-edge px-6 py-3.5 text-base font-bold text-paper transition-colors hover:border-mutedwhite"
          >
            Crear cuenta
          </Link>
        </div>
        <Link href="/" className="mt-2 text-sm text-mutedwhite hover:text-paper">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const [listings, points] = await Promise.all([
    getFeedListings({ id: user.id, favorites: user.favorites }),
    pointsBalance(user.id),
  ]);

  return <FeedClient initialListings={listings} initialPoints={points} />;
}
