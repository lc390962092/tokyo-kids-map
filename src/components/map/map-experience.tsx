"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ListFilter, MapPin, X, LogIn, LogOut, Shield, UsersRound, Plus } from "lucide-react";
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
  const [showPlaydates, setShowPlaydates] = useState(true);
  const [selectedPlaydate, setSelectedPlaydate] = useState<Playdate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { user, role } = useAuth();

  const filteredPlaces = useMemo(
    () => filterPlaces(places, filters),
    [places, filters],
  );

  return (
    <main className="h-dvh overflow-hidden bg-[#fffaf4]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[360px_1fr]">
        <div className="hidden h-full overflow-y-auto md:block">
          <PlaceFilterPanel
            filters={filters}
            onChange={setFilters}
            resultCount={filteredPlaces.length}
          />
        </div>

        <section className="relative h-full">
          <KidsMap
            places={filteredPlaces}
            showPlaydates={showPlaydates}
            onSelectPlaydate={setSelectedPlaydate}
          />

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
                onClick={() => setShowPlaydates((v) => !v)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full shadow ${
                  showPlaydates
                    ? "bg-[#ff8c73] text-white"
                    : "bg-[#fff0e8] text-[#ff8c73]"
                }`}
                title={showPlaydates ? "隐藏约伴" : "显示约伴"}
              >
                <UsersRound className="h-4 w-4" />
              </button>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f4e8] text-[#4a8c4a] shadow"
                    title="发起约伴"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff8c73] text-white shadow"
                      title="管理后台"
                    >
                      <Shield className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    href="/member"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0e8] text-[#76584e] shadow"
                    title="会员中心"
                  >
                    <UsersRound className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0e8] text-[#76584e] shadow"
                    title="退出"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0e8] text-[#76584e] shadow"
                  title="登录"
                >
                  <LogIn className="h-4 w-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ff8c73] text-white shadow-md"
                aria-label="打开筛选"
                title="筛选"
              >
                <ListFilter className="h-5 w-5" />
              </button>
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
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => setIsCreateOpen(false)}
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
