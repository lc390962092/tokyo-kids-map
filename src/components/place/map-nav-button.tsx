"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { Place } from "@/types/place";

type MapNavButtonProps = {
  place: Place;
};

export function MapNavButton({ place }: MapNavButtonProps) {
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    setIsApple(
      typeof navigator !== "undefined" &&
        /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent),
    );
  }, []);

  const appleUrl = `http://maps.apple.com/?daddr=${place.latitude},${place.longitude}&dirflg=d`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <div className="space-y-2">
      <a
        href={isApple ? appleUrl : googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8c73] py-4 text-base font-black text-white shadow-lg transition hover:bg-[#ff7a5c] active:scale-95"
      >
        <MapPin className="h-5 w-5" />
        {isApple ? "在 Apple Maps 中打开" : "在 Google Maps 中打开"}
      </a>
      <a
        href={isApple ? googleUrl : appleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ffd5c8] bg-white py-3 text-sm font-bold text-[#ff8c73] transition hover:bg-[#fff0e8] active:scale-95"
      >
        {isApple ? "或改用 Google Maps" : "或改用 Apple Maps"}
      </a>
    </div>
  );
}
