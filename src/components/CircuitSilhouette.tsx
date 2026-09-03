"use client";

import Image from "next/image";
import { getCircuitAssetPath, getCircuitOutline } from "@/lib/circuit-outlines";
import type { Race } from "@/lib/types";
import { useState } from "react";

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
  const outline = getCircuitOutline(race.circuit?.circuitRef);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const circuitAssetPath = getCircuitAssetPath(race.circuit?.circuitRef);
  const circuitAssetClassName = [
    imageClassName ?? className,
    race.circuit?.circuitRef === "monza" ? "circuit-image-monza" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const imageUrl = circuitAssetPath && circuitAssetPath !== failedImageUrl
    ? circuitAssetPath
    : null;

  return (
    <>
      {imageUrl ? (
        <Image
          alt={`${race.name} circuit outline`}
          className={circuitAssetClassName}
          height={96}
          onError={() => setFailedImageUrl(imageUrl)}
          src={imageUrl}
          unoptimized
          width={180}
        />
      ) : null}
      {!imageUrl ? (
        <svg
          aria-label={`${race.name} circuit outline`}
          className={svgClassName ?? className}
          data-active={active ? "true" : undefined}
          fill="none"
          role="img"
          viewBox={outline.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={outline.path} />
        </svg>
      ) : null}
    </>
  );
}
