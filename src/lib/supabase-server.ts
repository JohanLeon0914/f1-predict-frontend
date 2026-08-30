import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getAccessToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
}

export function getSupabaseServerClient(accessToken?: string | null) {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export type SupabaseServerClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

export async function getAuthenticatedUser(request: NextRequest) {
  const accessToken = getAccessToken(request);
  const supabase = getSupabaseServerClient(accessToken);

  if (!supabase || !accessToken) {
    return { accessToken, supabase, user: null, error: null };
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  return { accessToken, supabase, user: data.user, error };
}

export async function isPremiumUser(
  supabase: SupabaseServerClient,
  email?: string | null,
) {
  if (!email) return false;

  const { data, error } = await supabase
    .from("premium_users")
    .select("email")
    .eq("email", email.toLowerCase())
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function getMonthlyRacePredictionCount(
  supabase: SupabaseServerClient,
  userId: string,
  raceId: number,
) {
  const { start, end } = getMonthRange();
  const { count, error } = await supabase
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("race_id", raceId)
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw error;
  return count ?? 0;
}
