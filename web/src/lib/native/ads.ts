import type { AdMobBannerSize } from "@capacitor-community/admob";

// IDs de PRUEBA de Google (Android). Reemplazar por los reales de AdMob.
const TEST_BANNER = "ca-app-pub-3940256099942544/6300978111";
const TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";
const TEST_REWARDED = "ca-app-pub-3940256099942544/5224354917";

// Cada cuántos swipes se muestra un intersticial (bajá/subí a gusto).
const INTERSTITIAL_EVERY = 6;

type AdMobPlugin = (typeof import("@capacitor-community/admob"))["AdMob"];

let plugin: AdMobPlugin | null = null;
let interstitialReady = false;
let swipeCount = 0;
let rewardedReady = false;
let rewardUserId: string | null = null;

/** True si estamos dentro de la app nativa (Capacitor), false en el navegador. */
export async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function loadInterstitial() {
  if (!plugin) return;
  try {
    await plugin.prepareInterstitial({ adId: TEST_INTERSTITIAL, isTesting: true });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
}

async function loadRewarded() {
  if (!plugin || !rewardUserId) return;
  try {
    await plugin.prepareRewardVideoAd({
      adId: TEST_REWARDED,
      isTesting: true,
      // userId para SSV (verificación server-side de Google) cuando se active.
      // Hoy el award lo hace /api/turbo/reward con la sesión.
      ssv: { userId: rewardUserId },
    });
    rewardedReady = true;
  } catch {
    rewardedReady = false;
  }
}

// Inicializa AdMob SOLO dentro de la app nativa (Capacitor). En el navegador web
// no hace nada. Muestra el banner y precarga el intersticial. Publica la altura
// real del banner como CSS var --admob-bottom para que el feed no lo tape.
export async function initAds(): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const mod = await import("@capacitor-community/admob");
    const {
      AdMob,
      BannerAdSize,
      BannerAdPosition,
      BannerAdPluginEvents,
      InterstitialAdPluginEvents,
    } = mod;
    plugin = AdMob;

    await AdMob.initialize({ initializeForTesting: true });

    // El feed usa var(--admob-bottom) para dejar espacio y no quedar tapado.
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
      const h = size && size.height ? size.height : 0;
      document.documentElement.style.setProperty("--admob-bottom", `${h}px`);
    });

    await AdMob.showBanner({
      adId: TEST_BANNER,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: true,
    });

    // Al cerrar un intersticial, precargamos el siguiente.
    await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      interstitialReady = false;
      void loadInterstitial();
    });
    await loadInterstitial();

    // Si el feed ya pidió habilitar rewarded, precargamos uno.
    if (rewardUserId) void loadRewarded();
  } catch (err) {
    // Nunca romper la app por un fallo de anuncios.
    console.warn("[AdMob] no se pudo inicializar:", err);
  }
}

// Llamar en cada swipe del feed: muestra un intersticial cada N swipes si hay uno
// cargado. No-op en web o si aún no está listo.
export function notifySwipe(): void {
  if (!plugin) return;
  swipeCount += 1;
  if (swipeCount % INTERSTITIAL_EVERY !== 0) return;
  if (!interstitialReady) return;
  interstitialReady = false;
  plugin.showInterstitial().catch(() => {
    void loadInterstitial();
  });
}

// Habilita los rewarded para un usuario logueado (los puntos van a su cuenta).
// Precarga un anuncio si el plugin ya está listo; si no, initAds lo hará.
export function enableRewarded(userId: string): void {
  rewardUserId = userId;
  if (plugin) void loadRewarded();
}

export type RewardResult =
  | { ok: true; awarded: boolean; points: number; balance: number; remaining: number }
  | { ok: false; error: "solo-app" | "no-listo" | "cerrado" | "server" };

// Muestra un rewarded y, al completarse, OTORGA los puntos en el servidor
// (/api/turbo/reward, que usa la sesión + tope diario). Devuelve el nuevo saldo.
export async function showRewardedForPoints(): Promise<RewardResult> {
  if (!plugin) return { ok: false, error: "solo-app" };
  if (!rewardedReady) return { ok: false, error: "no-listo" };

  rewardedReady = false;
  try {
    // Resuelve con el item de recompensa cuando el usuario completa el anuncio.
    await plugin.showRewardVideoAd();
  } catch {
    void loadRewarded(); // cerrado antes de terminar → no hay premio
    return { ok: false, error: "cerrado" };
  }

  void loadRewarded(); // precargar el siguiente

  try {
    const txId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${rewardUserId}-${swipeCount}-${performance.now()}`;
    const res = await fetch("/api/turbo/reward", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ txId }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: "server" };
    return {
      ok: true,
      awarded: !!data.awarded,
      points: data.points ?? 0,
      balance: data.balance ?? 0,
      remaining: data.remaining ?? 0,
    };
  } catch {
    return { ok: false, error: "server" };
  }
}
