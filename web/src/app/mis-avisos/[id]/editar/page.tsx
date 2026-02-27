import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EditListingForm } from "@/components/publish/edit-listing-form";
import { Container } from "@/components/ui/container";
import { getCatalogBrands } from "@/lib/server/catalog";
import { getListingById } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditarAvisoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/ingresar?next=${encodeURIComponent(`/mis-avisos/${id}/editar`)}`);
  }

  const listing = await getListingById(id);
  if (!listing) {
    notFound();
  }

  if (!listing.ownerId || listing.ownerId !== user.id) {
    notFound();
  }

  const brands = await getCatalogBrands();

  return (
    <Container className="py-12">
      <Link
        href="/mis-avisos"
        className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:text-white dark:focus-visible:ring-white/10"
      >
        ← Volver a mis avisos
      </Link>

      <div className="mt-5 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Editar aviso
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Actualiza los datos de tu publicación.
        </p>

        <div className="mt-8">
          <EditListingForm listing={listing} brands={brands} />
        </div>
      </div>
    </Container>
  );
}
