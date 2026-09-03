export const KOFI_SUPPORT_URL = "https://ko-fi.com/grdx1";

export type FoundingPromotion = {
  active: boolean;
  end: string | null;
  start: string | null;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFoundingPromotion(now = new Date()): FoundingPromotion {
  const start = parseDate(process.env.KOFI_FOUNDING_PROMO_START);
  const end = parseDate(process.env.KOFI_FOUNDING_PROMO_END);
  const active = Boolean(start && end && now >= start && now <= end);

  return {
    active,
    end: end?.toISOString() ?? null,
    start: start?.toISOString() ?? null,
  };
}
