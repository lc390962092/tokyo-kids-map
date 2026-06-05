"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Calendar, MapPin, Users } from "lucide-react";
import {
  fetchPlaydateWithResponses,
  respondToPlaydate,
  cancelResponse,
  cancelPlaydate,
  markResponsesAsNotified,
} from "@/lib/playdates";
import { useAuth } from "@/lib/supabase/auth-context";
import type { PlaydateWithResponses } from "@/types/playdate";

type PlaydateDetailModalProps = {
  playdateId: string;
  onClose: () => void;
  onResponded?: () => void;
};

export function PlaydateDetailModal({
  playdateId,
  onClose,
  onResponded,
}: PlaydateDetailModalProps) {
  const { user } = useAuth();
  const [playdate, setPlaydate] = useState<PlaydateWithResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPlaydateWithResponses(playdateId);
    setPlaydate(data);
    // Mark unread responses as notified if user is the owner
    if (data && user?.id === data.user_id) {
      await markResponsesAsNotified(playdateId);
    }
    setLoading(false);
  }, [playdateId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = user?.id === playdate?.user_id;
  const myResponse = playdate?.responses.find((r) => r.user_id === user?.id);
  const goingResponses =
    playdate?.responses.filter((r) => r.status === "going") ?? [];
  const isFull = goingResponses.length >= (playdate?.max_participants ?? 0);

  async function handleJoin() {
    if (!user) {
      alert("请先登录");
      return;
    }
    setActionLoading(true);
    const { error } = await respondToPlaydate(playdateId, message);
    setActionLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
    onResponded?.();
  }

  async function handleCancelJoin() {
    setActionLoading(true);
    const { error } = await cancelResponse(playdateId);
    setActionLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
    onResponded?.();
  }

  async function handleCancelPlaydate() {
    if (!confirm("确定取消这个邀约吗？")) return;
    setActionLoading(true);
    const { error } = await cancelPlaydate(playdateId);
    setActionLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    onClose();
    onResponded?.();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#2c3834]">邀约详情</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-[#fff0e8] p-2 text-[#76584e] transition hover:bg-[#ffe0ce]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm font-bold text-[#8a6b5e]">
            加载中...
          </p>
        ) : !playdate ? (
          <p className="py-10 text-center text-sm font-bold text-[#8a6b5e]">
            邀约不存在或已过期
          </p>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-[#2c3834]">
              {playdate.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#5f6d68]">
              {playdate.description || "暂无说明"}
            </p>

            <div className="space-y-2 rounded-2xl bg-[#fffaf4] p-4 text-sm">
              <div className="flex items-center gap-2 text-[#2c3834]">
                <Calendar className="h-4 w-4 text-[#ff8c73]" />
                <span className="font-bold">
                  {new Date(playdate.meet_at).toLocaleString("zh-CN", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    weekday: "short",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#2c3834]">
                <MapPin className="h-4 w-4 text-[#ff8c73]" />
                <span className="font-medium">
                  {playdate.latitude.toFixed(5)}, {playdate.longitude.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#2c3834]">
                <Users className="h-4 w-4 text-[#ff8c73]" />
                <span className="font-medium">
                  {goingResponses.length} / {playdate.max_participants} 组家庭
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-[#6d5147] uppercase">
                已报名 ({goingResponses.length})
              </h4>
              <ul className="mt-2 space-y-2">
                {goingResponses.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl bg-[#f4fbf7] px-3 py-2 text-sm text-[#2c3834]"
                  >
                    <span className="font-bold">
                      {r.user_id === user?.id ? "我" : "一位家长"}
                    </span>
                    {r.message ? (
                      <span className="ml-2 text-[#76584e]">{r.message}</span>
                    ) : null}
                  </li>
                ))}
                {goingResponses.length === 0 && (
                  <li className="text-sm text-[#c4a99b]">还没有人报名</li>
                )}
              </ul>
            </div>

            {!user ? (
              <div className="rounded-2xl bg-[#fff0e8] p-4 text-center text-sm font-bold text-[#76584e]">
                请先登录后再报名
              </div>
            ) : isOwner ? (
              <button
                onClick={handleCancelPlaydate}
                disabled={actionLoading}
                className="w-full rounded-full border border-red-200 bg-red-50 py-3 text-sm font-black text-red-500 transition hover:bg-red-100 disabled:opacity-50"
              >
                {actionLoading ? "处理中..." : "取消邀约"}
              </button>
            ) : myResponse?.status === "going" ? (
              <button
                onClick={handleCancelJoin}
                disabled={actionLoading}
                className="w-full rounded-full border border-[#ffe0ce] bg-white py-3 text-sm font-bold text-[#76584e] transition hover:bg-[#fffaf4] disabled:opacity-50"
              >
                {actionLoading ? "处理中..." : "取消报名"}
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="留言（可选，如：我家 3 岁男孩）"
                  className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
                />
                <button
                  onClick={handleJoin}
                  disabled={actionLoading || isFull}
                  className="w-full rounded-full bg-[#ff8c73] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c] disabled:opacity-50"
                >
                  {actionLoading
                    ? "处理中..."
                    : isFull
                      ? "已满员"
                      : "我要一起去"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
