"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PlaceFilterToolbar } from "@/components/filters/place-filter-toolbar";
import { UserMenu } from "@/components/layout/user-menu";
import { filterPlaces, defaultFilters } from "@/lib/place-filters";
import { useUrlFilters } from "@/lib/hooks/use-url-filters";
import type { Place } from "@/types/place";
import {
  fetchUserFavorites,
  addFavorite,
  removeFavorite,
} from "@/lib/favorites";
import { WeatherWidget } from "@/components/weather/weather-widget";
import type { Playdate } from "@/types/playdate";
import { PlaydateFormModal } from "@/components/playdate/playdate-form-modal";
import { PlaydateDetailModal } from "@/components/playdate/playdate-detail-modal";
import { isPlaydatesEnabled } from "@/lib/site-settings";
import { PlaceCard, PlaceListEmpty } from "@/components/place/place-card";

const supabase = createSupabaseClient();

const KidsMap = dynamic(() => import("@/components/map/kids-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[520px] place-items-center bg-[#d9f1ea] text-sm font-bold text-[#527168]">
      地图加载中...
    </div>
  ),
});

type MapExperienceProps = {
  places: Place[];
};

type SheetState = "collapsed" | "peek" | "expanded";

export function MapExperience({ places }: MapExperienceProps) {
  const [filters, setFilters] = useUrlFilters();
  const [showPlaydates, setShowPlaydates] = useState(false);
  const [playdatesFeatureEnabled, setPlaydatesFeatureEnabled] = useState(true);
  const [featureLoading, setFeatureLoading] = useState(true);
  const [selectedPlaydate, setSelectedPlaydate] = useState<Playdate | null>(
    null,
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFromPlaceId, setCreateFromPlaceId] = useState<string | undefined>();
  const [nearbyPlaydates, setNearbyPlaydates] = useState<Playdate[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const initialExpandDone = useRef(false);
  const { user, role } = useAuth();

  const totalPlaces = places.length;
  const filteredPlaces = useMemo(
    () =>
      filterPlaces(places, filters, favoriteIds).filter(
        (p) => p.latitude !== 0 && p.longitude !== 0,
      ),
    [places, filters, favoriteIds],
  );

  // Auto-enable playdates display on login + read global feature flag
  useEffect(() => {
    if (user) {
      setShowPlaydates(true);
      fetchUserFavorites(user.id).then((ids) => setFavoriteIds(new Set(ids)));
    } else {
      setShowPlaydates(false);
      setFavoriteIds(new Set());
    }
  }, [user]);

  const toggleFavorite = async (placeId: string) => {
    if (!user) return;
    const isFav = favoriteIds.has(placeId);
    try {
      if (isFav) {
        await removeFavorite(user.id, placeId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(placeId);
          return next;
        });
      } else {
        await addFavorite(user.id, placeId);
        setFavoriteIds((prev) => new Set(prev).add(placeId));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  };

  useEffect(() => {
    isPlaydatesEnabled().then((enabled) => {
      setPlaydatesFeatureEnabled(enabled);
      setFeatureLoading(false);
    });
  }, []);

  const handleSelectPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
    setSheetState("peek");
  };

  // Auto-expand mobile bottom sheet when URL has active filters
  useEffect(() => {
    if (initialExpandDone.current) return;
    const hasActiveFilters = Boolean(
      filters.searchText ||
        filters.ageRange ||
        filters.categories.length ||
        filters.features.length ||
        filters.wards.length ||
        filters.onlyFavorites ||
        (filters.sortBy && filters.sortBy !== "relevance"),
    );
    if (hasActiveFilters) {
      setSheetState("expanded");
    }
    initialExpandDone.current = true;
  }, [filters]);

  const cycleSheetState = useCallback(() => {
    setSheetState((prev) =>
      prev === "collapsed" ? "peek" : prev === "peek" ? "expanded" : "collapsed",
    );
  }, []);

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#fffaf4]">
      {/* Desktop: top toolbar (in flow so it pushes content down when expanded) */}
      <div className="hidden lg:block flex-none z-20">
        <PlaceFilterToolbar
          filters={filters}
          resultCount={filteredPlaces.length}
          places={places}
          onChange={setFilters}
        />
      </div>

      {/* Mobile: top search + chips */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20">
        <PlaceFilterToolbar
          filters={filters}
          resultCount={filteredPlaces.length}
          places={places}
          onChange={setFilters}
        />
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Desktop: left list panel */}
        <aside className="hidden lg:flex w-80 flex-col bg-white border-r border-brand-100 z-10 h-full">
          <div className="p-4 border-b border-brand-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-brand-800">
              搜索结果{" "}
              <span className="text-brand-accent">{filteredPlaces.length}</span>
              {totalPlaces !== undefined && (
                <span className="ml-1 text-xs text-brand-400">
                  / {totalPlaces}
                </span>
              )}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scroll">
            <WeatherWidget
              onApplyRecommendations={(rec) =>
                setFilters((prev) => ({ ...prev, ...rec }))
              }
              onReset={() => setFilters(defaultFilters)}
            />
            {filteredPlaces.length === 0 ? (
              <PlaceListEmpty />
            ) : (
              filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  variant="list"
                  isFavorited={favoriteIds.has(place.id)}
                  onToggleFavorite={() => toggleFavorite(place.id)}
                  onSelect={() => handleSelectPlace(place)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Map area */}
        <section className="relative flex-1 h-full lg:h-auto">
          <KidsMap
            places={filteredPlaces}
            selectedPlaceId={selectedPlaceId ?? undefined}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            showPlaydates={showPlaydates && playdatesFeatureEnabled && !featureLoading}
            onSelectPlaydate={setSelectedPlaydate}
            onCreatePlaydateFromPlace={(place) => {
              setCreateFromPlaceId(place.id);
              setIsCreateOpen(true);
            }}
            onPlaydatesLoaded={setNearbyPlaydates}
          />

          {/* User menu (top-right on all viewports) */}
          <div className="absolute right-4 top-4 z-30 lg:z-10">
            <UserMenu
              user={user}
              role={role}
              onLogout={() => supabase.auth.signOut()}
              showPlaydates={showPlaydates && playdatesFeatureEnabled && !featureLoading}
              onTogglePlaydates={() => setShowPlaydates((v) => !v)}
              playdateCount={nearbyPlaydates.length}
              onCreatePlaydate={() => setIsCreateOpen(true)}
            />
          </div>

          {filteredPlaces.length === 0 && (
            <div className="absolute left-1/2 top-1/2 z-10 w-[min(86vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-center shadow-xl">
              <MapPin className="mx-auto h-8 w-8 text-[#ff8c73]" />
              <h2 className="mt-3 text-lg font-black text-[#2c3834]">
                没有匹配地点
              </h2>
              <p className="mt-2 text-sm font-medium text-[#80675b]">
                换个关键词或少选几个条件试试。
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Mobile bottom sheet */}
      <MobileBottomSheet
        places={filteredPlaces}
        resultCount={filteredPlaces.length}
        state={sheetState}
        onCycle={cycleSheetState}
        onSetState={setSheetState}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onSelectPlace={handleSelectPlace}
        isFavoritesEnabled={!!user}
      />

      {selectedPlaydate && (
        <PlaydateDetailModal
          playdateId={selectedPlaydate.id}
          onClose={() => setSelectedPlaydate(null)}
        />
      )}

      {isCreateOpen && (
        <PlaydateFormModal
          places={places}
          defaultPlaceId={createFromPlaceId}
          onClose={() => {
            setIsCreateOpen(false);
            setCreateFromPlaceId(undefined);
          }}
          onSuccess={() => {
            setIsCreateOpen(false);
            setCreateFromPlaceId(undefined);
          }}
        />
      )}
    </main>
  );
}

function MobileBottomSheet({
  places,
  resultCount,
  state,
  onCycle,
  onSetState,
  favoriteIds,
  onToggleFavorite,
  onSelectPlace,
  isFavoritesEnabled,
}: {
  places: Place[];
  resultCount: number;
  state: SheetState;
  onCycle: () => void;
  onSetState: (state: SheetState) => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: Place) => void;
  isFavoritesEnabled: boolean;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = startY.current - currentY.current;
    if (delta > THRESHOLD) {
      // swiped up
      onSetState(state === "collapsed" ? "peek" : "expanded");
    } else if (delta < -THRESHOLD) {
      // swiped down
      onSetState(state === "expanded" ? "peek" : "collapsed");
    } else {
      // tap
      onCycle();
    }
  };

  const stateStyles = {
    collapsed: {
      transform: "translateY(calc(100% - 72px))",
      height: "auto",
    },
    peek: {
      transform: "translateY(0)",
      height: "auto",
      top: "auto",
      bottom: 0,
    },
    expanded: {
      transform: "translateY(0)",
      height: "calc(100dvh - 80px)",
      top: 80,
      bottom: 0,
    },
  };

  return (
    <div
      className="lg:hidden fixed left-0 right-0 z-20 bg-white rounded-t-3xl border-t border-brand-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out"
      style={stateStyles[state]}
    >
      <div
        className="touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={onCycle}
          className="w-full flex justify-center pt-2 pb-1"
        >
          <div className="w-10 h-1 rounded-full bg-brand-300" />
        </button>
        <div className="px-4 pb-2 flex items-center justify-between">
          <h3 className="font-black text-base text-brand-800">
            搜索结果 <span className="text-brand-accent">{resultCount}</span>
          </h3>
          <button
            type="button"
            onClick={onCycle}
            className="text-brand-400 transition-transform"
          >
            {state === "collapsed" ? (
              <ChevronUp className="h-5 w-5" />
            ) : state === "expanded" ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <div
        ref={listRef}
        className={`px-4 pb-5 flex gap-3 ${
          state === "expanded"
            ? "flex-wrap overflow-y-auto overflow-x-hidden custom-scroll"
            : "overflow-x-auto scrollbar-hide"
        }`}
        style={{ height: state === "expanded" ? "calc(100% - 72px)" : "280px" }}
      >
        {places.length === 0 ? (
          <div className="w-full">
            <PlaceListEmpty />
          </div>
        ) : (
          places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              variant="card"
              isFavorited={favoriteIds.has(place.id)}
              onToggleFavorite={
                isFavoritesEnabled
                  ? () => onToggleFavorite(place.id)
                  : undefined
              }
              onSelect={() => onSelectPlace(place)}
            />
          ))
        )}
      </div>
    </div>
  );
}

