import Link from "next/link";
import { notFound } from "next/navigation";

import { getListingById, isListingPublic } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";
import { pointsBalance } from "@/lib/turbo/points-store";
import { CotizarClient } from "@/components/turbo/cotizar-client";

export const dynamic = "force-dynamic";

export default async function CotizarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing || !isListingPublic(listing)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="turbo-scope fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-carbon px-6 text-center">
        <h1 className="text-2xl font-extrabold text-paper">Ingresa para cotizar</h1>
        <p className="max-w-sm text-mutedwhite">
          Necesitas una cuenta para simular tu crédito, canjear puntos y enviar tu cotización.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={`/ingresar?next=/cotizar/${id}`}
            className="rounded-xl bg-racing px-6 py-3.5 font-extrabold text-white hover:bg-racing-bright"
          >
            Ingresar
          </Link>
          <Link href="/registro" className="rounded-xl border border-edge px-6 py-3.5 font-bold text-paper hover:border-mutedwhite">
            Crear cuenta
          </Link>
        </div>
        <Link href={`/autos/${id}`} className="mt-2 text-sm text-mutedwhite hover:text-paper">
          ← Volver a la ficha
        </Link>
      </div>
    );
  }

  const points = await pointsBalance(user.id);

  return (
    <CotizarClient
      listing={listing}
      initialPoints={points}
      prefill={{ name: user.name ?? "", email: user.email }}
    />
  );
}
