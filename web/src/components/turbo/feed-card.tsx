"use client";

import Link from "next/link";

import { formatCLP } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { CarCarousel } from "./car-carousel";

function km(n: number) {
  return `${Math.round(n).toLocaleString("es-CL")} km`;
}

function SpecChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

function RailButton({
  label,
  emoji,
  onClick,
  active,
  disabled,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group flex flex-col items-center gap-1 disabled:opacity-60"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl backdrop-blur-md transition-transform active:scale-90 ${
          active ? "border-racing bg-racing/25" : "border-white/25 bg-black/35 group-hover:border-white/50"
        }`}
      >
        {emoji}
      </span>
      <span className="text-[11px] font-semibold text-white drop-shadow">{label}</span>
    </button>
  );
}

export function FeedCard({
  listing,
  liked,
  onLike,
  onPass,
  onShare,
  onQuote,
  flash,
  busy,
}: {
  listing: Listing;
  liked: boolean;
  onLike: () => void;
  onPass: () => void;
  onShare: () => void;
  onQuote: () => void;
  flash?: boolean;
  busy?: boolean;
}) {
  const place = listing.city || listing.region || "Chile";

  return (
    <div className="relative h-dvh w-full snap-start snap-always overflow-hidden bg-carbon">
      <CarCarousel
        images={listing.images}
        alt={`${listing.brand} ${listing.model}`}
        className="absolute inset-0 h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-ping text-8xl">❤️</span>
        </div>
      )}

      {/* Rail de acciones */}
      <div className="absolute bottom-44 right-3 z-10 flex flex-col items-center gap-4">
        <RailButton label="Me gusta" emoji="❤️" onClick={onLike} active={liked} disabled={busy} />
        <RailButton label="Paso" emoji="💔" onClick={onPass} disabled={busy} />
        <RailButton label="Compartir" emoji="📤" onClick={onShare} />
      </div>

      {/* Info inferior. El padding extra deja lugar al banner de AdMob dentro de
          la app nativa (var --admob-bottom = altura real del banner; 0 en web). */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 px-4"
        style={{ paddingBottom: "calc(1.5rem + var(--admob-bottom, 0px))" }}
      >
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-racing-bright">
          {listing.brand} · {listing.year} · {listing.transmission || "—"}
        </p>
        <h2 className="mt-0.5 text-2xl font-extrabold leading-tight text-white">{listing.model}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <SpecChip>{km(listing.km)}</SpecChip>
          {listing.fuel ? <SpecChip>{listing.fuel}</SpecChip> : null}
          <SpecChip>📍 {place}</SpecChip>
        </div>
        <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-white">
          {formatCLP(listing.price)}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onQuote}
            className="flex-1 rounded-xl bg-racing py-3.5 text-center text-base font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(225,6,0,0.7)] transition-colors hover:bg-racing-bright active:translate-y-[1px]"
          >
            Cotizar →
          </button>
          <Link
            href={`/autos/${listing.id}`}
            className="rounded-xl border border-white/25 bg-black/30 px-4 py-3.5 text-center text-base font-bold text-white backdrop-blur transition-colors hover:border-white/50"
            title="Ver todos los detalles en la plataforma completa"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </div>
  );
}
