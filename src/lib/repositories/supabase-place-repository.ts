import type { Place, PlaceRecord } from "@/types/place";
import { createSupabaseClient } from "@/lib/supabase/client";
import { mapPlaceRecord } from "./place-mapper";
import type { PlaceRepository } from "./place-repository";

export class SupabasePlaceRepository implements PlaceRepository {
  private readonly supabase = createSupabaseClient();

  async findAll(): Promise<Place[]> {
    const { data, error } = await this.supabase
      .from("places")
      .select("*")
      .order("name_zh", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch places: ${error.message}`);
    }

    return ((data ?? []) as PlaceRecord[]).map(mapPlaceRecord);
  }

  async findById(id: string): Promise<Place | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      );
    const query = this.supabase.from("places").select("*");
    const { data, error } = isUuid
      ? await query.or(`id.eq.${id},slug.eq.${id}`).maybeSingle()
      : await query.eq("slug", id).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch place: ${error.message}`);
    }

    return data ? mapPlaceRecord(data as PlaceRecord) : null;
  }
}
