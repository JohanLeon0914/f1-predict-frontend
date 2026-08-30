import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getMonthlyRacePredictionCount,
  isPremiumUser,
} from "@/lib/supabase-server";

const FREE_MONTHLY_RACE_LIMIT = 3;
const FREE_RACES_SIMULATION_LIMIT = 1;

type QuotaRequest = {
  race_id?: number;
  simulation_count?: number;
  source?: "predicts" | "races";
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
  const raceId = Number(payload.race_id);
  const simulationCount = Number(payload.simulation_count ?? 1);

  if (!raceId) {
    return NextResponse.json({ detail: "Race invalida." }, { status: 400 });
  }

  const isPremium = await isPremiumUser(supabase, user.email);
  const used = await getMonthlyRacePredictionCount(supabase, user.id, raceId);
  const remaining = Math.max(FREE_MONTHLY_RACE_LIMIT - used, 0);

  if (isPremium) {
    return NextResponse.json({
      allowed: true,
      is_premium: true,
      limit: null,
      remaining: null,
      used,
    });
  }

  if (payload.source === "races" && simulationCount > FREE_RACES_SIMULATION_LIMIT) {
    return NextResponse.json(
      {
        allowed: false,
        detail: "Los usuarios gratuitos solo pueden correr 1 simulacion en Races.",
        is_premium: false,
        limit: FREE_MONTHLY_RACE_LIMIT,
        remaining,
        used,
      },
      { status: 403 },
    );
  }

  if (remaining <= 0) {
    return NextResponse.json(
      {
        allowed: false,
        detail: "Llegaste al limite de 3 predicciones por carrera este mes.",
        is_premium: false,
        limit: FREE_MONTHLY_RACE_LIMIT,
        remaining: 0,
        used,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    allowed: true,
    is_premium: false,
    limit: FREE_MONTHLY_RACE_LIMIT,
    remaining,
    used,
  });
}
