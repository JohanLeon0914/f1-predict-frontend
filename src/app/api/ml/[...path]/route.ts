import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  hasUnlimitedF1Access,
  getMonthlyRacePredictionCount,
  isPremiumUser,
} from "@/lib/supabase-server";

const API_BASE_URL = process.env.ML_API_BASE_URL ?? "http://localhost:8000";
const FREE_MONTHLY_RACE_LIMIT = 3;

async function proxy(request: NextRequest, path: string[], bodyOverride?: string) {
  const target = `${API_BASE_URL}/${path.join("/")}${request.nextUrl.search}`;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : bodyOverride ?? await request.text();

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      body,
      cache: "no-store",
    });
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con la API local de ML.",
      },
      { status: 503 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/ml/[...path]">,
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/ml/[...path]">,
) {
  const { path } = await context.params;

  if (path.join("/") === "predict") {
    const { error, supabase, user } = await getAuthenticatedUser(request);

    if (!supabase) {
      return NextResponse.json({ detail: "Supabase no esta configurado." }, { status: 503 });
    }

    if (error || !user) {
      return NextResponse.json({ detail: "Debes iniciar sesion para hacer predicciones." }, { status: 401 });
    }

    const body = await request.text();
    const payload = JSON.parse(body) as { race_id?: number };
    const raceId = Number(payload.race_id);
    if (!raceId) {
      return NextResponse.json({ detail: "Race invalida." }, { status: 400 });
    }

    const [isPremium, hasUnlimitedF1] = await Promise.all([
      isPremiumUser(supabase, user.email),
      hasUnlimitedF1Access(supabase, user.id),
    ]);
    const used = await getMonthlyRacePredictionCount(supabase, user.id, raceId);

    if (!isPremium && !hasUnlimitedF1 && used >= FREE_MONTHLY_RACE_LIMIT) {
      return NextResponse.json(
        { detail: "Llegaste al limite de 3 predicciones por carrera este mes." },
        { status: 403 },
      );
    }

    return proxy(request, path, body);
  }

  return proxy(request, path);
}
