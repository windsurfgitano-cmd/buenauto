import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/server/session";
import { getUserCredits } from "@/lib/server/subscriptions-store";
import { createPackPreference } from "@/lib/server/mercadopago";
import { PACKS, type PackId } from "@/lib/plans";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const credits = await getUserCredits(user.id);

  return NextResponse.json({ credits });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { packId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const packId = body.packId as PackId;

  if (!packId || !PACKS[packId]) {
    return NextResponse.json({ error: "Pack inválido" }, { status: 400 });
  }

  try {
    const { preferenceId, initPoint } = await createPackPreference({
      userId: user.id,
      packId,
      userEmail: user.email,
    });

    return NextResponse.json({
      preferenceId,
      initPoint,
    });
  } catch (err) {
    console.error("Error creating pack preference:", err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
