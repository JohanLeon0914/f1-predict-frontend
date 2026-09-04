"use client";

import Image from "next/image";
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
  const imageUrl = race.circuitImageUrl && race.circuitImageUrl !== failedImageUrl
    ? race.circuitImageUrl
    : null;

  return (
    imageUrl ? (
      <Image
        alt={`${race.name} circuit outline`}
        className={imageClassName ?? className}
        data-active={active ? "true" : undefined}
        height={96}
        onError={() => setFailedImageUrl(imageUrl)}
        src={imageUrl}
        unoptimized
        width={180}
      />
    ) : null
  );
}
