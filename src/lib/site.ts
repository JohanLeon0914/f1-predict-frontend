export const siteName = "GRDX1";
export const contactEmail = "apexpredictorcontact@gmail.com";

export const socialLinks = [
  { label: "TikTok", href: "https://www.tiktok.com/@grdx1motorsport" },
  { label: "Instagram", href: "https://www.instagram.com/grdx1_motorsports/" },
  { label: "YouTube", href: "https://www.youtube.com/@GRDX1_MOTORSPORTS" },
] as const;

export function getSiteOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    process.env.SITE_URL ??
    null;

  if (!configured) return "http://localhost:3000";
  if (configured.startsWith("http://") || configured.startsWith("https://")) return configured;
  return `https://${configured}`;
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, getSiteOrigin()).toString();
}
