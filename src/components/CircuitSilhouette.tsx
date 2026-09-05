"use client";

import Image from "next/image";
import { getCircuitAssetPath } from "@/lib/circuit-outlines";
import { getDriverImageUrl } from "@/lib/driver-image";
import type { Race } from "@/lib/types";
import { useState } from "react";

type CircuitSilhouetteProps = {
  active?: boolean;
  className?: string;
  imageClassName?: string;
  race: Pick<Race, "name" | "circuit" | "circuitImageUrl">;
};

export function CircuitSilhouette({
  active = false,
  className,
  imageClassName,
  race,
}: CircuitSilhouetteProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const sourceImageUrl = race.circuitImageUrl && race.circuitImageUrl !== failedImageUrl
    ? race.circuitImageUrl
    : null;
  const imageUrl =
    getDriverImageUrl(sourceImageUrl) ?? getCircuitAssetPath(race.circuit?.circuitRef);

  return (
    imageUrl ? (
      <Image
        alt={`${race.name} circuit outline`}
        className={imageClassName ?? className}
        data-active={active ? "true" : undefined}
        height={96}
        onError={() => setFailedImageUrl(sourceImageUrl)}
        src={imageUrl}
        unoptimized
        width={180}
      />
    ) : null
  );
}
