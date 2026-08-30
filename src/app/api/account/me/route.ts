import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isPremiumUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await getAuthenticatedUser(request);

  if (!supabase) {
    return NextResponse.json({ is_premium: false }, { status: 200 });
  }

  if (error || !user) {
    return NextResponse.json({ is_premium: false }, { status: 200 });
  }

  return NextResponse.json({
    email: user.email,
    is_premium: await isPremiumUser(supabase, user.email),
  });
}
