"use client";

import { useEffect, useRef, useState } from "react";
import { CloudRain, Sun, Snowflake, CloudSun, RotateCcw } from "lucide-react";
import { fetchTokyoWeather, getWeatherRecommendations, getWeatherLabel } from "@/lib/weather";
import type { WeatherCondition, WeatherData } from "@/lib/weather";
import type { PlaceFilters } from "@/types/place";

type WeatherWidgetProps = {
  onApplyRecommendations?: (filters: Partial<PlaceFilters>) => void;
  onReset?: () => void;
};

const conditionIcon: Record<WeatherCondition, React.ReactNode> = {
  rainy: <CloudRain className="h-4 w-4 text-blue-500" />,
  hot: <Sun className="h-4 w-4 text-orange-500" />,
  cold: <Snowflake className="h-4 w-4 text-cyan-500" />,
  comfortable: <CloudSun className="h-4 w-4 text-green-500" />,
};

export function WeatherWidget({ onApplyRecommendations, onReset }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const prevFiltersRef = useRef<Partial<PlaceFilters> | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchTokyoWeather()
      .then((data) => {
        if (mounted) setWeather(data);
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !weather) return null;

  const { temp, condition } = weather;
  const recommendations = getWeatherRecommendations(condition);
  const showRecommend = recommendations && onApplyRecommendations;

  const handleApply = () => {
    if (!recommendations || !onApplyRecommendations) return;
    prevFiltersRef.current = recommendations;
    onApplyRecommendations(recommendations);
    setApplied(true);
  };

  const handleReset = () => {
    onReset?.();
    setApplied(false);
    prevFiltersRef.current = null;
  };

  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
      {conditionIcon[condition]}
      <span className="text-[#2c3834]">
        东京 {Math.round(temp)}°C · {getWeatherLabel(condition)}
      </span>
      {showRecommend && !applied && (
        <button
          onClick={handleApply}
          className="ml-1 rounded-full bg-[#ff8c73] px-2.5 py-0.5 text-[10px] font-black text-white transition hover:bg-[#ff7a5c]"
        >
          推荐室内地点
        </button>
      )}
      {applied && (
        <button
          onClick={handleReset}
          className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-[#ffe0ce] bg-[#fffaf4] px-2.5 py-0.5 text-[10px] font-black text-[#76584e] transition hover:bg-[#ffe0ce]"
        >
          <RotateCcw className="h-3 w-3" />
          恢复全部
        </button>
      )}
    </div>
  );
}
