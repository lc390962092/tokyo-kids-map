"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  X,
  LogIn,
  LogOut,
  Shield,
  UsersRound,
  Plus,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PlaceFilterPanel } from "@/components/filters/place-filter-panel";
import { filterPlaces, defaultFilters } from "@/lib/place-filters";
import type { Place, PlaceFilters } from "@/types/place";
import type { Playdate } from "@/types/playdate";
import { PlaydateFormModal } from "@/components/playdate/playdate-form-modal";
import { PlaydateDetailModal } from "@/components/playdate/playdate-detail-modal";

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPlaydates, setShowPlaydates] = useState(false);
  const [playdatesFeatureEnabled, setPlaydatesFeatureEnabled] = useState(true);
  const [selectedPlaydate, setSelectedPlaydate] = useState<Playdate | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [createFromPlaceId, setCreateFromPlaceId] = useState<string | undefined>();
  const [nearbyPlaydates, setNearbyPlaydates] = useState<Playdate[]>([]);
  const { user, role } = useAuth();

  const filteredPlaces = useMemo(
    () => filterPlaces(places, filters),
    [places, filters],
  );

  // Auto-enable playdates display on login
  useEffect(() => {
    if (user) {
      setShowPlaydates(true);
    } else {
      setShowPlaydates(false);
    }
  }, [user]);

  return (
    <main className="h-dvh overflow-hidden bg-[#fffaf4]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[360px_1fr]">
        <div className="hidden h-full overflow-y-auto md:block">
          <PlaceFilterPanel
            filters={filters}
            onChange={setFilters}
            resultCount={filteredPlaces.length}
            nearbyPlaydates={nearbyPlaydates}
            onSelectPlaydate={setSelectedPlaydate}
          />
        </div>

        <section className="relative h-full">
          <KidsMap
            places={filteredPlaces}
            showPlaydates={showPlaydates && playdatesFeatureEnabled}
            onSelectPlaydate={setSelectedPlaydate}
            onCreatePlaydateFromPlace={(place) => {
              setCreateFromPlaceId(place.id);
              setIsCreateOpen(true);
            }}
            onPlaydatesLoaded={setNearbyPlaydates}
          />

          {/* PC版顶部工具栏 */}
          <div className="absolute right-4 top-4 z-10 hidden items-center gap-2 md:flex">
            {/* 管理员：约伴功能总开关 */}
            {role === "admin" && (
              <button
                type="button"
                onClick={() => setPlaydatesFeatureEnabled((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-md transition ${
                  playdatesFeatureEnabled
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
                title={playdatesFeatureEnabled ? "点击关闭约伴功能" : "点击开启约伴功能"}
              >
                <Shield className="h-3.5 w-3.5" />
                约伴{playdatesFeatureEnabled ? "开启" : "关闭"}
              </button>
            )}

            {user && playdatesFeatureEnabled && (
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

          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur md:hidden">
            <div>
              <div className="text-base font-black text-[#2c3834]">
                东京溜娃地图
              </div>
              <div className="text-xs font-bold text-[#8a6b5e]">
                Tokyo Kids Map · {filteredPlaces.length} 个地点
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ff8c73] text-white shadow-md"
                aria-label="打开筛选"
                title="筛选"
              >
                <Search className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#76584e] shadow-md"
                  aria-label="更多"
                  title="更多"
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
                          icon={
                            <UsersRound className="h-4 w-4 text-[#76584e]" />
                          }
                          label="会员中心"
                          href="/member"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        {role === "admin" && (
                          <MobileMenuItem
                            icon={
                              <Shield className="h-4 w-4 text-[#ff8c73]" />
                            }
                            label="管理后台"
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                          />
                        )}
                        <MobileMenuItem
                          icon={
                            <LogOut className="h-4 w-4 text-[#76584e]" />
                          }
                          label="退出登录"
                          onClick={() => {
                            supabase.auth.signOut();
                            setIsMenuOpen(false);
                          }}
                        />
                      </>
                    ) : (
                      <MobileMenuItem
                        icon={
                          <LogIn className="h-4 w-4 text-[#76584e]" />
                        }
                        label="登录"
                        href="/login"
                        onClick={() => setIsMenuOpen(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="absolute left-1/2 top-1/2 z-10 w-[min(86vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-center shadow-xl">
              <MapPin className="mx-auto h-8 w-8 text-[#ff8c73]" />
              <h2 className="mt-3 text-lg font-black text-[#2c3834]">
                没有匹配地点
              </h2>
              <p className="mt-2 text-sm font-medium text-[#80675b]">
                换个年龄或少选几个特点试试。
              </p>
            </div>
          ) : null}
        </section>
      </div>

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

      {isFilterOpen ? (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-[28px] bg-[#fffaf4] shadow-2xl">
            <div className="sticky top-0 z-10 flex justify-end bg-[#fffaf4]/95 p-3 backdrop-blur">
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#8b5e4b] shadow-sm"
                aria-label="关闭筛选"
                title="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PlaceFilterPanel
              filters={filters}
              onChange={setFilters}
              resultCount={filteredPlaces.length}
            />
          </div>
        </div>
      ) : null}
    </main>
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
