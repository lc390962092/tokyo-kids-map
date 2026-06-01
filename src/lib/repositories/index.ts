import { hasSupabaseConfig } from "@/lib/supabase/client";
import { JsonPlaceRepository } from "./json-place-repository";
import type { PlaceRepository } from "./place-repository";
import { SupabasePlaceRepository } from "./supabase-place-repository";

export function getPlaceRepository(): PlaceRepository {
  if (hasSupabaseConfig()) {
    const supabaseRepository = new SupabasePlaceRepository();
    const jsonRepository = new JsonPlaceRepository();

    return {
      async findAll() {
        try {
          return await supabaseRepository.findAll();
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn(error);
          }
          return jsonRepository.findAll();
        }
      },
      async findById(id: string) {
        try {
          return await supabaseRepository.findById(id);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn(error);
          }
          return jsonRepository.findById(id);
        }
      },
    };
  }

  return new JsonPlaceRepository();
}
