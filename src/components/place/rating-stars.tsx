import { Star } from "lucide-react";

type RatingStarsProps = {
  label: string;
  value: number;
};

export function RatingStars({ label, value }: RatingStarsProps) {
  return (
    <div className="rounded-2xl border border-[#ffe0ce] bg-white/80 p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-[#6d5147]">{label}</div>
      <div className="flex gap-1" aria-label={`${label} ${value} 星`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-5 w-5 ${
              index < value ? "fill-[#ffb84c] text-[#ffb84c]" : "text-[#ead7cb]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
