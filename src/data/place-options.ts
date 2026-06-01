import type { PlaceCategory, PlaceFeature, PlaceFilters } from "@/types/place";

export const ageOptions: Array<{
  id: NonNullable<PlaceFilters["ageRange"]>;
  label: string;
  min: number;
  max: number;
}> = [
  { id: "0-1", label: "0-1岁", min: 0, max: 1 },
  { id: "1-3", label: "1-3岁", min: 1, max: 3 },
  { id: "3-6", label: "3-6岁", min: 3, max: 6 },
  { id: "6+", label: "6岁+", min: 6, max: 10 },
];

export const categoryOptions: Array<{ id: PlaceCategory; label: string; color: string }> = [
  { id: "park", label: "公园", color: "#46b37b" },
  { id: "library", label: "图书馆", color: "#8f73df" },
  { id: "children_center", label: "儿童馆", color: "#ff9f68" },
  { id: "zoo", label: "动物园", color: "#4a9bd8" },
  { id: "aquarium", label: "水族馆", color: "#35a7c8" },
  { id: "science_museum", label: "科学馆", color: "#f3b23f" },
  { id: "indoor_play", label: "室内游乐", color: "#f47f9d" },
  { id: "museum", label: "博物馆", color: "#a77f57" },
  { id: "landmark", label: "地标", color: "#d66b6b" },
  { id: "river", label: "河川亲水", color: "#55aeca" },
];

export const featureOptions: Array<{ id: PlaceFeature; label: string }> = [
  { id: "free", label: "免费" },
  { id: "rainy_day", label: "雨天可去" },
  { id: "stroller_friendly", label: "婴儿车友好" },
  { id: "parking_easy", label: "停车方便" },
];

export function getCategoryLabel(category: PlaceCategory) {
  return categoryOptions.find((option) => option.id === category)?.label ?? category;
}

export function getCategoryColor(category: PlaceCategory) {
  return categoryOptions.find((option) => option.id === category)?.color ?? "#ff8d78";
}
