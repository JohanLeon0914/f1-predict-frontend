import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getUfcFightPredictionCount, isPremiumUser } from "@/lib/supabase-server";

type QuotaRequest = {
  fight_key?: string;
};

export async function POST(request: NextRequest) {
  const { error, supabase, user } = await getAuthenticatedUser(request);

  if (!supabase) {
    return NextResponse.json({ detail: "Supabase no esta configurado." }, { status: 503 });
  }

  if (error || !user) {
    return NextResponse.json({ detail: "Debes iniciar sesion para hacer predicciones." }, { status: 401 });
  }

  const payload = (await request.json()) as QuotaRequest;
  const fightKey = payload.fight_key?.trim();

  if (!fightKey) {
    return NextResponse.json({ detail: "Fight invalida." }, { status: 400 });
  }

  const isPremium = await isPremiumUser(supabase, user.email);
  const used = await getUfcFightPredictionCount(supabase, user.id, fightKey);

  if (isPremium) {
    return NextResponse.json({
      allowed: true,
      is_premium: true,
      limit: null,
      remaining: null,
      used,
    });
  }

  if (used >= 1) {
    return NextResponse.json(
      {
        allowed: false,
        detail: "Free users can only make one prediction per fight.",
        is_premium: false,
        limit: 1,
        remaining: 0,
        used,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    allowed: true,
    is_premium: false,
    limit: 1,
    remaining: 1 - used,
    used,
  });
}
