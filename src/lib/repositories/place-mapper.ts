import type { Place, PlaceRecord } from "@/types/place";

export function mapPlaceRecord(record: PlaceRecord): Place {
  return {
    id: record.id,
    slug: record.slug,
    nameZh: record.name_zh,
    nameJa: record.name_ja,
    category: record.category,
    ward: record.ward,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    address: record.address,
    nearestStation: record.nearest_station,
    ageMin: record.age_min,
    ageMax: record.age_max,
    indoor: record.indoor,
    rainyDay: record.rainy_day,
    freeEntry: record.free_entry,
    strollerScore: record.stroller_score,
    diaperScore: record.diaper_score,
    parkingScore: record.parking_score,
    playScore: record.play_score,
    description: record.description,
    tips: record.tips,
    imageUrl: record.image_url,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
