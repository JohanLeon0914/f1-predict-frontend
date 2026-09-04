export function getDriverImageUrl(source: string | null) {
  return source ? `/api/f1/driver-image?url=${encodeURIComponent(source)}` : null;
}
