"use client";

import Image from "next/image";
import { useState } from "react";
import { getCircuitOutline } from "@/lib/circuit-outlines";
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

  const outline = getCircuitOutline(race.circuit?.circuitRef);

  return (
    <svg
      className={svgClassName ?? className}
      viewBox={outline.viewBox}
      role="img"
      aria-label={`${race.name} circuit outline`}
      data-active={active ? "true" : undefined}
    >
      <path d={outline.path} />
    </svg>
  );
}
