"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/favorites";

type FavoriteButtonProps = {
  placeId: string;
  initialFavorited?: boolean;
  onToggle?: (favorited: boolean) => void;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { icon: 14, padding: "p-1.5", text: "text-xs" },
  md: { icon: 18, padding: "p-2", text: "text-sm" },
  lg: { icon: 22, padding: "p-2.5", text: "text-base" },
};

export function FavoriteButton({
  placeId,
  initialFavorited = false,
  onToggle,
  size = "md",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(initialFavorited);

  useEffect(() => {
    if (user && !checked) {
      isFavorite(user.id, placeId).then((fav) => {
        setFavorited(fav);
        setChecked(true);
      });
    }
  }, [user, placeId, checked]);

  if (!user) return null;

  const s = sizeMap[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (favorited) {
        await removeFavorite(user.id, placeId);
        setFavorited(false);
        onToggle?.(false);
      } else {
        await addFavorite(user.id, placeId);
        setFavorited(true);
        onToggle?.(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={favorited ? "取消收藏" : "收藏"}
      className={`
        inline-flex items-center gap-1 rounded-full transition
        ${favorited ? "bg-red-50 text-red-500" : "bg-[#fff0e8] text-[#c4a99b]"}
        ${s.padding}
        hover:scale-105 active:scale-95
        disabled:opacity-50
      `}
    >
      <Heart
        className={s.text}
        style={{ width: s.icon, height: s.icon }}
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={2.5}
      />
    </button>
  );
}
