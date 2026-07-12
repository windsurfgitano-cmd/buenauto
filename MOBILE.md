# App Android (BuenAuto / TURBO)

La app Android es un envoltorio **Capacitor** que carga la web en vivo. Ventaja:
**se autoactualiza sola** — cada deploy en Netlify se ve al instante en la app, sin
reinstalar. Solo hay que recompilar el APK cuando se cambia algo **nativo** (la URL,
AdMob, plugins, ícono o permisos).

El proyecto nativo ya está generado en `web/android/`.

---

## Compilar con Android Studio (recomendado)

### Requisitos (una sola vez)
- **Android Studio** (trae el Android SDK, el JDK y Gradle; no hace falta instalarlos aparte).
- **Node** (ya lo tenés).

### Paso 1 — Poné tu URL de producción
Editá `web/capacitor.config.ts` y reemplazá el placeholder por tu dominio:

```ts
"https://REEMPLAZAR-POR-TU-URL.netlify.app"  // ← tu URL real, ej. https://buenauto.netlify.app
```

### Paso 2 — Sincronizá y abrí Android Studio
```bash
cd web
npm install        # si es la primera vez
npm run android    # sincroniza la URL al proyecto nativo y abre Android Studio
```
(`npm run android` = `cap sync android` + `cap open android`. Si preferís, abrí
Android Studio a mano: **Open** → elegí la carpeta `web/android`.)

### Paso 3 — Compilar / correr
Cuando Android Studio termine de sincronizar Gradle (descarga solo lo que falte):
- **Correr en un teléfono/emulador:** botón **Run ▶** (con el celu en modo desarrollador y USB, o un emulador).
- **Generar el APK:** menú **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
  El archivo queda en:
  ```
  web/android/app/build/outputs/apk/debug/app-debug.apk
  ```
  Ese `.apk` lo instalás en cualquier Android (activá "orígenes desconocidos").

Vas a ver el feed TURBO (la web en vivo) + un **banner de anuncio de prueba** abajo.

---

## Cuándo hay que recompilar el APK

| Cambiás… | ¿Nuevo APK? |
|---|---|
| Contenido/features de la web (feed, cotizador, estilos, lógica de anuncios) | ❌ No — se ve solo al deployar |
| La URL, IDs de AdMob, ícono, permisos, plugins nativos | ✅ Sí — `npm run cap:sync` y recompilás |

> Si cambiás algo nativo, corré `npm run cap:sync` antes de recompilar para que el
> proyecto Android tome los cambios.

---

## AdMob

Hoy usa los **IDs de PRUEBA de Google** (anuncios de test, sin riesgo de baneo).
Formatos activos:
- **Banner** fijo abajo. El feed se ajusta solo a su altura (var `--admob-bottom`),
  así que **no tapa** los botones Cotizar/Ver ficha.
- **Intersticial** (pantalla completa) **cada 6 swipes**.
- **Rewarded** en dos usos: "Ganá +50" en el feed (mirar ad → puntos, award
  server-side) y **canje** en el cotizador ("mirá un anuncio y desbloqueá el
  beneficio gratis, sin gastar puntos"). Ambos solo dentro de la app.
- **Rewarded** (mirar anuncio → ganar puntos TURBO). Botón "▶ Ganá +50" en el
  header del feed (solo en la app, con sesión). Los puntos se otorgan **en el
  servidor** (`/api/turbo/reward`), autenticado + **tope diario** + anti-repetición.

Dónde están los IDs y la config:
- **App ID** (test): `web/android/app/src/main/AndroidManifest.xml` → `ca-app-pub-3940256099942544~3347511713`
- **Ad units** (test) y **frecuencia**: `web/src/lib/native/ads.ts`
  (`TEST_BANNER`, `TEST_INTERSTITIAL`, `TEST_REWARDED`, `INTERSTITIAL_EVERY`).
- **Puntos por rewarded y tope diario**: `web/src/lib/turbo/points.ts`
  (`POINTS.rewarded`, `REWARDED_DAILY_CAP`).

### SSV — rewarded no falsificable (ya implementado)

Hay dos modos para otorgar los puntos del rewarded:

- **Modo cliente** (por defecto, para ads de test): al completar el anuncio, el
  cliente pega a `POST /api/turbo/reward` y el server otorga (autenticado + tope
  diario). Funciona ya, pero un técnico podría falsificarlo (acotado por el tope).
- **Modo SSV** (no falsificable): **solo** el callback firmado de Google otorga.
  El handler `GET /api/turbo/reward` verifica la firma ECDSA de Google contra sus
  claves públicas y recién ahí llama a `addLedger`. Una firma forjada devuelve 403.

**Para activar SSV** (cuando tengas tu cuenta AdMob real):
1. En AdMob → tu **ad unit rewarded** → sección **Server-side verification** →
   poné la callback URL: `https://TU-DOMINIO/api/turbo/reward`
2. Reemplazá `TEST_REWARDED` en `web/src/lib/native/ads.ts` por tu ad unit real.
3. Seteá la env `NEXT_PUBLIC_REWARD_SSV=1` en Netlify (para que el cliente NO
   haga el POST y espere el callback de Google).
4. Deploy. Listo: el award pasa a ser 100% verificado por Google.

> Los IDs de PRUEBA de Google no permiten configurar SSV (no son tu ad unit), por
> eso el modo SSV recién se puede probar con tu cuenta real. El mecanismo de
> verificación de firma ya está probado (vectores ECDSA + rechazo de firmas falsas).

Para pasar a **anuncios reales**:
1. Creá tu app en https://admob.google.com → sacá tu **App ID** y tus **ad unit IDs**.
2. Reemplazá el App ID en el `AndroidManifest.xml` y los ad unit IDs en `ads.ts`.
3. `npm run cap:sync` y recompilás. (La lógica de anuncios vive en la web, así que
   la frecuencia/dónde mostrarlos lo tuneás sin recompilar el APK.)

---

## Publicar en Play Store (más adelante)
El `app-debug.apk` es para probar (sideload). Para la tienda hace falta un APK/AAB
**firmado** con tu keystore — lo agregamos cuando llegue ese momento.

---

## Alternativa: compilar en la nube (GitHub Actions)
Hay un workflow en `.github/workflows/android-apk.yml` (modo manual) que compila el
APK sin instalar nada, **pero requiere que la cuenta de GitHub tenga Actions
habilitado** (hoy bloqueado por facturación). Cuando lo destrabes: seteá la variable
de repo `PROD_URL`, andá a **Actions → “Android APK (debug)” → Run workflow**, y
bajás el `.apk` desde **Artifacts**.
