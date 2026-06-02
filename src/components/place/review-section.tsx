"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, Send, MessageCircle } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  place_id: string;
  nickname: string;
  rating: number;
  comment: string;
  created_at: string;
};

const supabase = createSupabaseClient();

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ReviewSection({ placeId }: { placeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [nickname, setNickname] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return Math.round(
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    );
  }, [reviews]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      setReviews(data as Review[]);
    }
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || !comment.trim()) {
      window.alert("请给出评分并填写评论内容");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      place_id: placeId,
      nickname: nickname.trim() || "匿名家长",
      rating,
      comment: comment.trim(),
    });
    if (!error) {
      setNickname("");
      setRating(0);
      setComment("");
      await loadReviews();
    } else {
      window.alert("提交失败，请重试：" + error.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-[#ff8c73]" />
        <h2 className="text-xl font-black text-[#2c3834]">
          家长评论
          {reviews.length > 0 && (
            <span className="ml-2 text-sm font-bold text-[#8a6b5e]">
              ({reviews.length} 条)
            </span>
          )}
        </h2>
        {avgRating > 0 && (
          <div className="ml-auto flex items-center gap-1 rounded-full bg-[#fff8ee] px-3 py-1 text-sm font-bold text-[#f27d68]">
            <Star className="h-4 w-4 fill-[#ffb84c] text-[#ffb84c]" />
            {avgRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Submit form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-[#ffe0ce] bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="昵称（选填）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="min-w-0 flex-1 rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#2c3834] outline-none placeholder:text-[#c4a99b] focus:border-[#ff8c73]"
          />
          <div className="flex flex-shrink-0 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i + 1)}
                className="p-1 transition hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    i < (hoverRating || rating)
                      ? "fill-[#ffb84c] text-[#ffb84c]"
                      : "text-[#ead7cb]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <textarea
          placeholder="分享你的遛娃体验..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={300}
          rows={3}
          className="w-full resize-none rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#2c3834] outline-none placeholder:text-[#c4a99b] focus:border-[#ff8c73]"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#c4a99b]">
            {comment.length}/300
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff8c73] px-6 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "提交中..." : "发表评论"}
          </button>
        </div>
      </form>

      {/* Review list */}
      {loading ? (
        <div className="py-8 text-center text-sm font-bold text-[#8a6b5e]">
          加载评论中...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#ffd5c8] bg-[#fffaf4] py-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-[#ead7cb]" />
          <p className="mt-3 text-sm font-bold text-[#8a6b5e]">
            暂无评论，来做第一个分享的家长吧！
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-[#ffe0ce] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0e8] text-xs font-black text-[#f27d68]">
                    {r.nickname.charAt(0)}
                  </div>
                  <span className="text-sm font-black text-[#2c3834]">
                    {r.nickname}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#c4a99b]">
                  {formatDate(r.created_at)}
                </span>
              </div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "fill-[#ffb84c] text-[#ffb84c]"
                        : "text-[#ead7cb]"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm leading-7 text-[#5f6d68]">
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
