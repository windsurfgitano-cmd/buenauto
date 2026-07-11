import type { CapacitorConfig } from "@capacitor/cli";

// La app envuelve la web con Capacitor y carga la URL EN VIVO de producción,
// así se "autoactualiza": cada deploy en Netlify se ve al instante en el APK,
// sin reinstalar. Solo hay que recompilar el APK al cambiar algo nativo (AdMob).
//
// La URL se resuelve así (primera que exista gana):
//   1. process.env.CAP_SERVER_URL      → la usa el CI de GitHub Actions
//   2. process.env.NEXT_PUBLIC_SITE_URL → si la exportás en tu shell
//   3. el placeholder de abajo          → EDITALO con tu dominio para builds locales
//
// PARA ANDROID STUDIO (build local): reemplazá el placeholder por tu URL de
// producción (ej. "https://buenauto.netlify.app") y corré `npm run cap:sync`.
const SERVER_URL =
  process.env.CAP_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://REEMPLAZAR-POR-TU-URL.netlify.app";

const config: CapacitorConfig = {
  appId: "cl.buenauto.app",
  appName: "BuenAuto",
  webDir: "native/www", // solo pantalla de respaldo offline
  server: {
    url: SERVER_URL,
    androidScheme: "https",
    // La app solo carga esta URL de producción por https.
  },
  android: {
    // Permite que el WebView abra la web en vivo.
    allowMixedContent: false,
  },
};

export default config;
