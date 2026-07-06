import "server-only";

import { getStore } from "@netlify/blobs";

/**
 * Store de fotos de avisos en Netlify Blobs.
 * En el runtime de Netlify el contexto (siteID/token) es automático;
 * en local se toma de NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN (.env.local).
 */
export function getPhotoStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (siteID && token) {
    return getStore({ name: "car-photos", siteID, token });
  }

  return getStore("car-photos");
}

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
