"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  LogIn,
  LogOut,
  Shield,
  UsersRound,
  Plus,
  Menu,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PlaceFilterToolbar } from "@/components/filters/place-filter-toolbar";
import { filterPlaces, defaultFilters } from "@/lib/place-filters";
import type { Place, PlaceFilters } from "@/types/place";
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

export function MapExperience({ places }: MapExperienceProps) {
  const [filters, setFilters] = useState<PlaceFilters>(defaultFilters);
  const [showPlaydates, setShowPlaydates] = useState(false);
  const [playdatesFeatureEnabled, setPlaydatesFeatureEnabled] = useState(true);
  const [featureLoading, setFeatureLoading] = useState(true);
  const [selectedPlaydate, setSelectedPlaydate] = useState<Playdate | null>(
    null,
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [createFromPlaceId, setCreateFromPlaceId] = useState<string | undefined>();
  const [nearbyPlaydates, setNearbyPlaydates] = useState<Playdate[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [sheetExpanded, setSheetExpanded] = useState(false);
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
    setSheetExpanded(false);
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-[#fffaf4]">
      {/* Desktop: top toolbar */}
      <div className="hidden lg:block absolute inset-x-0 top-0 z-20">
        <PlaceFilterToolbar
          filters={filters}
          resultCount={filteredPlaces.length}
          onChange={setFilters}
        />
      </div>

      {/* Mobile: top search + chips */}
      <div className="lg:hidden">
        <PlaceFilterToolbar
          filters={filters}
          resultCount={filteredPlaces.length}
          onChange={setFilters}
        />
      </div>

      <div className="flex h-full flex-col lg:flex-row lg:pt-[104px]">
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

          {/* PC top-right action bar */}
          <div className="absolute right-4 top-4 z-10 hidden items-center gap-2 lg:flex">
            {user && playdatesFeatureEnabled && !featureLoading && (
              <>
                <button
                  type="button"
                  onClick={() => setShowPlaydates((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-md transition ${
                    showPlaydates
                      ? "bg-[#ff8c73] text-white"
                      : "bg-white text-[#76584e]"
                  }`}
                >
                  <UsersRound className="h-3.5 w-3.5" />
                  {showPlaydates ? "隐藏约伴" : "显示约伴"}
                  {nearbyPlaydates.length > 0 && (
                    <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {nearbyPlaydates.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#4a8c4a] px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#3d7a3d]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  发起约伴
                </button>

                <Link
                  href="/member"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#76584e] shadow-md transition hover:bg-[#fffaf4]"
                >
                  <UsersRound className="h-3.5 w-3.5" />
                  会员中心
                </Link>
              </>
            )}

            {role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#ff8c73] shadow-md transition hover:bg-[#fffaf4]"
              >
                <Shield className="h-3.5 w-3.5" />
                管理后台
              </Link>
            )}

            {user ? (
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#76584e] shadow-md transition hover:bg-[#fffaf4]"
              >
                <LogOut className="h-3.5 w-3.5" />
                退出
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#76584e] shadow-md transition hover:bg-[#fffaf4]"
              >
                <LogIn className="h-3.5 w-3.5" />
                登录
              </Link>
            )}
          </div>

          {/* Mobile menu */}
          <div className="absolute right-4 top-[140px] z-10 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#76584e] shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-[#ffe0ce] bg-white p-2 shadow-xl">
                <MobileMenuItem
                  icon={
                    <UsersRound
                      className={`h-4 w-4 ${showPlaydates ? "text-[#ff8c73]" : "text-[#c4a99b]"}`}
                    />
                  }
                  label={showPlaydates ? "隐藏约伴" : "显示约伴"}
                  onClick={() => {
                    setShowPlaydates((v) => !v);
                    setIsMenuOpen(false);
                  }}
                />
                {user ? (
                  <>
                    <MobileMenuItem
                      icon={<Plus className="h-4 w-4 text-[#4a8c4a]" />}
                      label="发起约伴"
                      onClick={() => {
                        setIsCreateOpen(true);
                        setIsMenuOpen(false);
                      }}
                    />
                    <MobileMenuItem
                      icon={<UsersRound className="h-4 w-4 text-[#76584e]" />}
                      label="会员中心"
                      href="/member"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    {role === "admin" && (
                      <MobileMenuItem
                        icon={<Shield className="h-4 w-4 text-[#ff8c73]" />}
                        label="管理后台"
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                      />
                    )}
                    <MobileMenuItem
                      icon={<LogOut className="h-4 w-4 text-[#76584e]" />}
                      label="退出登录"
                      onClick={() => {
                        supabase.auth.signOut();
                        setIsMenuOpen(false);
                      }}
                    />
                  </>
                ) : (
                  <MobileMenuItem
                    icon={<LogIn className="h-4 w-4 text-[#76584e]" />}
                    label="登录"
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                  />
                )}
              </div>
            )}
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
        expanded={sheetExpanded}
        onToggle={() => setSheetExpanded((v) => !v)}
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
  expanded,
  onToggle,
  favoriteIds,
  onToggleFavorite,
  onSelectPlace,
  isFavoritesEnabled,
}: {
  places: Place[];
  resultCount: number;
  expanded: boolean;
  onToggle: () => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: Place) => void;
  isFavoritesEnabled: boolean;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl border-t border-brand-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${
        expanded ? "translate-y-0 top-[80px]" : ""
      }`}
      style={{ height: expanded ? "calc(100dvh - 80px)" : "auto" }}
    >
      <button
        type="button"
        onClick={onToggle}
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
          onClick={onToggle}
          className={`text-brand-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={listRef}
        className={`px-4 pb-5 flex gap-3 ${
          expanded
            ? "flex-wrap overflow-y-auto overflow-x-hidden custom-scroll"
            : "overflow-x-auto scrollbar-hide"
        }`}
        style={{ height: expanded ? "calc(100% - 80px)" : "220px" }}
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

function MobileMenuItem({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#2c3834] transition hover:bg-[#fffaf4]";

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}
