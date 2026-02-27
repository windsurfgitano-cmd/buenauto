import Image from "next/image";
import Link from "next/link";

import { formatCLP } from "@/lib/format";
import type { Listing } from "@/lib/types";

type Props = {
  listing: Listing;
};

export function ListingCard({ listing }: Props) {
  const imageSrc = listing.images?.[0] ?? "/car-placeholder.svg";
  const title = `${listing.brand} ${listing.model}`;

  return (
    <Link
      href={`/autos/${listing.id}`}
      data-anim-item
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-zinc-950 dark:focus-visible:ring-white/10 dark:before:via-white/10"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-zinc-900 decoration-zinc-900/30 underline-offset-4 transition-colors group-hover:underline dark:text-white dark:decoration-white/30">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {listing.year} · {listing.km.toLocaleString("es-CL")} km
            </p>
            <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
              {listing.city ? `${listing.city}, ` : ""}
              {listing.region}
            </p>
          </div>
          <p className="shrink-0 text-base font-semibold tabular-nums text-zinc-900 dark:text-white">
            {formatCLP(listing.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
