"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, X } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchMyPlaydates, cancelPlaydate, cancelResponse } from "@/lib/playdates";
import type { PlaydateWithResponses } from "@/types/playdate";

export default function MemberPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [created, setCreated] = useState<PlaydateWithResponses[]>([]);
  const [joined, setJoined] = useState<PlaydateWithResponses[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/member");
    }
  }, [user, loading, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { created, joined } = await fetchMyPlaydates(user.id);
    setCreated(created);
    setJoined(joined);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || isLoading) {
    return (
      <main className="min-h-screen bg-[#fffaf4] px-4 pb-6 pt-14 sm:px-6 lg:px-8">
        <p className="py-20 text-center text-sm font-bold text-[#8a6b5e]">
          加载中...
        </p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 pb-6 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black text-[#2c3834]">会员中心</h1>
        <p className="mt-1 text-sm font-bold text-[#8a6b5e]">
          {user.email?.split("@")[0]} · 管理我的邀约
        </p>

        <section className="mt-6">
          <h2 className="text-lg font-black text-[#2c3834]">我发起的邀约</h2>
          <div className="mt-3 space-y-3">
            {created.length === 0 && (
              <p className="text-sm text-[#c4a99b]">还没有发起过邀约</p>
            )}
            {created.map((p) => (
              <PlaydateCard
                key={p.id}
                playdate={p}
                mode="created"
                onRefresh={load}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-black text-[#2c3834]">我报名的邀约</h2>
          <div className="mt-3 space-y-3">
            {joined.length === 0 && (
              <p className="text-sm text-[#c4a99b]">还没有报名过邀约</p>
            )}
            {joined.map((p) => (
              <PlaydateCard
                key={p.id}
                playdate={p}
                mode="joined"
                onRefresh={load}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function PlaydateCard({
  playdate,
  mode,
  onRefresh,
}: {
  playdate: PlaydateWithResponses;
  mode: "created" | "joined";
  onRefresh: () => void;
}) {
  const goingCount = playdate.responses.filter((r) => r.status === "going").length;
  const isExpired = new Date(playdate.meet_at) < new Date();

  async function handleCancelCreated() {
    if (!confirm("确定取消这个邀约吗？")) return;
    const { error } = await cancelPlaydate(playdate.id);
    if (error) alert(error.message);
    else onRefresh();
  }

  async function handleCancelJoined() {
    const { error } = await cancelResponse(playdate.id);
    if (error) alert(error.message);
    else onRefresh();
  }

  return (
    <div className="rounded-2xl border border-[#ffe0ce] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-[#2c3834]">{playdate.title}</h3>
          <p className="mt-1 text-xs text-[#76584e]">
            {playdate.description || "暂无说明"}
          </p>
        </div>
        {isExpired && (
          <span className="shrink-0 rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-bold text-[#999]">
            已过期
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-[#5f6d68]">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3 text-[#ff8c73]" />
          {new Date(playdate.meet_at).toLocaleString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 text-[#ff8c73]" />
          {playdate.latitude.toFixed(4)}, {playdate.longitude.toFixed(4)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 text-[#ff8c73]" />
          {goingCount} / {playdate.max_participants}
        </span>
      </div>

      <div className="mt-3 flex justify-end">
        {mode === "created" ? (
          <button
            onClick={handleCancelCreated}
            disabled={isExpired}
            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            取消邀约
          </button>
        ) : (
          <button
            onClick={handleCancelJoined}
            disabled={isExpired}
            className="inline-flex items-center gap-1 rounded-full border border-[#ffe0ce] bg-white px-3 py-1.5 text-xs font-bold text-[#76584e] transition hover:bg-[#fffaf4] disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            取消报名
          </button>
        )}
      </div>
    </div>
  );
}
