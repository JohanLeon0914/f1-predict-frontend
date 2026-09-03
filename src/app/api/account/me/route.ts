import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserEntitlements,
  isPremiumUser,
} from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await getAuthenticatedUser(request);

  if (!supabase) {
    return NextResponse.json({
      founding_supporter: false,
      has_unlimited_f1_access: false,
      is_premium: false,
    }, { status: 200 });
  }

  if (error || !user) {
    return NextResponse.json({
      founding_supporter: false,
      has_unlimited_f1_access: false,
      is_premium: false,
    }, { status: 200 });
  }

  const [isPremium, entitlements] = await Promise.all([
    isPremiumUser(supabase, user.email),
    getUserEntitlements(supabase, user.id),
  ]);

  return NextResponse.json({
    email: user.email,
    ...entitlements,
    is_premium: isPremium,
  });
}
