import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server/session";
import { POINTS, REWARDED_DAILY_CAP } from "@/lib/turbo/points";
import { addLedger, countRewardedToday, pointsBalance } from "@/lib/turbo/points-store";
import { verifySsv } from "@/lib/turbo/ssv-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = callback SSV de AdMob (no falsificable). Google llama esta URL cuando el
// usuario completa un rewarded, firmada con su clave. Verificamos la firma y
// recién ahí otorgamos. Se activa configurando la SSV callback URL en la consola
// de AdMob (ver MOBILE.md) y el flag NEXT_PUBLIC_REWARD_SSV=1 en el cliente.
export async function GET(req: Request) {
  const url = req.url;
  const qIdx = url.indexOf("?");
  const rawQuery = qIdx >= 0 ? url.slice(qIdx + 1) : "";

  const params = new URLSearchParams(rawQuery);
  const userId = params.get("user_id") ?? "";
  const transactionId = params.get("transaction_id") ?? "";

  if (!userId || !transactionId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const valid = await verifySsv(rawQuery);
  if (!valid) {
    // Firma inválida: NO otorgamos. 403 para que quede claro en los logs.
    return NextResponse.json({ error: "Firma inválida" }, { status: 403 });
  }

  // Firma OK: user_id y transaction_id son de confianza (van dentro de la firma).
  const usedToday = await countRewardedToday(userId);
  if (usedToday < REWARDED_DAILY_CAP) {
    await addLedger(userId, "rewarded", POINTS.rewarded, `rewarded:ssv:${transactionId}`);
  }

  // Google necesita un 200 para dar el callback por entregado.
  return new NextResponse(null, { status: 200 });
}

// Otorga puntos por completar un anuncio rewarded. El award ocurre SIEMPRE en el
// servidor (el cliente nunca toca su saldo). Protecciones:
//   - requiere sesión (los puntos van a ese usuario),
//   - tope diario (REWARDED_DAILY_CAP) para acotar abuso,
//   - dedupe por txId (UNIQUE user+action+ref) contra doble envío.
//
// Endurecimiento futuro (no falsificable): AdMob Server-Side Verification (SSV).
// El cliente ya pasa ssv.userId; faltaría un handler GET que verifique la firma
// de Google y llame a addLedger. Ver MOBILE.md.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const txId =
    typeof (body as { txId?: unknown }).txId === "string"
      ? (body as { txId: string }).txId.trim()
      : "";

  if (!txId || txId.length > 100) {
    return NextResponse.json({ error: "txId inválido" }, { status: 400 });
  }

  const usedToday = await countRewardedToday(user.id);
  if (usedToday >= REWARDED_DAILY_CAP) {
    return NextResponse.json(
      {
        error: "Ya alcanzaste el máximo de anuncios por hoy",
        awarded: false,
        balance: await pointsBalance(user.id),
        remaining: 0,
      },
      { status: 429 },
    );
  }

  const awarded = await addLedger(user.id, "rewarded", POINTS.rewarded, `rewarded:${txId}`);
  const balance = await pointsBalance(user.id);
  const remaining = Math.max(0, REWARDED_DAILY_CAP - (usedToday + (awarded ? 1 : 0)));

  return NextResponse.json({
    ok: true,
    awarded,
    points: awarded ? POINTS.rewarded : 0,
    balance,
    remaining,
  });
}
