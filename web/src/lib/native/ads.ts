import type { AdMobBannerSize } from "@capacitor-community/admob";

// IDs de PRUEBA de Google (Android). Reemplazar por los reales de AdMob.
const TEST_BANNER = "ca-app-pub-3940256099942544/6300978111";
const TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";

// Cada cuántos swipes se muestra un intersticial (bajá/subí a gusto).
const INTERSTITIAL_EVERY = 6;

type AdMobPlugin = (typeof import("@capacitor-community/admob"))["AdMob"];

let plugin: AdMobPlugin | null = null;
let interstitialReady = false;
let swipeCount = 0;

async function loadInterstitial() {
  if (!plugin) return;
  try {
    await plugin.prepareInterstitial({ adId: TEST_INTERSTITIAL, isTesting: true });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
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
