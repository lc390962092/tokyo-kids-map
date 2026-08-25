import { ageOptions } from "@/data/place-options";
import type { Place, PlaceFilters } from "@/types/place";

export const defaultFilters: PlaceFilters = {
  categories: [],
  features: [],
  wards: [],
  sortBy: "relevance",
};

export function filterPlaces(
  places: Place[],
  filters: PlaceFilters,
  favoriteIds?: Set<string>,
) {
  const search = filters.searchText?.trim().toLowerCase();

  const result = places.filter((place) => {
    if (filters.ageRange) {
      const option = ageOptions.find((age) => age.id === filters.ageRange);
      if (option && (place.ageMin > option.max || place.ageMax < option.min)) {
        return false;
      }
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(place.category)
    ) {
      return false;
    }

    const featureOk = filters.features.every((feature) => {
      if (feature === "free") return place.freeEntry;
      if (feature === "rainy_day") return place.rainyDay;
      if (feature === "stroller_friendly") return place.strollerScore >= 4;
      if (feature === "parking_easy") return place.parkingScore >= 4;
      return true;
    });
    if (!featureOk) return false;

    if (filters.wards.length > 0 && !filters.wards.includes(place.ward)) {
      return false;
    }

    if (search) {
      const haystack = [
        place.nameZh,
        place.nameJa,
        place.ward,
        place.address,
        place.nearestStation,
        place.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.onlyFavorites && favoriteIds && !favoriteIds.has(place.id)) {
      return false;
    }

    return true;
  });

  if (filters.sortBy === "rating") {
    result.sort((a, b) => b.playScore - a.playScore);
  } else if (filters.sortBy === "name") {
    result.sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh-CN"));
  }

  return result;
}
