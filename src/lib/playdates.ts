import { createSupabaseClient } from "@/lib/supabase/client";
import type { Playdate, PlaydateWithResponses } from "@/types/playdate";

const supabase = createSupabaseClient();

export async function fetchNearbyPlaydates(
  lat: number,
  lon: number,
  radiusMeters = 3000,
): Promise<Playdate[]> {
  const { data, error } = await supabase.rpc("nearby_playdates", {
    lat,
    lon,
    _radius_meters: radiusMeters,
  });
  if (error) {
    console.error("fetchNearbyPlaydates error:", error);
    return [];
  }
  return (data ?? []) as Playdate[];
}

export async function fetchPlaydateWithResponses(
  id: string,
): Promise<PlaydateWithResponses | null> {
  const { data, error } = await supabase
    .from("playdates")
    .select("*, responses:playdate_responses(*)")
    .eq("id", id)
    .single();
  if (error) {
    console.error("fetchPlaydateWithResponses error:", error);
    return null;
  }
  return data as PlaydateWithResponses | null;
}

export async function createPlaydate(
  payload: Omit<Playdate, "id" | "user_id" | "status" | "created_at">,
): Promise<{ data?: Playdate; error?: Error }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: new Error("请先登录") };

  const { data, error } = await supabase
    .from("playdates")
    .insert({
      ...payload,
      user_id: user.id,
    })
    .select()
    .single();
  if (error) return { error: new Error(error.message) };
  return { data: data as Playdate };
}

export async function updatePlaydate(
  id: string,
  payload: Partial<Omit<Playdate, "id" | "user_id" | "created_at">>,
): Promise<{ data?: Playdate; error?: Error }> {
  const { data, error } = await supabase
    .from("playdates")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return { error: new Error(error.message) };
  return { data: data as Playdate };
}

export async function cancelPlaydate(id: string): Promise<{ error?: Error }> {
  const { data, error } = await supabase
    .from("playdates")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select();

  

  if (error) return { error: new Error(error.message) };
  if (!data || data.length === 0) {
    return { error: new Error("取消失败，请刷新页面重试") };
  }
  return {};
}

export async function respondToPlaydate(
  playdateId: string,
  message?: string,
): Promise<{ error?: Error }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: new Error("请先登录") };

  const { error } = await supabase.from("playdate_responses").upsert(
    {
      playdate_id: playdateId,
      user_id: user.id,
      message: message || null,
      status: "going",
    },
    { onConflict: "playdate_id,user_id" },
  );
  if (error) return { error: new Error(error.message) };
  return {};
}

export async function cancelResponse(playdateId: string): Promise<{ error?: Error }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: new Error("请先登录") };

  const { data, error } = await supabase
    .from("playdate_responses")
    .update({ status: "cancelled" })
    .eq("playdate_id", playdateId)
    .eq("user_id", user.id)
    .select();

  if (error) return { error: new Error(error.message) };
  if (!data || data.length === 0) {
    return { error: new Error("未找到可取消的报名记录，请刷新页面重试") };
  }
  return {};
}

export async function fetchMyPlaydates(userId: string): Promise<{
  created: PlaydateWithResponses[];
  joined: PlaydateWithResponses[];
}> {
  const [{ data: created }, { data: joined }] = await Promise.all([
    supabase
      .from("playdates")
      .select("*, responses:playdate_responses(*)")
      .eq("user_id", userId)
      .order("meet_at", { ascending: false }),
    supabase
      .from("playdate_responses")
      .select("playdate_id")
      .eq("user_id", userId)
      .eq("status", "going"),
  ]);

  let joinedPlaydates: PlaydateWithResponses[] = [];
  if (joined && joined.length > 0) {
    const ids = joined.map((r) => r.playdate_id);
    const { data } = await supabase
      .from("playdates")
      .select("*, responses:playdate_responses(*)")
      .in("id", ids)
      .order("meet_at", { ascending: false });
    joinedPlaydates = (data ?? []) as PlaydateWithResponses[];
  }

  return {
    created: (created ?? []) as PlaydateWithResponses[],
    joined: joinedPlaydates,
  };
}

export async function markResponsesAsNotified(
  playdateId: string,
): Promise<{ error?: Error }> {
  const { error } = await supabase
    .from("playdate_responses")
    .update({ notified: true })
    .eq("playdate_id", playdateId)
    .eq("notified", false)
    .eq("status", "going");
  if (error) return { error: new Error(error.message) };
  return {};
}

export async function fetchUnreadResponseCount(
  userId: string,
): Promise<number> {
  const { data: hostedIds } = await supabase
    .from("playdates")
    .select("id")
    .eq("user_id", userId);
  const playdateIds = (hostedIds ?? []).map((row) => row.id).filter(Boolean);
  if (playdateIds.length === 0) return 0;

  const { data, error } = await supabase
    .from("playdate_responses")
    .select("id", { count: "exact" })
    .eq("notified", false)
    .eq("status", "going")
    .not("user_id", "eq", userId)
    .in("playdate_id", playdateIds);
  if (error) {
    console.error("fetchUnreadResponseCount error:", error);
    return 0;
  }
  return data?.length ?? 0;
}
