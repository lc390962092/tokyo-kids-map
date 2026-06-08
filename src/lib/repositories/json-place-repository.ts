import seedRecords from "@/data/seed.json";
import type { Place, PlaceRecord } from "@/types/place";
import { mapPlaceRecord } from "./place-mapper";
import type { PlaceRepository } from "./place-repository";

export class JsonPlaceRepository implements PlaceRepository {
  private readonly places = (seedRecords as PlaceRecord[]).map(mapPlaceRecord);

  async findAll(): Promise<Place[]> {
    return this.places;
  }

  async findById(id: string): Promise<Place | null> {
    return (
      this.places.find((place) => place.id === id || place.slug === id) ?? null
    );
  }

  async findByIds(ids: string[]): Promise<Place[]> {
    const idSet = new Set(ids);
    return this.places
      .filter((place) => idSet.has(place.id))
      .sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh-CN"));
  }
}
