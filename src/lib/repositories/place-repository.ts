import type { Place } from "@/types/place";

export interface PlaceRepository {
  findAll(): Promise<Place[]>;
  findById(id: string): Promise<Place | null>;
  findByIds(ids: string[]): Promise<Place[]>;
}
