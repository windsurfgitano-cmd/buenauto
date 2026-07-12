"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatCLP } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { showRewardedAd } from "@/lib/native/ads";
import { clampDown, computeMonthly, RATE_MONTHLY, TERMS, totalCost } from "@/lib/turbo/finance";
import { POINTS, REWARDS, rewardById } from "@/lib/turbo/points";

// Contenido del cotizador (simulador + canje de puntos + contacto + éxito).
// Se reutiliza en dos contextos:
//   - variant="page"  → página /cotizar/[id] (deep-link, compartir, SEO).
//   - variant="sheet" → bottom-sheet dentro del feed TURBO (resolver sin salir).
export function QuotePanel({
  listing,
  initialPoints,
  prefill,
  variant,
  canWatchAd = false,
  onClose,
  onPointsChange,
}: {
  listing: Listing;
  initialPoints: number;
  prefill: { name: string; email: string };
  variant: "page" | "sheet";
  /** True en la app nativa con sesión: permite desbloquear beneficios con un anuncio. */
  canWatchAd?: boolean;
  /** Cierra el sheet (solo variant="sheet"). */
  onClose?: () => void;
  /** Notifica el nuevo saldo de puntos para sincronizar badges externos. */
  onPointsChange?: (balance: number) => void;
}) {
  const [points, setPoints] = useState(initialPoints);
  const [down, setDown] = useState(Math.round(listing.price * 0.2));
  const [term, setTerm] = useState(36);
  const [rewardId, setRewardId] = useState<string | null>(null);
  // Beneficio desbloqueado mirando un anuncio (no gasta puntos).
  const [adUnlocked, setAdUnlocked] = useState<string | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const [contact, setContact] = useState({ name: prefill.name, phone: "", email: prefill.email });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ monthly: number; benefit: string | null } | null>(null);

  async function unlockViaAd(id: string) {
    if (adBusy) return;
    setAdBusy(true);
    setError(null);
    try {
      const ok = await showRewardedAd();
      if (ok) {
        setRewardId(id);
        setAdUnlocked(id);
      } else {
        setError("Mirá el anuncio completo para desbloquear el beneficio");
      }
    } finally {
      setAdBusy(false);
    }
  }

  const reward = rewardById(rewardId);
  const rate = RATE_MONTHLY + (reward?.rateDelta ?? 0);
  const clampedDown = clampDown(listing.price, down);
  const minDown = Math.round(listing.price * 0.1);

  const monthly = useMemo(
    () => computeMonthly(listing.price, clampedDown, term, rate),
    [listing.price, clampedDown, term, rate],
  );
  const baseMonthly = useMemo(
    () => computeMonthly(listing.price, clampedDown, term, RATE_MONTHLY),
    [listing.price, clampedDown, term],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/turbo/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          downPayment: clampedDown,
          termMonths: term,
          rewardId,
          viaAd: adUnlocked !== null && adUnlocked === rewardId,
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cotizar");
        setLoading(false);
        return;
      }
      if (typeof data.balance === "number") {
        setPoints(data.balance);
        onPointsChange?.(data.balance);
      }
      setDone({ monthly: data.monthly, benefit: data.benefit });
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <span className="text-6xl">🏁</span>
        <h1 className="mt-4 text-3xl font-extrabold text-paper">¡Cotización enviada!</h1>
        <p className="mt-2 text-mutedwhite">
          {listing.contactName || "El vendedor"} recibió tu solicitud por el {listing.brand}{" "}
          {listing.model}. Te contactarán muy pronto.
        </p>
        <div className="mt-6 rounded-2xl border border-edge bg-carbon-2 p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-mutedwhite">Cuota estimada</p>
          <p className="mt-1 font-mono text-4xl font-bold text-paper">
            {formatCLP(done.monthly)}
            <span className="text-lg text-mutedwhite">/mes</span>
          </p>
          {done.benefit && (
            <p className="mt-3 inline-block rounded-full bg-racing/15 px-3 py-1 text-sm font-semibold text-racing-bright">
              ✓ Beneficio aplicado: {done.benefit}
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {variant === "sheet" ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-racing px-5 py-3 font-bold text-white hover:bg-racing-bright"
            >
              Seguir deslizando 🔥
            </button>
          ) : (
            <Link href="/" className="rounded-xl bg-racing px-5 py-3 font-bold text-white hover:bg-racing-bright">
              Seguir explorando
            </Link>
          )}
          <Link
            href="/favoritos"
            className="rounded-xl border border-edge px-5 py-3 font-bold text-paper hover:border-mutedwhite"
          >
            Mis favoritos
          </Link>
        </div>
      </div>
    );
  }

  const control =
    "w-full rounded-lg border border-edge bg-carbon-2 px-3.5 py-2.5 text-paper placeholder:text-mutedwhite/70 focus:border-racing focus:outline-none focus:ring-2 focus:ring-racing/30";

  return (
    <div className="mx-auto max-w-2xl">
      {/* Resumen del auto */}
      <div className="flex items-center gap-4 rounded-2xl border border-edge bg-carbon-2 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.images[0] ?? "/car-placeholder.svg"}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-racing-bright">
            {listing.brand} · {listing.year}
          </p>
          <h1 className="text-xl font-extrabold text-paper">{listing.model}</h1>
          <p className="font-mono text-lg font-bold text-paper">{formatCLP(listing.price)}</p>
        </div>
      </div>

      {/* Simulador */}
      <section className="mt-6 rounded-2xl border border-edge bg-carbon-2 p-5">
        <h2 className="text-lg font-extrabold text-paper">Simula tu crédito</h2>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-paper">Pie</span>
            <span className="font-mono font-bold text-paper">{formatCLP(clampedDown)}</span>
          </div>
          <input
            type="range"
            min={minDown}
            max={listing.price}
            step={100000}
            value={clampedDown}
            onChange={(e) => setDown(Number(e.target.value))}
            className="mt-2 w-full accent-racing"
          />
          <p className="mt-1 text-xs text-mutedwhite">Mínimo 10% ({formatCLP(minDown)})</p>
        </div>

        <div className="mt-5">
          <span className="text-sm font-semibold text-paper">Plazo</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                className={`rounded-lg border px-4 py-2 font-mono text-sm font-bold transition-colors ${
                  term === t ? "border-racing bg-racing/15 text-racing-bright" : "border-edge text-mutedwhite hover:border-mutedwhite"
                }`}
              >
                {t} meses
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-carbon-3 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-mutedwhite">Cuota mensual estimada</p>
          <p className="mt-1 font-mono text-4xl font-bold text-paper">
            {formatCLP(monthly)}
            <span className="text-lg text-mutedwhite">/mes</span>
          </p>
          {reward && monthly < baseMonthly && (
            <p className="mt-1 font-mono text-sm text-racing-bright">
              Ahorras {formatCLP(baseMonthly - monthly)}/mes con tu beneficio
            </p>
          )}
          <p className="mt-2 text-xs text-mutedwhite">
            Costo total aprox. {formatCLP(totalCost(monthly, term, clampedDown))} · tasa referencial, sujeta a evaluación.
          </p>
        </div>
      </section>

      {/* Canje de puntos */}
      <section className="mt-6 rounded-2xl border border-edge bg-carbon-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-paper">Canjea tus puntos 🔥</h2>
          <span className="font-mono text-sm font-bold text-racing-bright">{points} pts</span>
        </div>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              setRewardId(null);
              setAdUnlocked(null);
            }}
            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
              rewardId === null ? "border-racing bg-racing/10" : "border-edge hover:border-mutedwhite"
            }`}
          >
            <span className="font-semibold text-paper">Sin beneficio</span>
            <span className="text-sm text-mutedwhite">Guardar mis puntos</span>
          </button>
          {REWARDS.map((r) => {
            const affordable = points >= r.cost;
            const unlockedByAd = adUnlocked === r.id;
            const selected = rewardId === r.id;
            return (
              <div
                key={r.id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  selected ? "border-racing bg-racing/10" : "border-edge"
                }`}
              >
                <button
                  type="button"
                  disabled={!affordable && !unlockedByAd}
                  onClick={() => {
                    setRewardId(r.id);
                    setAdUnlocked(null);
                  }}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors disabled:opacity-45"
                >
                  <span>
                    <span className="block font-semibold text-paper">{r.label}</span>
                    <span className="block text-sm text-mutedwhite">{r.desc}</span>
                  </span>
                  <span className="ml-3 shrink-0 rounded-full bg-carbon-3 px-3 py-1 font-mono text-sm font-bold text-racing-bright">
                    {r.cost} pts
                  </span>
                </button>

                {canWatchAd &&
                  (unlockedByAd ? (
                    <div className="border-t border-racing/30 bg-racing/5 px-3 py-2 text-sm font-semibold text-racing-bright">
                      ✓ Desbloqueado con un anuncio · gratis
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={adBusy}
                      onClick={() => unlockViaAd(r.id)}
                      className="w-full border-t border-edge px-3 py-2 text-left text-sm font-semibold text-paper transition-colors hover:bg-carbon-3 disabled:opacity-50"
                    >
                      🎬 {adBusy ? "Cargando anuncio…" : "Desbloquealo gratis mirando un anuncio"}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contacto */}
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-edge bg-carbon-2 p-5">
        <h2 className="text-lg font-extrabold text-paper">Tus datos de contacto</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-paper">Nombre</span>
            <input
              className={control}
              value={contact.name}
              onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-paper">Teléfono</span>
              <input
                className={control}
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                placeholder="+56 9 ..."
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-paper">Email</span>
              <input
                type="email"
                className={control}
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                required
              />
            </label>
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-racing-bright">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-racing py-3.5 text-base font-extrabold text-white transition-colors hover:bg-racing-bright active:translate-y-[1px] disabled:opacity-50"
        >
          {loading ? "Enviando…" : `Enviar cotización · gana +${POINTS.quote} pts`}
        </button>
        <p className="mt-2 text-center text-xs text-mutedwhite">
          Al enviar, {listing.contactName || "el vendedor"} recibe tu solicitud y te contacta directamente.
        </p>
      </form>
    </div>
  );
}
