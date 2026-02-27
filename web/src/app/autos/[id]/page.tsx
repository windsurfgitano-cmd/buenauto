import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { RevealAnimations } from "@/components/animations/reveal-animations";
import { FavoriteToggleButton } from "@/components/favorites/favorite-toggle-button";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingShareButton } from "@/components/listings/listing-share-button";
import { ListingStickyCta } from "@/components/listings/listing-sticky-cta";
import { BoostListingButton } from "@/components/plans/boost-listing-button";
import { PayListingButton } from "@/components/listings/pay-listing-button";
import { Container } from "@/components/ui/container";
import { formatCLP } from "@/lib/format";
import { getListingById } from "@/lib/server/listings-store";
import { getCurrentUser } from "@/lib/server/session";
import { getActiveBoost, getUserCredits } from "@/lib/server/subscriptions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toMetaDescription(text: string, maxLen = 170) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLen - 1))}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: "Aviso no encontrado | BuenAuto",
      description: "El aviso no existe o fue eliminado.",
    };
  }

  const title = `${listing.brand} ${listing.model}`;
  const fullTitle = `${title} ${listing.year} | BuenAuto`;

  const image = listing.images?.[0] ?? "/car-placeholder.svg";
  const fallbackDescription = `${title} ${listing.year} · ${formatCLP(listing.price)} · ${listing.region}`;

  const description = toMetaDescription(
    listing.description?.trim() ? listing.description : fallbackDescription,
  );

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: `/autos/${listing.id}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      url: `/autos/${listing.id}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const listing = await getListingById(id);

  const user = await getCurrentUser();
  const isOwner = Boolean(user && listing?.ownerId && listing.ownerId === user.id);
  const initialFavorited = Boolean(user && user.favorites.includes(id));
  const loginHref = `/ingresar?next=${encodeURIComponent(`/autos/${id}`)}`;

  const activeBoost = await getActiveBoost(id);
  const userCredits = user ? await getUserCredits(user.id) : 0;

  if (!listing) {
    notFound();
  }

  const title = `${listing.brand} ${listing.model}`;

  const phoneDigits = listing.contactPhone
    ? listing.contactPhone.replace(/\D/g, "")
    : "";

  const waPhone = phoneDigits
    ? phoneDigits.startsWith("56")
      ? phoneDigits
      : `56${phoneDigits}`
    : "";

  const waHref = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
        `Hola, vi tu aviso de ${title} en BuenAuto. ¿Sigue disponible?`,
      )}`
    : "";

  const created =
    sp.created === "1" ||
    (Array.isArray(sp.created) && sp.created[0] === "1");

  const referer = (await headers()).get("referer");
  let backHref = "/autos";

  if (referer) {
    try {
      const url = new URL(referer);
      if (url.pathname.startsWith("/autos")) {
        backHref = `${url.pathname}${url.search}`;
      }
    } catch {
      backHref = "/autos";
    }
  }

  return (
    <div id="listing">
      <RevealAnimations rootId="listing" />
      <Container className="pt-12 pb-28 sm:py-12">
        <Link
          href={backHref}
          className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-200/80 dark:hover:text-white dark:focus-visible:ring-white/10"
        >
          ← Volver a resultados
        </Link>

        {created ? (
          <div
            data-anim="fade-up"
            className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            <p className="text-sm font-semibold">Aviso publicado</p>
            <p className="mt-1 text-sm opacity-90">
              Tu aviso ya está disponible. Se guardó localmente en este MVP.
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <div data-anim="fade-up">
            <ListingGallery title={title} images={listing.images} />
          </div>

          <div data-anim="fade-up">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">
              {formatCLP(listing.price)}
            </p>
            {isOwner ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-300">
                <span
                  className={`inline-flex rounded-full px-2 py-1 ${
                    listing.status === "published"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-50"
                      : listing.status === "pending_payment"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-50"
                        : listing.status === "expired"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-50"
                          : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800/60 dark:text-white"
                  }`}
                >
                  {listing.status === "pending_payment"
                    ? "Pendiente de pago"
                    : listing.status === "draft"
                      ? "Borrador"
                      : listing.status === "expired"
                        ? "Vencido"
                        : "Publicado"}
                </span>
                {listing.expiresAt ? (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Expira {new Date(listing.expiresAt).toLocaleDateString("es-CL")}
                  </span>
                ) : null}
              </div>
            ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <FavoriteToggleButton
              listingId={listing.id}
              initialFavorited={initialFavorited}
              isLoggedIn={Boolean(user)}
              loginHref={loginHref}
            />
            <ListingShareButton title={title} />
            {isOwner ? (
              <>
                {(listing.status === "draft" || listing.status === "pending_payment") && (
                  <PayListingButton
                    listingId={listing.id}
                    defaultInvoiceEmail={listing.invoiceEmail}
                    defaultInvoiceRUT={listing.invoiceRUT}
                  />
                )}
                <BoostListingButton
                  listingId={listing.id}
                  isOwner={isOwner}
                  isBoosted={Boolean(activeBoost)}
                  userCredits={userCredits}
                />
                <Link
                  href={`/mis-avisos/${listing.id}/editar`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
                >
                  Editar
                </Link>
              </>
            ) : null}
          </div>

            <div data-anim-stagger className="mt-6 grid grid-cols-2 gap-3">
              <div
                data-anim-item
                className="relative rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Año
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                {listing.year}
              </p>
              </div>

              <div
                data-anim-item
                className="relative rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Kilometraje
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                {listing.km.toLocaleString("es-CL")} km
              </p>
              </div>

              <div
                data-anim-item
                className="relative rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Transmisión
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                {listing.transmission}
              </p>
              </div>

              <div
                data-anim-item
                className="relative rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Combustible
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                {listing.fuel}
              </p>
              </div>

              <div
                data-anim-item
                className="relative col-span-2 rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Ubicación
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                {listing.city ? `${listing.city}, ` : ""}
                {listing.region}
              </p>
              </div>
          </div>

            {listing.description ? (
              <div
                data-anim="fade-up"
                className="relative mt-6 rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Descripción
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-200">
                  {listing.description}
                </p>
              </div>
            ) : null}

            <div
              data-anim="fade-up"
              className="relative mt-6 rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
            >
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Contacto
              </h2>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                {listing.contactName?.trim() || "Vendedor"}
              </p>

              {listing.contactPhone ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`tel:${listing.contactPhone}`}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
                  >
                    Llamar {listing.contactPhone}
                  </a>
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Este aviso no incluye teléfono.
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>

      <ListingStickyCta
        title={title}
        phone={listing.contactPhone}
        whatsappHref={waHref || undefined}
      />
    </div>
  );
}
