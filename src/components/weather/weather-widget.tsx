"use client";

import { useEffect, useState } from "react";
import { CloudRain, Sun, Snowflake, CloudSun } from "lucide-react";
import { fetchTokyoWeather, getWeatherRecommendations, getWeatherLabel } from "@/lib/weather";
import type { WeatherCondition, WeatherData } from "@/lib/weather";
import type { PlaceFilters } from "@/types/place";

type WeatherWidgetProps = {
  onApplyRecommendations?: (filters: Partial<PlaceFilters>) => void;
};

const conditionIcon: Record<WeatherCondition, React.ReactNode> = {
  rainy: <CloudRain className="h-4 w-4 text-blue-500" />,
  hot: <Sun className="h-4 w-4 text-orange-500" />,
  cold: <Snowflake className="h-4 w-4 text-cyan-500" />,
  comfortable: <CloudSun className="h-4 w-4 text-green-500" />,
};

export function WeatherWidget({ onApplyRecommendations }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
      {conditionIcon[condition]}
      <span className="text-[#2c3834]">
        东京 {Math.round(temp)}°C · {getWeatherLabel(condition)}
      </span>
      {showRecommend && (
        <button
          onClick={() => onApplyRecommendations!(recommendations)}
          className="ml-1 rounded-full bg-[#ff8c73] px-2.5 py-0.5 text-[10px] font-black text-white transition hover:bg-[#ff7a5c]"
        >
          推荐室内地点
        </button>
      )}
    </div>
  );
}
