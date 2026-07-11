import type { CapacitorConfig } from "@capacitor/cli";

// La app envuelve la web con Capacitor y carga la URL EN VIVO de producción,
// así se "autoactualiza": cada deploy en Netlify se ve al instante en el APK,
// sin reinstalar. Solo hay que recompilar el APK al cambiar algo nativo (AdMob).
//
// La URL se inyecta en build desde la variable de entorno CAP_SERVER_URL
// (el workflow de GitHub Actions la toma de la variable de repo PROD_URL).
// Cambiá el placeholder de abajo por tu dominio si vas a compilar localmente.
const SERVER_URL = process.env.CAP_SERVER_URL || "https://REEMPLAZAR-POR-TU-URL.netlify.app";

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
