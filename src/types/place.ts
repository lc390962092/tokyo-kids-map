export type PlaceCategory =
  | "park"
  | "library"
  | "children_center"
  | "zoo"
  | "aquarium"
  | "science_museum"
  | "indoor_play"
  | "museum"
  | "landmark"
  | "river";

export type PlaceFeature =
  | "free"
  | "rainy_day"
  | "stroller_friendly"
  | "parking_easy";

export type Place = {
  id: string;
  slug: string;
  nameZh: string;
  nameJa: string;
  category: PlaceCategory;
  ward: string;
  latitude: number;
  longitude: number;
  address: string;
  nearestStation: string;
  ageMin: number;
  ageMax: number;
  indoor: boolean;
  rainyDay: boolean;
  freeEntry: boolean;
  strollerScore: number;
  diaperScore: number;
  parkingScore: number;
  playScore: number;
  description: string;
  tips: string;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PlaceRecord = {
  id: string;
  slug: string;
  name_zh: string;
  name_ja: string;
  category: PlaceCategory;
  ward: string;
  latitude: number | string;
  longitude: number | string;
  address: string;
  nearest_station: string;
  age_min: number;
  age_max: number;
  indoor: boolean;
  rainy_day: boolean;
  free_entry: boolean;
  stroller_score: number;
  diaper_score: number;
  parking_score: number;
  play_score: number;
  description: string;
  tips: string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
};

export type PlaceFilters = {
  ageRange?: "0-1" | "1-3" | "3-6" | "6+";
  categories: PlaceCategory[];
  features: PlaceFeature[];
};
