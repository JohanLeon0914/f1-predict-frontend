import type { SupabaseServerClient } from "@/lib/supabase-server";
import { getFoundingPromotion } from "@/lib/kofi-config";

const SUPPORTED_PAYMENT_TYPES = new Set([
  "commission",
  "donation",
  "shop order",
  "subscription",
  "tip",
]);

type KofiPayload = {
  amount?: unknown;
  currency?: unknown;
  email?: unknown;
  from_name?: unknown;
  is_public?: unknown;
  kofi_transaction_id?: unknown;
  message_id?: unknown;
  timestamp?: unknown;
  type?: unknown;
  verification_token?: unknown;
  [key: string]: unknown;
};

export type KofiProcessResult = {
  duplicate: boolean;
  foundingSupporterGranted: boolean;
  matchedUser: boolean;
  messageId: string;
  type: string;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return null;
}

function parseAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(getString(value));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseTimestamp(value: unknown) {
  const raw = getString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseKofiPayload(rawData: FormDataEntryValue | null) {
  if (typeof rawData !== "string" || !rawData.trim()) {
    throw new Error("Missing Ko-fi data payload.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData) as unknown;
  } catch {
    throw new Error("Invalid Ko-fi data payload.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid Ko-fi data payload.");
  }

  return parsed as KofiPayload;
}

export function validateKofiPaymentPayload(
  payload: KofiPayload,
  verificationToken: string,
) {
  if (getString(payload.verification_token) !== verificationToken) {
    throw new Error("Invalid Ko-fi verification token.");
  }

  const messageId = getString(payload.message_id);
  const type = getString(payload.type);
  const amount = parseAmount(payload.amount);
  const currency = getString(payload.currency)?.toUpperCase() ?? null;
  const timestamp = parseTimestamp(payload.timestamp);

  if (!messageId || !type || !amount || !currency || !timestamp) {
    throw new Error("Missing required Ko-fi payment fields.");
  }

  const normalizedType = type.toLowerCase();
  if (!SUPPORTED_PAYMENT_TYPES.has(normalizedType)) {
    throw new Error("Unsupported Ko-fi payment type.");
  }

  return {
    amount,
    currency,
    email: normalizeEmail(payload.email),
    fromName: getString(payload.from_name),
    isPublic: getBoolean(payload.is_public),
    messageId,
    timestamp,
    type,
  };
}

async function findUserIdByEmail(
  supabase: SupabaseServerClient,
  email: string | null,
) {
  if (!email) return null;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const user = data.users.find(
      (item) => item.email?.trim().toLowerCase() === email,
    );
    if (user) return user.id;
    if (data.users.length < 1000) return null;
  }

  return null;
}

export async function processKofiWebhookPayment({
  payload,
  supabase,
}: {
  payload: KofiPayload;
  supabase: SupabaseServerClient;
}): Promise<KofiProcessResult> {
  const verificationToken = process.env.KOFI_VERIFICATION_TOKEN;
  if (!verificationToken) {
    throw new Error("KOFI_VERIFICATION_TOKEN is not configured.");
  }

  const payment = validateKofiPaymentPayload(payload, verificationToken);

  const { data: existingPayment, error: existingError } = await supabase
    .from("kofi_payments")
    .select("id")
    .eq("message_id", payment.messageId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existingPayment) {
    return {
      duplicate: true,
      foundingSupporterGranted: false,
      matchedUser: false,
      messageId: payment.messageId,
      type: payment.type,
    };
  }

  const userId = await findUserIdByEmail(supabase, payment.email);
  const promotion = getFoundingPromotion();
  const shouldGrantFoundingAccess =
    promotion.active &&
    ["donation", "tip"].includes(payment.type.toLowerCase()) &&
    Boolean(userId);

  const { error: insertError } = await supabase.from("kofi_payments").insert({
    amount: payment.amount,
    currency: payment.currency,
    email: payment.email,
    from_name: payment.fromName,
    is_public: payment.isPublic,
    message_id: payment.messageId,
    raw_payload: payload,
    timestamp: payment.timestamp.toISOString(),
    type: payment.type,
    user_id: userId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        duplicate: true,
        foundingSupporterGranted: false,
        matchedUser: Boolean(userId),
        messageId: payment.messageId,
        type: payment.type,
      };
    }
    throw insertError;
  }

  if (shouldGrantFoundingAccess && userId) {
    const { error: grantError } = await supabase.from("user_access").upsert(
      {
        access_type: "unlimited_f1",
        external_payment_id: payment.messageId,
        expires_at: null,
        source: "kofi_founding_supporter",
        user_id: userId,
      },
      {
        ignoreDuplicates: true,
        onConflict: "user_id,access_type,source",
      },
    );

    if (grantError) throw grantError;
  }

  return {
    duplicate: false,
    foundingSupporterGranted: shouldGrantFoundingAccess,
    matchedUser: Boolean(userId),
    messageId: payment.messageId,
    type: payment.type,
  };
}
