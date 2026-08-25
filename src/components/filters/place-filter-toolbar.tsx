"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Search,
  Heart,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ageOptions,
  categoryOptions,
  featureOptions,
} from "@/data/place-options";
import type { Place, PlaceCategory, PlaceFeature, PlaceFilters } from "@/types/place";

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

const SORT_LABELS: Record<NonNullable<PlaceFilters["sortBy"]>, string> = {
  relevance: "推荐排序",
  rating: "评分从高到低",
  name: "名称 A-Z",
};

type SectionKey = "age" | "category" | "feature" | "ward";

type PlaceFilterToolbarProps = {
  filters: PlaceFilters;
  resultCount: number;
  places: Place[];
  onChange: (filters: PlaceFilters) => void;
};

export function PlaceFilterToolbar({
  filters,
  resultCount,
  places,
  onChange,
}: PlaceFilterToolbarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    age: false,
    category: false,
    feature: false,
    ward: false,
  });

  const wardOptions = useMemo(
    () => Array.from(new Set(places.map((p) => p.ward))).sort(),
    [places],
  );

  const activeCountBySection = useMemo(() => {
    return {
      age: filters.ageRange ? 1 : 0,
      category: filters.categories.length,
      feature: filters.features.length,
      ward: filters.wards.length,
    };
  }, [filters]);

  const activeCount =
    activeCountBySection.age +
    activeCountBySection.category +
    activeCountBySection.feature +
    activeCountBySection.ward +
    (filters.onlyFavorites ? 1 : 0) +
    (filters.searchText ? 1 : 0) +
    ((filters.sortBy ?? "relevance") !== "relevance" ? 1 : 0);

  const toggleSection = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleWard = useCallback(
    (ward: string) =>
      onChange({
        ...filters,
        wards: filters.wards.includes(ward)
          ? filters.wards.filter((w) => w !== ward)
          : [...filters.wards, ward],
      }),
    [filters, onChange],
  );

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
        wards: [],
        sortBy: "relevance",
      } as PlaceFilters),
    [onChange],
  );

  const removeCondition = useCallback(
    (type: string, value?: string) => {
      switch (type) {
        case "searchText":
          onChange({ ...filters, searchText: "" });
          break;
        case "onlyFavorites":
          onChange({ ...filters, onlyFavorites: false });
          break;
        case "sortBy":
          onChange({ ...filters, sortBy: "relevance" });
          break;
        case "ageRange":
          onChange({ ...filters, ageRange: undefined });
          break;
        case "category":
          onChange({
            ...filters,
            categories: filters.categories.filter((c) => c !== value),
          });
          break;
        case "feature":
          onChange({
            ...filters,
            features: filters.features.filter((f) => f !== value),
          });
          break;
        case "ward":
          onChange({
            ...filters,
            wards: filters.wards.filter((w) => w !== value),
          });
          break;
      }
    },
    [filters, onChange],
  );

  const ageLabel = useMemo(
    () => ageOptions.find((a) => a.id === filters.ageRange)?.label,
    [filters.ageRange],
  );

  const categoryLabel = (id: PlaceCategory) =>
    categoryOptions.find((c) => c.id === id)?.label ?? id;

  const featureLabel = (id: PlaceFeature) =>
    featureOptions.find((f) => f.id === id)?.label ?? id;

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

        {/* Active filters summary */}
        <ActiveFiltersBar
          filters={filters}
          activeCount={activeCount}
          ageLabel={ageLabel}
          categoryLabel={categoryLabel}
          featureLabel={featureLabel}
          onRemove={removeCondition}
          onReset={reset}
        />

        {/* Collapsible filter sections */}
        <div className="px-5 pb-3 space-y-2">
          <FilterSection
            title="年龄"
            activeCount={activeCountBySection.age}
            expanded={expanded.age}
            onToggle={() => toggleSection("age")}
          >
            <div className="flex flex-wrap gap-1.5">
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
          </FilterSection>

          <FilterSection
            title="分类"
            activeCount={activeCountBySection.category}
            expanded={expanded.category}
            onToggle={() => toggleSection("category")}
          >
            <div className="flex flex-wrap gap-1.5">
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
            </div>
          </FilterSection>

          <FilterSection
            title="特点"
            activeCount={activeCountBySection.feature}
            expanded={expanded.feature}
            onToggle={() => toggleSection("feature")}
          >
            <div className="flex flex-wrap gap-1.5">
              {featureOptions.map((feat) => (
                <FilterChip
                  key={feat.id}
                  active={filters.features.includes(feat.id)}
                  onClick={() => toggleFeature(feat.id)}
                >
                  {feat.label}
                </FilterChip>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="行政区"
            activeCount={activeCountBySection.ward}
            expanded={expanded.ward}
            onToggle={() => toggleSection("ward")}
          >
            <div className="flex flex-wrap gap-1.5 max-h-[112px] overflow-y-auto custom-scroll pr-1">
              {wardOptions.map((ward) => (
                <FilterChip
                  key={ward}
                  active={filters.wards.includes(ward)}
                  onClick={() => toggleWard(ward)}
                >
                  {ward}
                </FilterChip>
              ))}
            </div>
          </FilterSection>
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

        {/* Mobile active summary */}
        <div className="pointer-events-auto">
          <ActiveFiltersBar
            filters={filters}
            activeCount={activeCount}
            ageLabel={ageLabel}
            categoryLabel={categoryLabel}
            featureLabel={featureLabel}
            onRemove={removeCondition}
            onReset={reset}
            compact
          />
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
              <MobileFilterSection title="当前条件">
                <ActiveFiltersBar
                  filters={filters}
                  activeCount={activeCount}
                  ageLabel={ageLabel}
                  categoryLabel={categoryLabel}
                  featureLabel={featureLabel}
                  onRemove={removeCondition}
                  onReset={reset}
                  compact
                />
              </MobileFilterSection>

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

              <MobileFilterSection title="行政区">
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto custom-scroll pr-1">
                  {wardOptions.map((ward) => (
                    <FilterChip
                      key={ward}
                      active={filters.wards.includes(ward)}
                      onClick={() => toggleWard(ward)}
                    >
                      {ward}
                    </FilterChip>
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
    </>
  );
}

function ActiveFiltersBar({
  filters,
  activeCount,
  ageLabel,
  categoryLabel,
  featureLabel,
  onRemove,
  onReset,
  compact = false,
}: {
  filters: PlaceFilters;
  activeCount: number;
  ageLabel?: string;
  categoryLabel: (id: PlaceCategory) => string;
  featureLabel: (id: PlaceFeature) => string;
  onRemove: (type: string, value?: string) => void;
  onReset: () => void;
  compact?: boolean;
}) {
  const tags: { key: string; type: string; value?: string; label: string }[] = [];

  if (filters.searchText) {
    tags.push({ key: "search", type: "searchText", label: `🔍 ${filters.searchText}` });
  }
  if (filters.onlyFavorites) {
    tags.push({ key: "fav", type: "onlyFavorites", label: "❤️ 只看收藏" });
  }
  if (filters.ageRange && ageLabel) {
    tags.push({ key: "age", type: "ageRange", label: `👶 ${ageLabel}` });
  }
  filters.categories.forEach((id) =>
    tags.push({ key: `cat-${id}`, type: "category", value: id, label: categoryLabel(id) }),
  );
  filters.features.forEach((id) =>
    tags.push({ key: `feat-${id}`, type: "feature", value: id, label: featureLabel(id) }),
  );
  filters.wards.forEach((ward) =>
    tags.push({ key: `ward-${ward}`, type: "ward", value: ward, label: ward }),
  );
  if ((filters.sortBy ?? "relevance") !== "relevance") {
    tags.push({ key: "sort", type: "sortBy", label: `⇅ ${SORT_LABELS[filters.sortBy!]}` });
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-2 ${
        compact ? "flex-wrap" : "border-t border-brand-100"
      } ${compact ? "px-0 py-0" : "px-5 py-2"}`}
    >
      <span
        className={`flex-none rounded-full bg-brand-50 px-2 py-1 text-xs font-black text-brand-700 ${
          compact ? "mt-0.5" : "mt-0.5"
        }`}
      >
        已选 {activeCount}
      </span>
      <div className={`flex flex-wrap gap-1.5 ${compact ? "flex-1" : "flex-1"}`}>
        {tags.map((tag) => (
          <button
            key={tag.key}
            type="button"
            onClick={() => onRemove(tag.type, tag.value)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white px-2.5 py-1 text-xs font-bold text-brand-700 transition hover:border-brand-accent hover:text-brand-accent"
          >
            {tag.label}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="flex-none inline-flex items-center gap-1 text-xs font-bold text-brand-accentHover hover:underline mt-0.5"
      >
        <RotateCcw className="h-3 w-3" />
        {!compact && "清空"}
      </button>
    </div>
  );
}

function FilterSection({
  title,
  activeCount,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  activeCount: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-brand-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-brand-50 hover:bg-brand-100 transition"
      >
        <span className="flex items-center gap-2 text-xs font-black text-brand-700">
          {title}
          {activeCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-black text-white">
              {activeCount}
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-brand-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-brand-500" />
        )}
      </button>
      {expanded && <div className="px-3 py-2 bg-white">{children}</div>}
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
