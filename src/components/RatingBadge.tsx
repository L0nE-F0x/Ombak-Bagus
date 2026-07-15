import { ratingColor, ratingLabel, withAlpha } from "../services/rating";

export function RatingBadge({
 rating,
 size = "md",
}: {
 rating: number;
 size?: "sm" | "md" | "lg";
}) {
 const label = ratingLabel(rating);
 const color = ratingColor(rating);
 const dims =
 size === "lg"
 ? "w-14 h-14 text-base"
 : size === "sm"
 ? "w-8 h-8 text-[11px]"
 : "w-10 h-10 text-sm";

 return (
 <div
 className={`${dims} rounded-full flex items-center justify-center font-bold tabular-nums border-2 shrink-0 leading-none`}
 style={{
 borderColor: color,
 color,
 background: withAlpha(color, "22"),
 }}
 title={`${label} | ${rating.toFixed(1)} / 10`}
 aria-label={`Score ${rating.toFixed(1)} out of 10, ${label}`}
 >
 {rating.toFixed(1)}
 </div>
 );
}

export function RatingPill({ rating }: { rating: number }) {
 const label = ratingLabel(rating);
 const color = ratingColor(rating);
 return (
 <span
 className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
 style={{ background: withAlpha(color, "28"), color }}
 >
 <span
 className="w-1.5 h-1.5 rounded-full shrink-0"
 style={{ background: color }}
 />
 {label}
 </span>
 );
}
