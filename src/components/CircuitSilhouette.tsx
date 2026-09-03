"use client";

import Image from "next/image";
import { useState } from "react";
import type { Race } from "@/lib/types";

type CircuitSilhouetteProps = {
  active?: boolean;
  className?: string;
  imageClassName?: string;
  race: Pick<Race, "name" | "circuit" | "circuitImageUrl">;
  svgClassName?: string;
};

export function CircuitSilhouette({
  active = false,
  className,
  imageClassName,
  race,
  svgClassName,
}: CircuitSilhouetteProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = race.circuitImageUrl && race.circuitImageUrl !== failedImageUrl
    ? race.circuitImageUrl
    : null;

  if (imageUrl) {
    return (
      <Image
        alt={`${race.name} circuit outline`}
        className={imageClassName ?? className}
        height={96}
        onError={() => setFailedImageUrl(imageUrl)}
        src={imageUrl}
        unoptimized
        width={180}
      />
    );
  }

  return (
    <span
      className={svgClassName ?? className}
      role="img"
      aria-label={`${race.name} circuit outline`}
      data-active={active ? "true" : undefined}
      data-circuit-placeholder="true"
    />
  );
}
