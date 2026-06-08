import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();

export async function fetchUserFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("place_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchUserFavorites error:", error);
    return [];
  }

  return (data ?? []).map((row) => row.place_id);
}

export async function addFavorite(userId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, place_id: placeId });

  if (error) {
    console.error("addFavorite error:", error);
    throw new Error("收藏失败: " + error.message);
  }
}

export async function removeFavorite(userId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("place_id", placeId);

  if (error) {
    console.error("removeFavorite error:", error);
    throw new Error("取消收藏失败: " + error.message);
  }
}

export async function isFavorite(userId: string, placeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .maybeSingle();

  if (error) {
    console.error("isFavorite error:", error);
    return false;
  }

  return !!data;
}
