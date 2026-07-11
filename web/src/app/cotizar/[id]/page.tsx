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

  // Cotizar es público: un invitado puede simular y enviar (sin puntos).
  const user = await getCurrentUser();
  const points = user ? await pointsBalance(user.id) : 0;

  return (
    <CotizarClient
      listing={listing}
      initialPoints={points}
      prefill={{ name: user?.name ?? "", email: user?.email ?? "" }}
    />
  );
}
