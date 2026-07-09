import { dirToCompass } from "../services/openMeteo";
import type { WindRelation } from "../types";

const RELATION_COLOR: Record<WindRelation, string> = {
  offshore: "#34d399",
  glassy: "#34d399",
  onshore: "#f87171",
  cross: "#fbbf24",
};

export function WindArrow({
  direction,
  speed,
  relation,
  size = 28,
  showLabel = true,
}: {
  direction: number;
  speed?: number;
  relation?: WindRelation;
  size?: number;
  showLabel?: boolean;
}) {
  const color = relation ? RELATION_COLOR[relation] : "#8adce8";
  const compass = dirToCompass(direction);

  return (
    <div
      className="inline-flex items-center gap-1.5"
      title={`Wind from ${compass} (${Math.round(direction)}°)${relation ? ` · ${relation}` : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ transform: `rotate(${direction + 180}deg)` }}
        className="shrink-0"
        aria-hidden
      >
        <path
          d="M12 3 L16 14 L12 11 L8 14 Z"
          fill={color}
          stroke={color}
          strokeWidth="0.5"
        />
      </svg>
      {showLabel && (
        <span className="text-xs text-ocean-300 tabular-nums">
          {compass}
          {speed != null && Number.isFinite(speed) ? ` ${Math.round(speed)}` : ""}
        </span>
      )}
    </div>
  );
}

export function SwellArrow({
  direction,
  size = 24,
}: {
  direction: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${direction + 180}deg)` }}
      className="inline-block shrink-0 text-ocean-400"
      aria-label={`Swell from ${dirToCompass(direction)}`}
    >
      <path
        d="M12 2 L17 16 L12 13 L7 16 Z"
        fill="currentColor"
        opacity={0.9}
      />
    </svg>
  );
}
