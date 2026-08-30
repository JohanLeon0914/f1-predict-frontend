import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getMonthlyRacePredictionCount,
  isPremiumUser,
} from "@/lib/supabase-server";
import type { SavedPrediction } from "@/lib/types";

const FREE_MONTHLY_RACE_LIMIT = 3;
const FREE_RACES_SIMULATION_LIMIT = 1;

type SavedPredictionPayload = SavedPrediction & {
  guest_id?: string | null;
};

export async function GET(request: NextRequest) {
  const { error: userError, supabase, user } = await getAuthenticatedUser(request);
  if (!supabase) return new NextResponse(null, { status: 204 });

  if (userError || !user) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  const predictions: SavedPrediction[] = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    source: row.source,
    simulation_count: row.simulation_count,
    race: {
      raceId: row.race_id,
      circuitId: row.circuit_id,
      name: row.race_name,
      date: row.race_date,
    },
    request: row.request_payload,
    averaged_predictions: row.averaged_predictions,
    raw_predictions: row.raw_predictions,
  }));

  return NextResponse.json(predictions);
}

export async function POST(request: NextRequest) {
  const { error: userError, supabase, user } = await getAuthenticatedUser(request);
  if (!supabase) return new NextResponse(null, { status: 204 });

  if (userError || !user) {
    return NextResponse.json({ detail: "Sesion invalida. Vuelve a iniciar sesion." }, { status: 401 });
  }

  const prediction = (await request.json()) as SavedPredictionPayload;
  const isPremium = await isPremiumUser(supabase, user.email);
  const used = await getMonthlyRacePredictionCount(supabase, user.id, prediction.race.raceId);

  if (!isPremium && prediction.source === "races" && prediction.simulation_count > FREE_RACES_SIMULATION_LIMIT) {
    return NextResponse.json(
      { detail: "Los usuarios gratuitos solo pueden correr 1 simulacion en Races." },
      { status: 403 },
    );
  }

  if (!isPremium && used >= FREE_MONTHLY_RACE_LIMIT) {
    return NextResponse.json(
      { detail: "Llegaste al limite de 3 predicciones por carrera este mes." },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("predictions").insert({
    id: prediction.id,
    guest_id: null,
    user_id: user.id,
    source: prediction.source,
    race_id: prediction.race.raceId,
    circuit_id: prediction.race.circuitId,
    race_name: prediction.race.name,
    race_date: prediction.race.date,
    simulation_count: prediction.simulation_count,
    request_payload: prediction.request,
    averaged_predictions: prediction.averaged_predictions,
    raw_predictions: prediction.raw_predictions,
  });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase" });
}
