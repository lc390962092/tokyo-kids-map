"use client";

import { Heart, MapPin } from "lucide-react";
import { getCategoryLabel } from "@/data/place-options";
import type { Place } from "@/types/place";

type PlaceCardProps = {
  place: Place;
  variant?: "list" | "card";
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onSelect?: () => void;
};

export function PlaceCard({
  place,
  variant = "card",
  isFavorited = false,
  onToggleFavorite,
  onSelect,
}: PlaceCardProps) {
  const categoryLabel = getCategoryLabel(place.category);

  const tags: { label: string; className: string }[] = [
    place.freeEntry ? { label: "免费", className: "bg-[#e8f5ee] text-[#46b37b]" } : null,
    place.rainyDay ? { label: "雨天", className: "bg-[#eef4fb] text-[#4a9bd8]" } : null,
    place.indoor ? { label: "室内", className: "bg-[#fff5e8] text-[#f3b23f]" } : null,
  ].filter((t): t is { label: string; className: string } => Boolean(t));

  if (variant === "list") {
    return (
      <div
        className="group flex gap-3 rounded-2xl border border-[#e9ddd5] bg-white p-3 transition hover:border-[#ff8c73] cursor-pointer"
        onClick={onSelect}
      >
        <div
          className="h-20 w-20 flex-none overflow-hidden rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${place.imageUrl})` }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-1">
            <h3 className="truncate text-sm font-black text-[#2c3834]">
              {place.nameZh}
            </h3>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`flex-none rounded-full p-1 transition ${
                  isFavorited
                    ? "text-red-500"
                    : "text-[#c4a99b] hover:text-red-500"
                }`}
                aria-label={isFavorited ? "取消收藏" : "收藏"}
              >
                <Heart
                  className="h-4 w-4"
                  fill={isFavorited ? "currentColor" : "none"}
                />
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium text-[#8a6b5e]">
            {place.ward} · {categoryLabel}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-[#76584e]">
            {place.description}
          </p>
          <div className="mt-auto flex items-center gap-1 pt-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tag.className}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-64 flex-shrink-0 overflow-hidden rounded-2xl border border-[#f2d8cb] bg-white shadow-sm transition hover:border-[#ff8c73]"
      onClick={onSelect}
    >
      <div className="relative h-28 bg-gray-100">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${place.imageUrl})` }}
        />
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm transition ${
              isFavorited ? "text-red-500" : "text-[#c4a99b] hover:text-red-500"
            }`}
            aria-label={isFavorited ? "取消收藏" : "收藏"}
          >
            <Heart className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="p-3">
        <h4 className="truncate text-sm font-black text-[#2c3834]">
          {place.nameZh}
        </h4>
        <p className="mt-0.5 text-xs text-[#8a6b5e]">
          {place.ward} · {categoryLabel}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-[#76584e]">
          {place.description}
        </p>
        <div className="mt-2 flex gap-1">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tag.className}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlaceListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <MapPin className="h-8 w-8 text-[#ff8c73]" />
      <h3 className="mt-3 text-sm font-black text-[#2c3834]">没有匹配地点</h3>
      <p className="mt-1 text-xs font-medium text-[#80675b]">
        换个关键词或少选几个条件试试
      </p>
    </div>
  );
}
