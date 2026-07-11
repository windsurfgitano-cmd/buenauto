# App Android (BuenAuto / TURBO)

La app Android es un envoltorio **Capacitor** que carga la web en vivo. Ventaja:
**se autoactualiza sola** — cada deploy en Netlify se ve al instante en la app, sin
reinstalar. Solo hay que recompilar el APK cuando se cambia algo **nativo** (AdMob,
plugins, ícono, permisos).

## 1) Configurar la URL (una sola vez)

El APK carga la URL que definas en la variable de repo **`PROD_URL`**:

1. GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → pestaña **Variables**.
2. **New repository variable**: nombre `PROD_URL`, valor tu dominio, ej. `https://buenauto.netlify.app`.

> Sin `PROD_URL`, el APK se compila igual pero carga un placeholder y no funciona.

## 2) Generar el APK (en la nube, sin instalar nada)

- Automático: cada push que toca lo nativo (`web/android/**`, `capacitor.config.ts`, deps).
- Manual: GitHub → pestaña **Actions** → workflow **“Android APK (debug)”** → **Run workflow**.

Cuando termina (verde), entrás al run → sección **Artifacts** → descargás
**`buenauto-debug-apk`** → adentro está `app-debug.apk`.

## 3) Instalar en el teléfono

1. Pasá el `app-debug.apk` al teléfono (o descargalo directo desde GitHub).
2. Android va a pedir permiso para **instalar apps de orígenes desconocidos** → aceptá.
3. Abrí la app. Vas a ver el feed TURBO (la web en vivo) + un **banner de anuncio de prueba** abajo.

> Es un APK **debug** para probar (sideload). Para publicar en Play Store hace falta
> un APK/AAB **firmado** con tu keystore — lo agregamos cuando llegue ese momento.

## 4) AdMob

Hoy usa los **IDs de prueba de Google** (anuncios de test, sin riesgo de baneo):

- **App ID** (test): en `web/android/app/src/main/AndroidManifest.xml`
  (`ca-app-pub-3940256099942544~3347511713`).
- **Ad unit del banner** (test): en `web/src/components/native/admob-init.tsx`
  (`ca-app-pub-3940256099942544/6300978111`).

Para pasar a **anuncios reales** (cuando quieras cobrar):

1. Creá tu cuenta y app en https://admob.google.com → sacá tu **App ID** y tus **ad unit IDs**.
2. Reemplazá el App ID en el `AndroidManifest.xml` y los ad unit IDs en `admob-init.tsx`.
3. Push → se recompila el APK (y la lógica de anuncios vive en la web, así que
   dónde/cuándo mostrarlos lo podés tunear sin recompilar).

> El banner de abajo tapa un poco los botones del feed. Cuando definamos el formato
> final (banner fijo, intersticial cada N swipes, rewarded por puntos, etc.) ajustamos
> el padding inferior del feed para que no se pisen.

## Resumen de auto-actualización

| Cambiás… | ¿Necesita nuevo APK? |
|---|---|
| Contenido/features de la web (feed, cotizador, estilos) | ❌ No — se ve solo al deployar |
| IDs de AdMob, ícono, permisos, plugins nativos | ✅ Sí — corré el workflow |
