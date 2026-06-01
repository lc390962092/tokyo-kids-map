"use client";

import type { ReactNode } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { ageOptions, categoryOptions, featureOptions } from "@/data/place-options";
import type { PlaceCategory, PlaceFeature, PlaceFilters } from "@/types/place";

type PlaceFilterPanelProps = {
  filters: PlaceFilters;
  onChange: (filters: PlaceFilters) => void;
  resultCount: number;
};

export function PlaceFilterPanel({
  filters,
  onChange,
  resultCount,
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
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ categories: [], features: [] })}
          className="grid h-10 w-10 place-items-center rounded-full border border-[#f4d9cc] bg-white text-[#9a6f61] shadow-sm transition hover:bg-[#fff2eb]"
          aria-label="重置筛选"
          title="重置筛选"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

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
