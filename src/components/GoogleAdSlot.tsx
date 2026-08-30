"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { adsenseClient } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  className?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  label?: string;
  slot?: string;
};

export function GoogleAdSlot({
  className = "",
  format = "auto",
  label = "Advertisement",
  slot,
}: Props) {
  const { isPremium, loading, premiumLoading } = useAuth();

  useEffect(() => {
    if (!adsenseClient || !slot || isPremium || loading || premiumLoading) return;

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers or delayed AdSense loading can make this fail harmlessly.
    }
  }, [isPremium, loading, premiumLoading, slot]);

  if (!adsenseClient || !slot || isPremium || loading || premiumLoading) return null;

  return (
    <aside className={`ad-container ${className}`} aria-label={label}>
      <span>{label}</span>
      <ins
        className="adsbygoogle"
        data-ad-client={adsenseClient}
        data-ad-format={format}
        data-ad-slot={slot}
        data-full-width-responsive="true"
        style={{ display: "block" }}
      />
    </aside>
  );
}
