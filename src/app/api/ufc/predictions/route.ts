import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getUfcFightPredictionCount, isPremiumUser } from "@/lib/supabase-server";

type SavedUfcPredictionPayload = {
  event_id?: string | null;
  event_name?: string | null;
  fight_id?: string | null;
  fight_key?: string;
  fight_name?: string | null;
  prediction_payload?: unknown;
  request_payload?: unknown;
  source?: "ufc";
};

export async function GET(request: NextRequest) {
  const { error: userError, supabase, user } = await getAuthenticatedUser(request);

  if (!supabase) return new NextResponse(null, { status: 204 });
  if (userError || !user) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("ufc_predictions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error: userError, supabase, user } = await getAuthenticatedUser(request);

  if (!supabase) {
    return NextResponse.json({ detail: "Supabase no esta configurado." }, { status: 503 });
  }

  if (userError || !user) {
    return NextResponse.json({ detail: "Sesion invalida. Vuelve a iniciar sesion." }, { status: 401 });
  }

  const payload = (await request.json()) as SavedUfcPredictionPayload;
  const fightKey = payload.fight_key?.trim();

  if (!fightKey) {
    return NextResponse.json({ detail: "Fight invalida." }, { status: 400 });
  }

  const isPremium = await isPremiumUser(supabase, user.email);
  const used = await getUfcFightPredictionCount(supabase, user.id, fightKey);

  if (!isPremium && used >= 1) {
    return NextResponse.json(
      { detail: "Los usuarios gratuitos solo pueden hacer 1 prediccion por pelea." },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("ufc_predictions").insert({
    event_id: payload.event_id ?? null,
    event_name: payload.event_name ?? null,
    fight_id: payload.fight_id ?? null,
    fight_key: fightKey,
    fight_name: payload.fight_name ?? null,
    guest_id: null,
    id: crypto.randomUUID(),
    prediction_payload: payload.prediction_payload ?? {},
    request_payload: payload.request_payload ?? {},
    source: payload.source ?? "ufc",
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase" });
}
