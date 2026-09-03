"use client";

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
  race,
}: CircuitSilhouetteProps) {
  const outline = getCircuitOutline(race.circuit?.circuitRef);

  return (
    <svg
      aria-label={`${race.name} circuit outline`}
      className={className}
      data-active={active ? "true" : undefined}
      fill="none"
      role="img"
      viewBox={outline.viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={outline.path} />
    </svg>
  );
}
