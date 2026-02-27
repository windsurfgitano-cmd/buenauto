import Link from "next/link";
import { redirect } from "next/navigation";

import { RevealAnimations } from "@/components/animations/reveal-animations";
import { DeleteListingButton } from "@/components/listings/delete-listing-button";
import { PayListingButton } from "@/components/listings/pay-listing-button";
import { Container } from "@/components/ui/container";
import { formatCLP } from "@/lib/format";
import { getCurrentUser } from "@/lib/server/session";
import { getListingsByOwner } from "@/lib/server/listings-store";
import { redirectTypeFromPayParam } from "@/lib/pay-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MisAvisosPage({
  searchParams,
}: {
  searchParams?: Promise<{ pay?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/ingresar?next=/mis-avisos");
  }

  const listings = await getListingsByOwner(user.id);
  const sp = (await searchParams) ?? {};
  const payStatus = redirectTypeFromPayParam(sp.pay);

  return (
    <div id="my-listings">
      <RevealAnimations rootId="my-listings" />
      <Container className="py-12">
        {payStatus ? (
          <div
            data-anim="fade-up"
            className={`${
              payStatus === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-50"
                : payStatus === "pending"
                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-50"
                  : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-50"
            } relative mb-6 rounded-2xl border p-4 text-sm shadow-sm backdrop-blur-xl`}
          >
            {payStatus === "success" && "Pago aprobado, tu aviso debería estar publicado."}
            {payStatus === "pending" && "Pago pendiente, espera confirmación de MercadoPago."}
            {payStatus === "error" && "No se pudo completar el pago. Intenta nuevamente."}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div data-anim="fade-up">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Mis avisos
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Administra tus publicaciones y edítalas cuando lo necesites.
            </p>
          </div>
          <Link
            href="/publicar"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
          >
            Publicar nuevo
          </Link>
        </div>

      {listings.length === 0 ? (
        <div
          data-anim="fade-up"
          className="relative mt-8 rounded-2xl border border-zinc-200/60 bg-white/60 p-8 text-center shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
        >
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            Aún no has publicado avisos.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Publica tu auto para que aparezca en el marketplace.
          </p>
          <Link
            href="/publicar"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
          >
            Publicar aviso
          </Link>
        </div>
      ) : (
        <div data-anim-stagger className="mt-6 grid gap-4">
          {listings.map((l) => {
            const statusLabel =
              l.status === "pending_payment"
                ? "Pendiente de pago"
                : l.status === "draft"
                  ? "Borrador"
                  : l.status === "expired"
                    ? "Vencido"
                    : "Publicado";

            const statusColor =
              l.status === "published"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-50"
                : l.status === "pending_payment"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-50"
                  : l.status === "expired"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-50"
                    : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800/60 dark:text-white";

            const needsPayment = l.status === "pending_payment" || l.status === "draft";

            return (
            <div
              key={l.id}
              data-anim-item
              className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/autos/${l.id}`}
                    className="block truncate text-base font-semibold text-zinc-900 decoration-zinc-900/30 underline-offset-4 hover:underline dark:text-white dark:decoration-white/30"
                  >
                    {l.brand} {l.model}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-300">
                    <span className={`inline-flex rounded-full px-2 py-1 ${statusColor}`}>
                      {statusLabel}
                    </span>
                    {l.expiresAt ? (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Expira {new Date(l.expiresAt).toLocaleDateString("es-CL")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {l.year} · {l.km.toLocaleString("es-CL")} km
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {l.city ? `${l.city}, ` : ""}
                    {l.region}
                  </p>
                  <p className="mt-2 text-base font-semibold tabular-nums text-zinc-900 dark:text-white">
                    {formatCLP(l.price)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  {needsPayment ? (
                    <PayListingButton
                      listingId={l.id}
                      defaultInvoiceEmail={l.invoiceEmail}
                      defaultInvoiceRUT={l.invoiceRUT}
                    />
                  ) : null}
                  <Link
                    href={`/mis-avisos/${l.id}/editar`}
                    className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    Editar
                  </Link>
                  <DeleteListingButton listingId={l.id} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
      </Container>
    </div>
  );
}
