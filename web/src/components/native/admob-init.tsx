"use client";

import { useEffect } from "react";

// IDs de PRUEBA de Google (Android). Muestran anuncios de test sin riesgo de
// baneo. Reemplazá por tus ad unit IDs reales de AdMob cuando quieras cobrar.
// (El App ID va en android/app/src/main/AndroidManifest.xml.)
const TEST_BANNER_ANDROID = "ca-app-pub-3940256099942544/6300978111";

// Inicializa AdMob y muestra un banner SOLO dentro de la app nativa (Capacitor).
// En el navegador web `isNativePlatform()` es false y el componente no hace nada,
// así que no afecta a los usuarios de la web. Como vive en la app web desplegada,
// se autoactualiza junto con el resto (la lógica de anuncios se puede tunear sin
// recompilar el APK).
export function AdMobInit() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { AdMob, BannerAdSize, BannerAdPosition } = await import("@capacitor-community/admob");

        await AdMob.initialize({ initializeForTesting: true });
        if (!mounted) return;

        await AdMob.showBanner({
          adId: TEST_BANNER_ANDROID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true,
        });
      } catch (err) {
        // Nunca romper la app por un fallo de anuncios.
        console.warn("[AdMob] no se pudo iniciar el banner:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
