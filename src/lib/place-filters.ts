import { ageOptions } from "@/data/place-options";
import type { Place, PlaceFilters } from "@/types/place";

export const defaultFilters: PlaceFilters = {
  categories: [],
  features: [],
};

export function filterPlaces(places: Place[], filters: PlaceFilters) {
  return places.filter((place) => {
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

    return filters.features.every((feature) => {
      if (feature === "free") return place.freeEntry;
      if (feature === "rainy_day") return place.rainyDay;
      if (feature === "stroller_friendly") return place.strollerScore >= 4;
      if (feature === "parking_easy") return place.parkingScore >= 4;
      return true;
    });
  });
}
