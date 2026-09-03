import { NextResponse } from "next/server";
import { parseKofiPayload, processKofiWebhookPayment } from "@/lib/kofi-webhook";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    console.error("Ko-fi webhook received but Supabase service role is not configured.");
    return NextResponse.json({ detail: "Webhook is not configured." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const payload = parseKofiPayload(formData.get("data"));
    const result = await processKofiWebhookPayment({ payload, supabase });

    console.info("Ko-fi webhook processed", {
      currency: payload.currency,
      duplicate: result.duplicate,
      foundingSupporterGranted: result.foundingSupporterGranted,
      matchedUser: result.matchedUser,
      messageId: result.messageId,
      type: result.type,
    });

    return NextResponse.json({ ok: true, duplicate: result.duplicate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Ko-fi webhook error.";

    if (
      message === "Invalid Ko-fi verification token." ||
      message === "Missing Ko-fi data payload." ||
      message === "Invalid Ko-fi data payload." ||
      message === "Missing required Ko-fi payment fields." ||
      message === "Unsupported Ko-fi payment type."
    ) {
      return NextResponse.json({ detail: message }, { status: 400 });
    }

    console.error("Ko-fi webhook failed", { message });
    return NextResponse.json({ detail: "Webhook processing failed." }, { status: 500 });
  }
}
