/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import { POSES, type Pose } from "./assets";

export const Keeper = forwardRef<
  HTMLDivElement,
  { pose?: Pose; className?: string; priority?: boolean; alt?: string }
>(function Keeper(
  { pose = "happy", className = "", priority = false, alt = "The Strand Keeper" },
  ref,
) {
  return (
    <div ref={ref} className={`relative ${className}`} data-keeper data-pose={pose}>
      <img
        src={POSES[pose]}
        alt={alt}
        className="h-auto w-full select-none object-contain"
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
});
