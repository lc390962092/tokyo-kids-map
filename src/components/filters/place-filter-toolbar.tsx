"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Search,
  Heart,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react";
import {
  ageOptions,
  categoryOptions,
  featureOptions,
} from "@/data/place-options";
import type { PlaceCategory, PlaceFeature, PlaceFilters } from "@/types/place";

const MOBILE_FEATURE_IDS: PlaceFeature[] = [
  "free",
  "rainy_day",
  "stroller_friendly",
  "parking_easy",
];
const MOBILE_CATEGORY_IDS: PlaceCategory[] = [
  "park",
  "zoo",
  "aquarium",
  "museum",
  "indoor_play",
];

type PlaceFilterToolbarProps = {
  filters: PlaceFilters;
  resultCount: number;
  onChange: (filters: PlaceFilters) => void;
};

export function PlaceFilterToolbar({
  filters,
  resultCount,
  onChange,
}: PlaceFilterToolbarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const activeCount = useMemo(() => {
    return (
      (filters.ageRange ? 1 : 0) +
      filters.categories.length +
      filters.features.length +
      (filters.onlyFavorites ? 1 : 0)
    );
  }, [filters]);

  const setSearch = useCallback(
    (searchText: string) => onChange({ ...filters, searchText }),
    [filters, onChange],
  );

  const toggleAge = useCallback(
    (age: PlaceFilters["ageRange"]) =>
      onChange({ ...filters, ageRange: filters.ageRange === age ? undefined : age }),
    [filters, onChange],
  );

  const toggleCategory = useCallback(
    (category: PlaceCategory) =>
      onChange({
        ...filters,
        categories: filters.categories.includes(category)
          ? filters.categories.filter((c) => c !== category)
          : [...filters.categories, category],
      }),
    [filters, onChange],
  );

  const toggleFeature = useCallback(
    (feature: PlaceFeature) =>
      onChange({
        ...filters,
        features: filters.features.includes(feature)
          ? filters.features.filter((f) => f !== feature)
          : [...filters.features, feature],
      }),
    [filters, onChange],
  );

  const setSort = useCallback(
    (sortBy: PlaceFilters["sortBy"]) => onChange({ ...filters, sortBy }),
    [filters, onChange],
  );

  const setOnlyFavorites = useCallback(
    (onlyFavorites: boolean) => onChange({ ...filters, onlyFavorites }),
    [filters, onChange],
  );

  const reset = useCallback(
    () =>
      onChange({
        categories: [],
        features: [],
        sortBy: "relevance",
      }),
    [onChange],
  );

  const hasActiveFilters = activeCount > 0;

  return (
    <>
      {/* Desktop toolbar */}
      <header className="hidden lg:flex flex-none flex-col border-b border-brand-100 bg-white z-20">
        <div className="px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-none">
            <span className="text-2xl">🗾</span>
            <div>
              <h1 className="text-lg font-black leading-tight text-brand-800">
                东京溜娃地图
              </h1>
              <p className="text-xs font-medium text-brand-500">
                Tokyo Kids Map · {resultCount} 个地点
              </p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-400" />
            <input
              type="text"
              value={filters.searchText ?? ""}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="搜索地点、车站、行政区..."
              className={`w-full rounded-full border bg-brand-50 py-2 pl-9 pr-4 text-sm font-medium outline-none transition ${
                searchFocus
                  ? "border-brand-accent bg-white ring-2 ring-brand-accent/20"
                  : "border-transparent"
              }`}
            />
          </div>

          <div className="flex items-center gap-2 flex-none">
            <button
              type="button"
              onClick={() => setOnlyFavorites(!filters.onlyFavorites)}
              className={`chip flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition ${
                filters.onlyFavorites
                  ? "border-brand-accent bg-brand-accent text-white"
                  : "border-brand-200 bg-white text-brand-600"
              }`}
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={filters.onlyFavorites ? "currentColor" : "none"}
              />
              只看收藏
            </button>
            <select
              value={filters.sortBy ?? "relevance"}
              onChange={(e) =>
                setSort(e.target.value as PlaceFilters["sortBy"])
              }
              className="rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-600 outline-none"
            >
              <option value="relevance">推荐</option>
              <option value="rating">评分</option>
              <option value="name">A-Z</option>
            </select>
          </div>
        </div>

        <div className="px-5 pb-3 flex items-center gap-5 overflow-x-auto scrollbar-hide">
          <FilterChipGroup label="年龄">
            {ageOptions.map((age) => (
              <FilterChip
                key={age.id}
                active={filters.ageRange === age.id}
                onClick={() => toggleAge(age.id)}
              >
                {age.label}
              </FilterChip>
            ))}
          </FilterChipGroup>

          <FilterChipGroup label="分类">
            {categoryOptions.slice(0, 7).map((cat) => (
              <FilterChip
                key={cat.id}
                active={filters.categories.includes(cat.id)}
                onClick={() => toggleCategory(cat.id)}
                style={
                  filters.categories.includes(cat.id)
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                {cat.label}
              </FilterChip>
            ))}
          </FilterChipGroup>

          <FilterChipGroup label="特点">
            {featureOptions.map((feat) => (
              <FilterChip
                key={feat.id}
                active={filters.features.includes(feat.id)}
                onClick={() => toggleFeature(feat.id)}
              >
                {feat.label}
              </FilterChip>
            ))}
          </FilterChipGroup>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-xs font-bold text-brand-accentHover hover:underline flex-none"
            >
              <RotateCcw className="h-3 w-3" />
              重置
            </button>
          )}
        </div>
      </header>

      {/* Mobile top bar */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 p-3 space-y-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-400" />
            <input
              type="text"
              value={filters.searchText ?? ""}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索地点、车站、行政区..."
              className="w-full rounded-full border border-brand-200 bg-white/95 py-2 pl-9 pr-4 text-sm font-medium shadow-sm outline-none backdrop-blur focus:border-brand-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyFavorites(!filters.onlyFavorites)}
            className={`h-10 w-10 rounded-full border border-brand-200 bg-white/95 flex items-center justify-center shadow-sm backdrop-blur transition ${
              filters.onlyFavorites ? "text-red-500" : "text-brand-400"
            }`}
            aria-label="只看收藏"
          >
            <Heart
              className="h-5 w-5"
              fill={filters.onlyFavorites ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="relative h-10 w-10 rounded-full border border-brand-200 bg-white/95 flex items-center justify-center shadow-sm backdrop-blur text-brand-600"
            aria-label="更多筛选"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-black text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pointer-events-auto pb-1">
          {ageOptions.map((age) => (
            <FilterChip
              key={age.id}
              active={filters.ageRange === age.id}
              onClick={() => toggleAge(age.id)}
            >
              {age.label}
            </FilterChip>
          ))}
          {featureOptions
            .filter((f) => MOBILE_FEATURE_IDS.includes(f.id))
            .map((feat) => (
              <FilterChip
                key={feat.id}
                active={filters.features.includes(feat.id)}
                onClick={() => toggleFeature(feat.id)}
              >
                {feat.label}
              </FilterChip>
            ))}
          {categoryOptions
            .filter((c) => MOBILE_CATEGORY_IDS.includes(c.id))
            .map((cat) => (
              <FilterChip
                key={cat.id}
                active={filters.categories.includes(cat.id)}
                onClick={() => toggleCategory(cat.id)}
                style={
                  filters.categories.includes(cat.id)
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                {cat.label}
              </FilterChip>
            ))}
        </div>
      </div>

      {/* Mobile filter modal */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex items-end bg-black/20 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full flex-col rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-black text-brand-800">筛选</h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-1 custom-scroll">
              <MobileFilterSection title="分类">
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => (
                    <FilterChip
                      key={cat.id}
                      active={filters.categories.includes(cat.id)}
                      onClick={() => toggleCategory(cat.id)}
                      style={
                        filters.categories.includes(cat.id)
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : undefined
                      }
                    >
                      {cat.label}
                    </FilterChip>
                  ))}
                </div>
              </MobileFilterSection>

              <MobileFilterSection title="年龄">
                <div className="flex flex-wrap gap-2">
                  {ageOptions.map((age) => (
                    <FilterChip
                      key={age.id}
                      active={filters.ageRange === age.id}
                      onClick={() => toggleAge(age.id)}
                    >
                      {age.label}
                    </FilterChip>
                  ))}
                </div>
              </MobileFilterSection>

              <MobileFilterSection title="特点">
                <div className="space-y-2">
                  {featureOptions.map((feat) => (
                    <label
                      key={feat.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-200 bg-white px-3 py-2.5"
                    >
                      <span className="text-sm font-bold text-brand-600">
                        {feat.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={filters.features.includes(feat.id)}
                        onChange={() => toggleFeature(feat.id)}
                        className="h-5 w-5 accent-brand-accent"
                      />
                    </label>
                  ))}
                </div>
              </MobileFilterSection>

              <MobileFilterSection title="排序">
                <select
                  value={filters.sortBy ?? "relevance"}
                  onChange={(e) =>
                    setSort(e.target.value as PlaceFilters["sortBy"])
                  }
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-600"
                >
                  <option value="relevance">综合推荐</option>
                  <option value="rating">评分从高到低</option>
                  <option value="name">名称 A-Z</option>
                </select>
              </MobileFilterSection>
            </div>

            <div className="mt-4 flex gap-3 border-t border-brand-100 pt-4">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-full border border-brand-200 py-2.5 text-sm font-bold text-brand-600"
              >
                重置
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-full bg-brand-accent py-2.5 text-sm font-bold text-white shadow-md"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sort modal */}
      {mobileSortOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex items-end bg-black/20 backdrop-blur-sm">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl">
            <h3 className="mb-3 text-lg font-black text-brand-800">排序</h3>
            <div className="space-y-2">
              {[
                { value: "relevance", label: "综合推荐" },
                { value: "rating", label: "评分从高到低" },
                { value: "name", label: "名称 A-Z" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSort(opt.value as PlaceFilters["sortBy"]);
                    setMobileSortOpen(false);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    filters.sortBy === opt.value
                      ? "border-brand-accent bg-brand-accent text-white"
                      : "border-brand-200 bg-white text-brand-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMobileSortOpen(false)}
              className="mt-4 w-full rounded-full bg-brand-50 py-3 text-sm font-bold text-brand-600"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-none">
      <span className="text-xs font-black text-brand-700">{label}</span>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition ${
        active
          ? "border-brand-accent bg-brand-accent text-white"
          : "border-brand-200 bg-white text-brand-600 hover:bg-brand-50"
      }`}
    >
      {children}
    </button>
  );
}

function MobileFilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2 text-sm font-black text-brand-700">{title}</h4>
      {children}
    </section>
  );
}
