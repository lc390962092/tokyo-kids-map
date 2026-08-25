"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaceCategory, PlaceFeature, PlaceFilters } from "@/types/place";

const QUERY_KEY = {
  q: "q",
  age: "age",
  cat: "cat",
  feat: "feat",
  ward: "ward",
  fav: "fav",
  sort: "sort",
};

function parseStringList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function parseFiltersFromUrl(): PlaceFilters {
  if (typeof window === "undefined") {
    return {
      categories: [],
      features: [],
      wards: [],
    };
  }
  const params = new URLSearchParams(window.location.search);
  const age = params.get(QUERY_KEY.age);
  const sortBy = params.get(QUERY_KEY.sort);

  return {
    searchText: params.get(QUERY_KEY.q) ?? undefined,
    ageRange:
      age === "0-1" || age === "1-3" || age === "3-6" || age === "6+"
        ? age
        : undefined,
    categories: parseStringList(params.get(QUERY_KEY.cat)) as PlaceCategory[],
    features: parseStringList(params.get(QUERY_KEY.feat)) as PlaceFeature[],
    wards: parseStringList(params.get(QUERY_KEY.ward)),
    onlyFavorites: params.get(QUERY_KEY.fav) === "1",
    sortBy:
      sortBy === "relevance" || sortBy === "rating" || sortBy === "name"
        ? sortBy
        : "relevance",
  };
}

function encodeFiltersToParams(filters: PlaceFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.searchText?.trim()) {
    params.set(QUERY_KEY.q, filters.searchText.trim());
  }
  if (filters.ageRange) {
    params.set(QUERY_KEY.age, filters.ageRange);
  }
  if (filters.categories.length > 0) {
    params.set(QUERY_KEY.cat, filters.categories.join(","));
  }
  if (filters.features.length > 0) {
    params.set(QUERY_KEY.feat, filters.features.join(","));
  }
  if (filters.wards && filters.wards.length > 0) {
    params.set(QUERY_KEY.ward, filters.wards.join(","));
  }
  if (filters.onlyFavorites) {
    params.set(QUERY_KEY.fav, "1");
  }
  if (filters.sortBy && filters.sortBy !== "relevance") {
    params.set(QUERY_KEY.sort, filters.sortBy);
  }
  return params;
}

export function useUrlFilters(): [PlaceFilters, React.Dispatch<React.SetStateAction<PlaceFilters>>] {
  const [filters, setFilters] = useState<PlaceFilters>(() => parseFiltersFromUrl());

  const stableFilters = useMemo(
    () => ({
      ...filters,
      categories: [...filters.categories],
      features: [...filters.features],
      wards: [...(filters.wards ?? [])],
    }),
    [filters],
  );

  useEffect(() => {
    const params = encodeFiltersToParams(stableFilters);
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [stableFilters]);

  return [filters, setFilters];
}
