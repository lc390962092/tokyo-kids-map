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

export function mapPlaceToRecord(place: Place): PlaceRecord {
  return {
    id: place.id,
    slug: place.slug,
    name_zh: place.nameZh,
    name_ja: place.nameJa,
    category: place.category,
    ward: place.ward,
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    nearest_station: place.nearestStation,
    age_min: place.ageMin,
    age_max: place.ageMax,
    indoor: place.indoor,
    rainy_day: place.rainyDay,
    free_entry: place.freeEntry,
    stroller_score: place.strollerScore,
    diaper_score: place.diaperScore,
    parking_score: place.parkingScore,
    play_score: place.playScore,
    description: place.description,
    tips: place.tips,
    image_url: place.imageUrl,
    created_at: place.createdAt,
    updated_at: place.updatedAt,
  };
}
