# P0: 搜索 + 筛选 + 收藏 详细实现方案

> 状态：实现中（2026-08-25）
>
> 进度：
> - [x] 搜索框（名称/地址/车站/描述）
> - [x] 年龄、分类、特点筛选
> - [x] 只看收藏
> - [x] 排序（推荐/评分/名称）
> - [x] 桌面端/移动端筛选 UI
> - [x] URL query string 状态同步
> - [x] 行政区（ward）多选筛选
> - [ ] 最低评分筛选
> - [ ] 搜索历史/热门推荐
> 目标：基于当前工程现状，把搜索、多维筛选、排序、收藏闭环补全
> 数据量：131 地点（当前适合客户端过滤；后续 500+ 再迁后端）

---

## 一、现状分析

### 已有基础（可直接复用）

| 模块 | 现状 |
|------|------|
| 数据模型 | `Place` / `PlaceRecord` 字段丰富：category、ward、ageMin/Max、indoor、rainyDay、freeEntry、strollerScore、diaperScore、parkingScore、playScore、description、tips 等 |
| 分类 | 10 个 `PlaceCategory` |
| 特点 | 4 个 `PlaceFeature`（free / rainy_day / stroller_friendly / parking_easy） |
| 筛选函数 | `lib/place-filters.ts` 已支持 ageRange + categories + features |
| 筛选 UI | `PlaceFilterPanel` 有年龄、分类、特点三栏 |
| 收藏表 | `favorites` 表 + RLS + API + 组件 + 会员中心页面 已存在 |
| 地图 Marker | 已接入 `favoriteIds` 显示收藏状态 |

### 当前缺失

1. **搜索框**：无法按名称、地址、最近车站、描述搜索
2. **ward 筛选**：无法按区筛选
3. **评分筛选**：无法按 stroller / diaper / parking / play 评分区间筛选
4. **排序**：默认无排序，结果顺序固定
5. **只看收藏**：地图上不能一键「只看我收藏的地点」
6. **URL 状态**：筛选条件不能通过 URL 分享/保存
7. **搜索历史/热门**：无

---

## 二、数据模型设计

### 2.1 地点表（现有，无需改动）

```sql
CREATE TABLE places (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name_zh text NOT NULL,
  name_ja text NOT NULL,
  category text NOT NULL,
  ward text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text,
  nearest_station text,
  age_min int,
  age_max int,
  indoor boolean DEFAULT false,
  rainy_day boolean DEFAULT false,
  free_entry boolean DEFAULT false,
  stroller_score int,
  diaper_score int,
  parking_score int,
  play_score int,
  description text,
  tips text,
  image_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### 2.2 收藏表（现有，无需改动）

```sql
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE USING (auth.uid() = user_id);
```

### 2.3 新增：搜索历史表（可选，本地 localStorage 先更简单）

如果要做「跨设备搜索历史」再建表。P0 建议先用 `localStorage` 做搜索历史，降低复杂度。

**跨设备方案（P1）**：

```sql
CREATE TABLE search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  result_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, keyword)
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_history_select_own" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert_own" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_history_delete_own" ON search_history FOR DELETE USING (auth.uid() = user_id);
```

---

## 三、类型定义扩展

### 3.1 扩展 `PlaceFilters`

文件：`src/types/place.ts`

```typescript
export type PlaceFilters = {
  query?: string;                 // 搜索关键词
  ageRange?: "0-1" | "1-3" | "3-6" | "6+";
  categories: PlaceCategory[];
  features: PlaceFeature[];
  wards: string[];                // 新增：区多选
  minScores?: {                   // 新增：最低评分
    stroller?: number;
    diaper?: number;
    parking?: number;
    play?: number;
  };
  onlyFavorites?: boolean;        // 新增：只看收藏
  sortBy?: "relevance" | "distance" | "rating" | "name" | "newest";
  sortOrder?: "asc" | "desc";
};
```

### 3.2 新增搜索相关类型

```typescript
export type SearchHistoryItem = {
  keyword: string;
  timestamp: number;
};

export type FilterStats = {
  total: number;
  filtered: number;
  byCategory: Record<PlaceCategory, number>;
};
```

---

## 四、筛选逻辑增强

### 4.1 扩展 `defaultFilters`

文件：`src/lib/place-filters.ts`

```typescript
export const defaultFilters: PlaceFilters = {
  categories: [],
  features: [],
  wards: [],
  minScores: {},
  onlyFavorites: false,
  sortBy: "relevance",
  sortOrder: "desc",
};
```

### 4.2 核心筛选函数

```typescript
import { ageOptions } from "@/data/place-options";
import type { Place, PlaceFilters } from "@/types/place";

export function filterPlaces(
  places: Place[],
  filters: PlaceFilters,
  options?: {
    center?: { lat: number; lng: number };
    favoriteIds?: Set<string>;
  }
): Place[] {
  const { center, favoriteIds } = options ?? {};

  let result = places.filter((place) => {
    // 1. 年龄
    if (filters.ageRange) {
      const option = ageOptions.find((age) => age.id === filters.ageRange);
      if (option && (place.ageMin > option.max || place.ageMax < option.min)) {
        return false;
      }
    }

    // 2. 分类
    if (filters.categories.length > 0 && !filters.categories.includes(place.category)) {
      return false;
    }

    // 3. 特点（free / rainy_day / stroller_friendly / parking_easy）
    const passFeatures = filters.features.every((feature) => {
      if (feature === "free") return place.freeEntry;
      if (feature === "rainy_day") return place.rainyDay;
      if (feature === "stroller_friendly") return place.strollerScore >= 4;
      if (feature === "parking_easy") return place.parkingScore >= 4;
      return true;
    });
    if (!passFeatures) return false;

    // 4. 区
    if (filters.wards.length > 0 && !filters.wards.includes(place.ward)) {
      return false;
    }

    // 5. 最低评分
    const ms = filters.minScores ?? {};
    if (ms.stroller && (place.strollerScore ?? 0) < ms.stroller) return false;
    if (ms.diaper && (place.diaperScore ?? 0) < ms.diaper) return false;
    if (ms.parking && (place.parkingScore ?? 0) < ms.parking) return false;
    if (ms.play && (place.playScore ?? 0) < ms.play) return false;

    // 6. 只看收藏
    if (filters.onlyFavorites && !favoriteIds?.has(place.id)) {
      return false;
    }

    // 7. 关键词搜索
    if (filters.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      const text = [
        place.nameZh,
        place.nameJa,
        place.address,
        place.nearestStation,
        place.description,
        place.tips,
        getCategoryLabel(place.category),
        place.ward,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!text.includes(q)) return false;
    }

    return true;
  });

  // 8. 排序
  result = sortPlaces(result, filters, center);

  return result;
}

function sortPlaces(
  places: Place[],
  filters: PlaceFilters,
  center?: { lat: number; lng: number }
): Place[] {
  const sortBy = filters.sortBy ?? "relevance";
  const order = filters.sortOrder ?? "desc";

  const sorted = [...places].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.nameZh.localeCompare(b.nameZh, "zh-CN");
        break;
      case "rating": {
        const scoreA = (a.playScore + a.strollerScore + a.diaperScore + a.parkingScore) / 4;
        const scoreB = (b.playScore + b.strollerScore + b.diaperScore + b.parkingScore) / 4;
        comparison = scoreA - scoreB;
        break;
      }
      case "distance":
        if (center) {
          comparison = haversineDistance(center, a) - haversineDistance(center, b);
        }
        break;
      case "newest":
        comparison = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        break;
      case "relevance":
      default:
        // 默认按综合评分 + 游玩评分
        comparison = a.playScore - b.playScore;
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

function haversineDistance(
  center: { lat: number; lng: number },
  place: Place
): number {
  const R = 6371000;
  const dLat = ((place.latitude - center.lat) * Math.PI) / 180;
  const dLon = ((place.longitude - center.lng) * Math.PI) / 180;
  const lat1 = (center.lat * Math.PI) / 180;
  const lat2 = (place.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### 4.3 新增：筛选统计

```typescript
export function getFilterStats(places: Place[]) {
  const byCategory = places.reduce((acc, place) => {
    acc[place.category] = (acc[place.category] ?? 0) + 1;
    return acc;
  }, {} as Record<PlaceCategory, number>);

  const wards = Array.from(new Set(places.map((p) => p.ward))).sort();

  return { total: places.length, byCategory, wards };
}
```

---

## 五、搜索 UI 组件

### 5.1 搜索框组件

文件：`src/components/search/search-box.tsx`

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";

const HOT_KEYWORDS = ["上野", "晴天", "雨天", "免费", "婴儿车", "室内"];

export function SearchBox({
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedValue = useDebounce(inputValue, 250);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const history = useSearchHistory();
  const suggestions = inputValue.trim()
    ? []
    : [...history.slice(0, 5), ...HOT_KEYWORDS.filter((k) => !history.includes(k))].slice(0, 6);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-[#c4a99b]" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setShowSuggestions(true);
            onFocus?.();
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 150);
            onBlur?.();
          }}
          placeholder="搜索地点、区域、车站、关键词..."
          className="w-full rounded-full border border-[#f2d8cb] bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-[#2c3834] shadow-sm placeholder:text-[#c4a99b] focus:border-[#ff8c73] focus:outline-none focus:ring-2 focus:ring-[#ff8c73]/20"
        />
        {inputValue && (
          <button
            onClick={() => setInputValue("")}
            className="absolute right-3 text-[#c4a99b] hover:text-[#76584e]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-2xl border border-[#f2d8cb] bg-white p-2 shadow-lg">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(item);
                setShowSuggestions(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#76584e] hover:bg-[#fffaf4]"
            >
              {history.includes(item) ? (
                <Clock className="h-3.5 w-3.5 text-[#c4a99b]" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-[#ff8c73]" />
              )}
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.2 localStorage 搜索历史 Hook

文件：`src/lib/hooks/use-search-history.ts`

```typescript
import { useState, useEffect } from "react";

const STORAGE_KEY = "tkm-search-history";
const MAX_ITEMS = 8;

export function useSearchHistory(): string[] {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  return history;
}

export function saveSearchHistory(keyword: string) {
  if (!keyword.trim()) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [keyword.trim(), ...list.filter((k) => k !== keyword.trim())].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## 六、筛选面板扩展

### 6.1 扩展 `PlaceFilterPanel`

新增区块：
1. 顶部搜索框
2. 只看收藏开关（登录后显示）
3. 区（ward）多选折叠面板
4. 评分筛选（Slider / 星级按钮）
5. 排序选择

```tsx
// 新增：只看收藏
<div className="flex items-center justify-between rounded-2xl border border-[#f2d8cb] bg-white px-4 py-3">
  <span className="text-sm font-bold text-[#76584e]">只看我的收藏</span>
  <button
    onClick={() => onChange({ ...filters, onlyFavorites: !filters.onlyFavorites })}
    className={`relative h-6 w-11 rounded-full transition ${
      filters.onlyFavorites ? "bg-[#ff8c73]" : "bg-[#f2d8cb]"
    }`}
  >
    <span
      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
        filters.onlyFavorites ? "left-6" : "left-1"
      }`}
    />
  </button>
</div>

// 新增：排序
<FilterSection title="排序">
  <select
    value={`${filters.sortBy}-${filters.sortOrder}`}
    onChange={(e) => {
      const [sortBy, sortOrder] = e.target.value.split("-") as [PlaceFilters["sortBy"], "asc" | "desc"];
      onChange({ ...filters, sortBy, sortOrder });
    }}
    className="w-full rounded-xl border border-[#f2d8cb] bg-white px-3 py-2.5 text-sm font-medium text-[#76584e]"
  >
    <option value="relevance-desc">综合推荐</option>
    <option value="rating-desc">评分从高到低</option>
    <option value="distance-asc">距离最近</option>
    <option value="name-asc">名称 A-Z</option>
    <option value="newest-desc">最新添加</option>
  </select>
</FilterSection>

// 新增：区多选
<FilterSection title={`区 (${wardOptions.length})`}>
  <div className="flex flex-wrap gap-2">
    {wardOptions.map((ward) => (
      <button
        key={ward}
        onClick={() => toggleWard(ward)}
        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
          filters.wards.includes(ward)
            ? "border-[#ff8c73] bg-[#ff8c73] text-white"
            : "border-[#f2d8cb] bg-white text-[#76584e] hover:bg-[#fff0e8]"
        }`}
      >
        {ward}
      </button>
    ))}
  </div>
</FilterSection>

// 新增：评分筛选
<FilterSection title="最低评分">
  {[
    { key: "play", label: "好玩度" },
    { key: "stroller", label: "推车友好" },
    { key: "diaper", label: "换尿布便利" },
    { key: "parking", label: "停车方便" },
  ].map(({ key, label }) => (
    <div key={key} className="mb-2 flex items-center justify-between">
      <span className="text-xs font-medium text-[#76584e]">{label}</span>
      <StarRatingInput
        value={filters.minScores?.[key as keyof typeof filters.minScores] ?? 0}
        onChange={(value) =>
          onChange({
            ...filters,
            minScores: { ...filters.minScores, [key]: value || undefined },
          })
        }
      />
    </div>
  ))}
</FilterSection>
```

### 6.2 StarRatingInput 组件

```tsx
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          className={`text-sm ${star <= value ? "text-[#ff8c73]" : "text-[#f2d8cb]"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

---

## 七、URL Query 同步

目标：刷新或分享链接时保留筛选状态。

### 7.1 URL ↔ State 转换

文件：`src/lib/filter-url.ts`

```typescript
import type { PlaceFilters } from "@/types/place";

export function filtersToQuery(filters: PlaceFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (filters.query?.trim()) q.q = filters.query.trim();
  if (filters.ageRange) q.age = filters.ageRange;
  if (filters.categories.length > 0) q.cat = filters.categories.join(",");
  if (filters.features.length > 0) q.feature = filters.features.join(",");
  if (filters.wards.length > 0) q.ward = filters.wards.join(",");
  if (filters.minScores?.stroller) q.s_stroller = String(filters.minScores.stroller);
  if (filters.minScores?.diaper) q.s_diaper = String(filters.minScores.diaper);
  if (filters.minScores?.parking) q.s_parking = String(filters.minScores.parking);
  if (filters.minScores?.play) q.s_play = String(filters.minScores.play);
  if (filters.onlyFavorites) q.fav = "1";
  if (filters.sortBy && filters.sortBy !== "relevance") q.sort = filters.sortBy;
  if (filters.sortOrder && filters.sortOrder !== "desc") q.order = filters.sortOrder;
  return q;
}

export function queryToFilters(searchParams: URLSearchParams): PlaceFilters {
  return {
    query: searchParams.get("q") ?? undefined,
    ageRange: (searchParams.get("age") as PlaceFilters["ageRange"]) ?? undefined,
    categories: (searchParams.get("cat")?.split(",") ?? []) as PlaceCategory[],
    features: (searchParams.get("feature")?.split(",") ?? []) as PlaceFeature[],
    wards: searchParams.get("ward")?.split(",") ?? [],
    minScores: {
      stroller: parseScore(searchParams.get("s_stroller")),
      diaper: parseScore(searchParams.get("s_diaper")),
      parking: parseScore(searchParams.get("s_parking")),
      play: parseScore(searchParams.get("s_play")),
    },
    onlyFavorites: searchParams.get("fav") === "1",
    sortBy: (searchParams.get("sort") as PlaceFilters["sortBy"]) ?? "relevance",
    sortOrder: (searchParams.get("order") as "asc" | "desc") ?? "desc",
  };
}

function parseScore(v: string | null): number | undefined {
  const n = v ? parseInt(v, 10) : NaN;
  return isNaN(n) ? undefined : n;
}
```

### 7.2 在 `MapExperience` 中同步

```typescript
const router = useRouter();
const searchParams = useSearchParams();

const [filters, setFilters] = useState<PlaceFilters>(() =>
  queryToFilters(new URLSearchParams(searchParams.toString()))
);

// URL 变化时更新 filters
useEffect(() => {
  setFilters(queryToFilters(new URLSearchParams(searchParams.toString())));
}, [searchParams]);

// filters 变化时更新 URL（debounce）
const debouncedFilters = useDebounce(filters, 400);

useEffect(() => {
  const query = filtersToQuery(debouncedFilters);
  const queryString = new URLSearchParams(query).toString();
  const newUrl = queryString ? `?${queryString}` : window.location.pathname;
  router.replace(newUrl, { scroll: false });

  // 有 query 时保存搜索历史
  if (debouncedFilters.query?.trim()) {
    saveSearchHistory(debouncedFilters.query.trim());
  }
}, [debouncedFilters, router]);
```

---

## 八、收藏闭环增强

### 8.1 地图上「只看收藏」状态

`MapExperience` 传入：

```typescript
const filteredPlaces = useMemo(
  () => filterPlaces(places, filters, { center: mapCenter, favoriteIds }),
  [places, filters, mapCenter, favoriteIds]
);
```

当 `onlyFavorites = true` 且未登录时：
- 显示登录提示按钮
- 不直接阻止切换（用户体验更自然）

### 8.2 收藏按钮接入列表/弹窗

确保 `FavoriteButton` 在以下位置可用：
1. 地点详情页（已有）
2. 地图 Marker 弹窗（已有）
3. 列表卡片（新增）
4. 搜索结果列表（新增）

### 8.3 收藏状态变化后即时刷新

```typescript
const handleFavoriteToggle = async (placeId: string, favorited: boolean) => {
  const next = new Set(favoriteIds);
  if (favorited) next.add(placeId);
  else next.delete(placeId);
  setFavoriteIds(next);
};
```

---

## 九、搜索结果展示增强

### 9.1 结果卡片

新增 `PlaceCard` 组件，用于列表视图：

```tsx
export function PlaceCard({
  place,
  isFavorite,
  onToggleFavorite,
  highlight,
}: {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: (favorited: boolean) => void;
  highlight?: string;
}) {
  return (
    <div className="group flex gap-3 rounded-2xl border border-[#f2d8cb] bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <img src={place.imageUrl} alt={place.nameZh} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-black text-[#2c3834]">
            <HighlightText text={place.nameZh} highlight={highlight} />
          </h3>
          <FavoriteButton
            placeId={place.id}
            initialFavorited={isFavorite}
            onToggle={onToggleFavorite}
            size="sm"
          />
        </div>
        <p className="mt-0.5 text-xs text-[#8a6b5e]">{place.ward} · {getCategoryLabel(place.category)}</p>
        <p className="mt-1 line-clamp-2 text-xs text-[#76584e]">
          <HighlightText text={place.description} highlight={highlight} />
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {place.freeEntry && <Badge>免费</Badge>}
          {place.indoor && <Badge>室内</Badge>}
          {place.rainyDay && <Badge>雨天</Badge>}
        </div>
      </div>
    </div>
  );
}
```

### 9.2 搜索高亮组件

```tsx
export function HighlightText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight?.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="rounded bg-[#fff2c1] px-0.5 font-bold text-[#d68c00]">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
```

### 9.3 空状态

```tsx
<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#f2d8cb] bg-white py-12 text-center">
  <p className="text-lg font-black text-[#2c3834]">没有找到符合条件的地点</p>
  <p className="mt-1 text-sm text-[#8a6b5e]">试着调整筛选条件或清除搜索词</p>
  <button
    onClick={() => setFilters(defaultFilters)}
    className="mt-4 rounded-full bg-[#ff8c73] px-4 py-2 text-sm font-bold text-white"
  >
    清除全部条件
  </button>
</div>
```

---

## 十、性能优化

### 10.1 记忆化

```typescript
const filteredPlaces = useMemo(
  () => filterPlaces(places, filters, { center: mapCenter, favoriteIds }),
  [places, filters, mapCenter, favoriteIds]
);

const stats = useMemo(() => getFilterStats(filteredPlaces), [filteredPlaces]);
```

### 10.2 Debounce

搜索框 250ms，URL 同步 400ms。

### 10.3 大数据量后备方案

当地点数量超过 500 时，把 `filterPlaces` 的部分逻辑移到 Supabase RPC：
- `keyword` 用 PostgreSQL `ILIKE` 或 full-text search
- `category` / `ward` / `age` / `features` 用 WHERE 条件
- 距离排序用 PostGIS 或 Haversine SQL 函数

---

## 十一、数据库索引（为后续扩展预留）

```sql
-- 已有 places 表建议补充的索引
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_ward ON places(ward);
CREATE INDEX idx_places_age ON places(age_min, age_max);
CREATE INDEX idx_places_scores ON places(play_score, stroller_score, diaper_score, parking_score);

-- 收藏表索引
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_place_id ON favorites(place_id);

-- 全文搜索（数据量增大后再加）
ALTER TABLE places ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name_zh, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(name_ja, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(address, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(nearest_station, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(tips, '')), 'C')
  ) STORED;

CREATE INDEX idx_places_search_vector ON places USING GIN(search_vector);
```

---

## 十二、实施顺序

| 步骤 | 内容 | 预计耗时 |
|------|------|----------|
| 1 | 扩展 `PlaceFilters` 类型 | 15min |
| 2 | 增强 `filterPlaces`：query + ward + minScores + sort + onlyFavorites | 1h |
| 3 | 实现 URL query 同步 | 1h |
| 4 | 开发 SearchBox + suggestions | 1.5h |
| 5 | 扩展 PlaceFilterPanel（ward / scores / sort / fav toggle） | 2h |
| 6 | 开发 PlaceCard + HighlightText + 结果列表 | 1.5h |
| 7 | 在 MapExperience 中接入新筛选与搜索 | 1h |
| 8 | 会员中心收藏列表优化（可选） | 1h |
| 9 | 测试空状态、URL 分享、移动端 | 1h |
| 10 | 性能测试与调优 | 1h |

**总计：约 1.5 ~ 2 个工作日**

---

## 十三、风险与注意点

1. **seed.json 与 Supabase 数据一致性**：当前 `seed.json` 和 `places` 表是双数据源。增强搜索后，如果两边数据不一致，会出现本地筛选结果和线上不一致。建议先做一次同步脚本把 `seed.json` → SQL。
2. **中文/日文搜索**：当前用 `toLowerCase().includes()` 对中文日文都有效，但无法处理同义词、繁简体。后续可考虑 Meilisearch/Algolia。
3. **距离排序需要用户授权定位**：未授权时回退到默认排序。
4. **URL 长度**：ward 多选可能产生较长 URL，131 数据量下没问题。
5. **移动端空间**：筛选面板在移动端需要折叠或抽屉式处理，避免占满屏幕。

---

## 十四、后续 P1/P2 扩展

| 阶段 | 扩展 |
|------|------|
| P1 | 搜索历史持久化到 Supabase、热门搜索统计 |
| P1 | 地点自动补全（autocomplete） |
| P1 | 语音搜索 / 地图手势搜索 |
| P2 | 服务端全文搜索 + 模糊匹配 |
| P2 | 推荐排序（协同过滤） |
| P2 | 搜索结果导出为一日游路线 |
