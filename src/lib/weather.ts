import type { PlaceFilters } from "@/types/place";

export type WeatherCondition = "rainy" | "hot" | "cold" | "comfortable";

export type WeatherData = {
  temp: number;
  precipitation: number;
  condition: WeatherCondition;
};

export async function fetchTokyoWeather(): Promise<WeatherData> {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current=temperature_2m,precipitation&timezone=Asia%2FTokyo",
    { next: { revalidate: 900 } }, // 15 min cache
  );

  if (!res.ok) {
    throw new Error("天气数据获取失败");
  }

  const json = await res.json();
  const temp = json.current?.temperature_2m ?? 20;
  const precipitation = json.current?.precipitation ?? 0;

  let condition: WeatherCondition = "comfortable";
  if (precipitation > 0) condition = "rainy";
  else if (temp >= 30) condition = "hot";
  else if (temp <= 10) condition = "cold";

  return { temp, precipitation, condition };
}

export function getWeatherRecommendations(condition: WeatherCondition): Partial<PlaceFilters> | null {
  if (condition === "comfortable") return null;

  const indoorCategories: PlaceFilters["categories"] = [
    "indoor_play",
    "library",
    "museum",
    "aquarium",
    "science_museum",
    "children_center",
  ];

  if (condition === "rainy") {
    return {
      categories: indoorCategories,
      features: ["rainy_day"],
    };
  }

  // hot / cold → 推荐室内
  return {
    categories: indoorCategories,
    features: [],
  };
}

export function getWeatherLabel(condition: WeatherCondition): string {
  switch (condition) {
    case "rainy":
      return "小雨";
    case "hot":
      return "炎热";
    case "cold":
      return "寒冷";
    default:
      return "舒适";
  }
}
