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

Hoy usa los **IDs de PRUEBA de Google** (anuncios de test, sin riesgo de baneo):
- **App ID** (test): `web/android/app/src/main/AndroidManifest.xml` → `ca-app-pub-3940256099942544~3347511713`
- **Ad unit del banner** (test): `web/src/components/native/admob-init.tsx` → `ca-app-pub-3940256099942544/6300978111`

Para pasar a **anuncios reales**:
1. Creá tu app en https://admob.google.com → sacá tu **App ID** y tus **ad unit IDs**.
2. Reemplazá el App ID en el `AndroidManifest.xml` y los ad unit IDs en `admob-init.tsx`.
3. `npm run cap:sync` y recompilás. (Dónde/cuándo mostrar anuncios vive en la web,
   así que la frecuencia la tuneás sin recompilar.)

> El banner de abajo tapa un poco los botones del feed. Cuando definamos el formato
> final (banner fijo, intersticial cada N swipes, rewarded por puntos…) ajustamos el
> padding inferior del feed para que no se pisen.

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
