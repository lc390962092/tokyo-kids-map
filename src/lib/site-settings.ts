import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getSiteSetting(key: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .single();
    if (error) {
      // Silently ignore when the table/feature is not available (e.g. local dev
      // without migrations or network hiccups). Callers should provide defaults.
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`getSiteSetting("${key}") skipped:`, error.message);
      }
      return null;
    }
    return data?.value ?? null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`getSiteSetting("${key}") failed:`, err);
    }
    return null;
  }
}

export async function setSiteSetting(
  key: string,
  value: string,
): Promise<{ error?: Error }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error("Supabase is not configured") };
  }
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return { error: new Error(error.message) };
  return {};
}

export async function isPlaydatesEnabled(): Promise<boolean> {
  const value = await getSiteSetting("playdates_enabled");
  // Default to true so the feature remains visible when settings table is
  // unavailable (local dev) unless explicitly disabled.
  return value === null ? true : value === "true";
}
