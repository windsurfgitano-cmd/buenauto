import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server/session";
import { pointsBalance } from "@/lib/turbo/points-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Saldo de puntos del usuario. Lo usa el cliente para refrescar el badge cuando
// los puntos se otorgan de forma asíncrona (callback SSV de AdMob).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  return NextResponse.json({ balance: await pointsBalance(user.id) });
}
