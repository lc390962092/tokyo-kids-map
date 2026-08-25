"use client";

import type { ReactNode } from "react";
import { RotateCcw, SlidersHorizontal, Calendar, MapPin, X } from "lucide-react";
import { ageOptions, categoryOptions, featureOptions } from "@/data/place-options";
import { defaultFilters } from "@/lib/place-filters";
import type { PlaceCategory, PlaceFeature, PlaceFilters } from "@/types/place";
import type { Playdate } from "@/types/playdate";

type PlaceFilterPanelProps = {
  filters: PlaceFilters;
  onChange: (filters: PlaceFilters) => void;
  resultCount: number;
  totalPlaces?: number;
  pendingGeoCount?: number;
  nearbyPlaydates?: Playdate[];
  onSelectPlaydate?: (playdate: Playdate) => void;
  headerSlot?: ReactNode;
};

export function PlaceFilterPanel({
  filters,
  onChange,
  resultCount,
  totalPlaces,
  pendingGeoCount = 0,
  nearbyPlaydates = [],
  onSelectPlaydate,
  headerSlot,
}: PlaceFilterPanelProps) {
  const toggleCategory = (category: PlaceCategory) => {
    onChange({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter((item) => item !== category)
        : [...filters.categories, category],
    });
  };

  const toggleFeature = (feature: PlaceFeature) => {
    onChange({
      ...filters,
      features: filters.features.includes(feature)
        ? filters.features.filter((item) => item !== feature)
        : [...filters.features, feature],
    });
  };

  const removeCondition = (type: string, value?: string) => {
    switch (type) {
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
      case "onlyFavorites":
        onChange({ ...filters, onlyFavorites: false });
        break;
      case "searchText":
        onChange({ ...filters, searchText: "" });
        break;
      case "sortBy":
        onChange({ ...filters, sortBy: "relevance" });
        break;
    }
  };

  const categoryLabel = (id: PlaceCategory) =>
    categoryOptions.find((c) => c.id === id)?.label ?? id;

  const featureLabel = (id: PlaceFeature) =>
    featureOptions.find((f) => f.id === id)?.label ?? id;

  const ageLabel = ageOptions.find((a) => a.id === filters.ageRange)?.label;

  const activeTags: { key: string; type: string; value?: string; label: string }[] = [];

  if (filters.searchText) {
    activeTags.push({ key: "search", type: "searchText", label: `🔍 ${filters.searchText}` });
  }
  if (filters.onlyFavorites) {
    activeTags.push({ key: "fav", type: "onlyFavorites", label: "❤️ 只看收藏" });
  }
  if (filters.ageRange && ageLabel) {
    activeTags.push({ key: "age", type: "ageRange", label: `👶 ${ageLabel}` });
  }
  filters.categories.forEach((id) =>
    activeTags.push({ key: `cat-${id}`, type: "category", value: id, label: categoryLabel(id) }),
  );
  filters.features.forEach((id) =>
    activeTags.push({ key: `feat-${id}`, type: "feature", value: id, label: featureLabel(id) }),
  );
  filters.wards.forEach((ward) =>
    activeTags.push({ key: `ward-${ward}`, type: "ward", value: ward, label: ward }),
  );
  if ((filters.sortBy ?? "relevance") !== "relevance") {
    const sortLabel =
      filters.sortBy === "rating" ? "评分从高到低" : filters.sortBy === "name" ? "名称 A-Z" : "";
    activeTags.push({ key: "sort", type: "sortBy", label: `⇅ ${sortLabel}` });
  }

  return (
    <aside className="flex h-full flex-col gap-6 rounded-none bg-[#fffaf4] p-5 md:border-r md:border-[#f6ded2] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#f27d68]">
            <SlidersHorizontal className="h-4 w-4" />
            筛选地点
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-[#2c3834]">
            东京溜娃地图
          </h1>
          <p className="mt-1 text-sm font-medium text-[#8a6b5e]">
            Tokyo Kids Map · {resultCount} 个地点
            {pendingGeoCount > 0 && (
              <span className="ml-1 text-[#ff8c73]">· {pendingGeoCount} 个待定位</span>
            )}
            {totalPlaces !== undefined && (
              <span className="ml-1 text-xs text-[#c4a99b]">(共 {totalPlaces} 条)</span>
            )}
          </p>
          {headerSlot}
        </div>
        <button
          type="button"
          onClick={() => onChange(defaultFilters)}
          className="grid h-10 w-10 place-items-center rounded-full border border-[#f4d9cc] bg-white text-[#9a6f61] shadow-sm transition hover:bg-[#fff2eb]"
          aria-label="重置筛选"
          title="重置筛选"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {activeTags.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-black text-[#3b4a45]">当前条件</h2>
          <div className="flex flex-wrap gap-2">
            {activeTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={() => removeCondition(tag.type, tag.value)}
                className="inline-flex items-center gap-1 rounded-full border border-[#f2d8cb] bg-white px-3 py-1.5 text-xs font-bold text-[#76584e] shadow-sm transition hover:border-[#ff8c73] hover:text-[#ff8c73]"
              >
                {tag.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </section>
      )}

      <FilterSection title="年龄">
        <div className="grid grid-cols-2 gap-2">
          {ageOptions.map((age) => (
            <button
              key={age.id}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  ageRange: filters.ageRange === age.id ? undefined : age.id,
                })
              }
              className={`h-11 rounded-full border px-4 text-sm font-bold transition ${
                filters.ageRange === age.id
                  ? "border-[#ff8c73] bg-[#ff8c73] text-white shadow-md shadow-[#ff8c73]/20"
                  : "border-[#f2d8cb] bg-white text-[#76584e] hover:bg-[#fff0e8]"
              }`}
            >
              {age.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="分类">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.slice(0, 7).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                filters.categories.includes(category.id)
                  ? "border-transparent text-white shadow-sm"
                  : "border-[#f2d8cb] bg-white text-[#76584e] hover:bg-[#fff0e8]"
              }`}
              style={
                filters.categories.includes(category.id)
                  ? { backgroundColor: category.color }
                  : undefined
              }
            >
              {category.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="特点">
        <div className="grid gap-2">
          {featureOptions.map((feature) => (
            <label
              key={feature.id}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#f2d8cb] bg-white px-4 py-3 text-sm font-bold text-[#76584e] shadow-sm"
            >
              <span>{feature.label}</span>
              <input
                type="checkbox"
                checked={filters.features.includes(feature.id)}
                onChange={() => toggleFeature(feature.id)}
                className="h-5 w-5 accent-[#ff8c73]"
              />
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={`附近约伴 (${nearbyPlaydates.length})`}>
        <div className="space-y-2">
          {nearbyPlaydates.length === 0 && (
            <p className="text-sm text-[#c4a99b]">当前范围暂无约伴</p>
          )}
          {nearbyPlaydates.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPlaydate?.(p)}
              className="w-full rounded-2xl border border-[#ffe0ce] bg-white p-3 text-left transition hover:bg-[#fffaf4]"
            >
              <div className="text-sm font-black text-[#2c3834] line-clamp-1">
                {p.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#76584e]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#ff8c73]" />
                  {new Date(p.meet_at).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#ff8c73]" />
                  {p.latitude.toFixed(3)}, {p.longitude.toFixed(3)}
                </span>
              </div>
            </button>
          ))}
          {nearbyPlaydates.length > 5 && (
            <p className="text-center text-xs text-[#c4a99b]">
              还有 {nearbyPlaydates.length - 5} 个约伴...
            </p>
          )}
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-black text-[#3b4a45]">{title}</h2>
      {children}
    </section>
  );
}
