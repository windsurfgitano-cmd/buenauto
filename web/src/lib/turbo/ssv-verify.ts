import "server-only";

import { createVerify } from "node:crypto";

// Verificación de callbacks SSV (Server-Side Verification) de AdMob rewarded.
// https://developers.google.com/admob/android/ssv
//
// Google firma el callback con ECDSA (P-256). Los DOS últimos parámetros del
// query son siempre `signature` y `key_id` (en ese orden); todo lo que va ANTES
// de `&signature=` es el contenido firmado. Verificamos con la clave pública de
// Google que corresponde a `key_id`.

const VERIFIER_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 h; las claves rotan cada varias semanas

type VerifierKey = { keyId: number | string; pem: string; base64?: string };

let cache: { keys: Map<string, string>; fetchedAt: number } | null = null;

async function getKeys(forceRefresh = false): Promise<Map<string, string>> {
  if (!forceRefresh && cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.keys;
  }
  const res = await fetch(VERIFIER_KEYS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron obtener las claves verificadoras de AdMob");
  const data = (await res.json()) as { keys?: VerifierKey[] };
  const keys = new Map<string, string>();
  for (const k of data.keys ?? []) {
    if (k.keyId != null && typeof k.pem === "string") keys.set(String(k.keyId), k.pem);
  }
  cache = { keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * Verifica la firma de un callback SSV.
 * @param rawQuery query string CRUDO (sin el `?`), tal cual lo mandó Google.
 */
export async function verifySsv(rawQuery: string): Promise<boolean> {
  const marker = "&signature=";
  const sigIdx = rawQuery.indexOf(marker);
  if (sigIdx < 0) return false;

  // Contenido firmado = todo lo anterior a `&signature=` (bytes crudos).
  const content = rawQuery.slice(0, sigIdx);

  const params = new URLSearchParams(rawQuery);
  const signatureB64 = params.get("signature");
  const keyId = params.get("key_id");
  if (!signatureB64 || !keyId) return false;

  let keys = await getKeys();
  let pem = keys.get(keyId);
  if (!pem) {
    // key_id desconocido: puede haber rotado. Refrescamos una vez.
    keys = await getKeys(true);
    pem = keys.get(keyId);
  }
  if (!pem) return false;

  try {
    const signature = Buffer.from(signatureB64, "base64url");
    const verifier = createVerify("SHA256");
    verifier.update(content);
    verifier.end();
    return verifier.verify(pem, signature);
  } catch {
    return false;
  }
}
