import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();

export async function getSiteSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();
  if (error) {
    console.error("getSiteSetting error:", error);
    return null;
  }
  return data?.value ?? null;
}

export async function setSiteSetting(
  key: string,
  value: string,
): Promise<{ error?: Error }> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return { error: new Error(error.message) };
  return {};
}

export async function isPlaydatesEnabled(): Promise<boolean> {
  const value = await getSiteSetting("playdates_enabled");
  return value === "true";
}
