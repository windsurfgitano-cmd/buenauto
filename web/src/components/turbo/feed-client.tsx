"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FeedItem } from "@/lib/turbo/feed-store";
import { POINTS } from "@/lib/turbo/points";
import {
  enableRewarded,
  isNativeApp,
  notifySwipe,
  showRewardedForPoints,
} from "@/lib/native/ads";
import { CotizarSheet } from "./cotizar-sheet";
import { FeedCard } from "./feed-card";
import { PointsBadge } from "./points-badge";
import { SwipeCoach } from "./swipe-coach";

export function FeedClient({
  initialListings,
  initialPoints,
  isLoggedIn,
  userId,
  prefill,
}: {
  initialListings: FeedItem[];
  initialPoints: number;
  isLoggedIn: boolean;
  userId: string | null;
  prefill: { name: string; email: string };
}) {
  const listings = initialListings;
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const viewed = useRef<Set<string>>(new Set());
  const [points, setPoints] = useState(initialPoints);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const l of initialListings) m[l.id] = l.liked;
    return m;
  });
  const [flashId, setFlashId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Cotización dentro del feed (bottom-sheet). null = cerrado.
  const [quoteFor, setQuoteFor] = useState<FeedItem | null>(null);
  // Rewarded ads (solo dentro de la app nativa y con sesión).
  const [isNative, setIsNative] = useState(false);
  const [rewardBusy, setRewardBusy] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }, []);

  // Dentro de la app nativa y con sesión: habilita los rewarded (precarga uno).
  useEffect(() => {
    let cancelled = false;
    void isNativeApp().then((native) => {
      if (cancelled) return;
      setIsNative(native);
      if (native && isLoggedIn && userId) enableRewarded(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userId]);

  const watchAdForPoints = useCallback(async () => {
    if (rewardBusy) return;
    setRewardBusy(true);
    try {
      const res = await showRewardedForPoints();
      if (res.ok) {
        setPoints(res.balance);
        showToast(
          res.awarded ? `+${res.points} puntos 🔥` : "Ya contabilizamos ese anuncio",
        );
      } else if (res.error === "no-listo") {
        showToast("El anuncio se está cargando, probá en unos segundos");
      } else if (res.error === "cerrado") {
        showToast("Mirá el anuncio completo para ganar puntos");
      } else if (res.error === "server") {
        showToast("No se pudieron sumar los puntos");
      }
    } finally {
      setRewardBusy(false);
    }
  }, [rewardBusy, showToast]);

  const trackView = useCallback(async (id: string) => {
    if (!isLoggedIn) return;
    if (viewed.current.has(id)) return;
    viewed.current.add(id);
    try {
      const res = await fetch("/api/turbo/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "view", listingId: id }),
      });
      const data = await res.json();
      if (res.ok && typeof data.balance === "number") setPoints(data.balance);
    } catch {
      viewed.current.delete(id);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (listings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
            const l = listings[idx];
            if (l) void trackView(l.id);
          }
        }
      },
      { threshold: [0.6] },
    );
    for (const el of cardRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [listings, trackView]);

  const scrollToIndex = useCallback((i: number) => {
    cardRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const swipe = useCallback(
    async (listing: FeedItem, direction: "like" | "pass") => {
      // Anónimo: puede explorar y pasar; el "me gusta" invita a registrarse.
      if (!isLoggedIn) {
        if (direction === "like") {
          window.location.href = "/ingresar?next=/";
          return;
        }
        const i = listings.findIndex((l) => l.id === listing.id);
        if (i >= 0 && i < listings.length - 1) scrollToIndex(i + 1);
        notifySwipe();
        return;
      }
      if (direction === "like") {
        setLikedMap((m) => ({ ...m, [listing.id]: true }));
        setFlashId(listing.id);
        setTimeout(() => setFlashId((f) => (f === listing.id ? null : f)), 700);
      }
      setBusy(true);
      try {
        const res = await fetch("/api/turbo/swipe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ listingId: listing.id, direction }),
        });
        const data = await res.json();
        if (res.ok) {
          if (typeof data.balance === "number") setPoints(data.balance);
          if (direction === "like" && data.awarded) showToast("+5 puntos 🔥 · guardado en favoritos");
        } else {
          showToast(data.error ?? "No se pudo guardar");
        }
      } catch {
        showToast("Error de conexión");
      } finally {
        setBusy(false);
      }
      const idx = listings.findIndex((l) => l.id === listing.id);
      if (idx >= 0 && idx < listings.length - 1) scrollToIndex(idx + 1);
      notifySwipe();
    },
    [isLoggedIn, listings, scrollToIndex, showToast],
  );

  const share = useCallback(
    async (listing: FeedItem) => {
      const url = `${window.location.origin}/autos/${listing.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: `${listing.brand} ${listing.model}`, url });
        } else {
          await navigator.clipboard.writeText(url);
          showToast("Link copiado");
        }
        if (!isLoggedIn) return; // los puntos requieren cuenta
        const res = await fetch("/api/turbo/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "share", listingId: listing.id }),
        });
        const data = await res.json();
        if (res.ok && typeof data.balance === "number") {
          setPoints(data.balance);
          if (data.awarded) showToast("+15 puntos 🔥 · gracias por compartir");
        }
      } catch {
        /* cancelado */
      }
    },
    [isLoggedIn, showToast],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Con el cotizador abierto, el sheet maneja el teclado (Escape, etc.).
      if (quoteFor) return;
      const l = listings[activeIndex];
      if (!l) return;
      if (e.code === "ArrowDown") {
        e.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, listings.length - 1));
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      } else if (e.code === "ArrowRight") {
        void swipe(l, "like");
      } else if (e.code === "ArrowLeft") {
        void swipe(l, "pass");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, listings, swipe, scrollToIndex, quoteFor]);

  if (listings.length === 0) {
    return (
      <div className="turbo-scope fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-carbon px-6 text-center">
        <span className="text-5xl">🏁</span>
        <h1 className="text-xl font-bold text-paper">Ya viste todos los autos</h1>
        <p className="text-mutedwhite">Vuelve pronto, se suman avisos nuevos cada día.</p>
        <Link href="/favoritos" className="mt-2 rounded-xl bg-racing px-5 py-3 font-bold text-white hover:bg-racing-bright">
          Ver mis favoritos
        </Link>
      </div>
    );
  }

  return (
    <div className="turbo-scope fixed inset-0 z-50 bg-carbon">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
        <Link href="/inicio" className="pointer-events-auto inline-flex items-center text-lg font-extrabold tracking-tight text-white" title="Ir al marketplace">
          <span aria-hidden className="mr-2 inline-block h-[0.85em] w-[4px] -skew-x-12 bg-racing" />
          TURBO<span className="text-racing">.cl</span>
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {isNative && (
                <button
                  type="button"
                  onClick={watchAdForPoints}
                  disabled={rewardBusy}
                  className="inline-flex items-center gap-1 rounded-full border border-racing/50 bg-racing/15 px-3 py-1.5 text-sm font-bold text-racing-bright transition-colors hover:bg-racing/25 disabled:opacity-60"
                  title="Mirá un anuncio y ganá puntos TURBO"
                >
                  ▶ Ganá +{POINTS.rewarded}
                </button>
              )}
              <PointsBadge points={points} />
            </>
          ) : (
            <Link
              href="/ingresar?next=/"
              className="rounded-full border border-racing/50 bg-racing/15 px-4 py-1.5 text-sm font-bold text-racing-bright hover:bg-racing/25"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full bg-carbon-2 px-4 py-2 text-sm font-semibold text-paper shadow-lg ring-1 ring-edge">
          {toast}
        </div>
      )}

      <div className="no-scrollbar h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {listings.map((listing, i) => (
          <div
            key={listing.id}
            data-index={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
          >
            <FeedCard
              listing={listing}
              liked={!!likedMap[listing.id]}
              onLike={() => swipe(listing, "like")}
              onPass={() => swipe(listing, "pass")}
              onShare={() => share(listing)}
              onQuote={() => setQuoteFor(listing)}
              flash={flashId === listing.id}
              busy={busy}
            />
          </div>
        ))}

        <div className="flex h-dvh snap-start flex-col items-center justify-center gap-4 bg-carbon px-6 text-center">
          <span className="text-5xl">🏁</span>
          <h2 className="text-2xl font-extrabold text-paper">¡Recorriste todo el garage!</h2>
          <p className="max-w-xs text-mutedwhite">
            {isLoggedIn
              ? "Revisa tus favoritos o cotiza el que más te gustó."
              : "Crea tu cuenta para guardar favoritos y ganar puntos."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href={isLoggedIn ? "/favoritos" : "/registro"}
              className="rounded-xl bg-racing px-5 py-3 font-bold text-white hover:bg-racing-bright"
            >
              {isLoggedIn ? "Mis favoritos" : "Crear cuenta"}
            </Link>
            <button
              onClick={() => scrollToIndex(0)}
              className="rounded-xl border border-edge px-5 py-3 font-bold text-paper hover:border-mutedwhite"
            >
              ↑ Volver arriba
            </button>
          </div>
        </div>
      </div>

      {activeIndex === 0 && !quoteFor && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
          style={{ bottom: "calc(0.5rem + var(--admob-bottom, 0px))" }}
        >
          <span className="animate-bounce font-mono text-xs uppercase tracking-widest text-white/60">
            ↑↓ desliza para cambiar de auto
          </span>
        </div>
      )}

      {!quoteFor && <SwipeCoach />}

      {quoteFor && (
        <CotizarSheet
          listing={quoteFor}
          initialPoints={points}
          prefill={prefill}
          onClose={() => setQuoteFor(null)}
          onPointsChange={setPoints}
        />
      )}
    </div>
  );
}
