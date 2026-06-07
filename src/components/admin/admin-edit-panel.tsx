"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PlaceFormModal } from "@/app/admin/place-form-modal";
import type { Place, PlaceRecord } from "@/types/place";
import { mapPlaceToRecord } from "@/lib/repositories/place-mapper";

const supabase = createSupabaseClient();

type AdminEditPanelProps = {
  place: Place;
};

export function AdminEditPanel({ place }: AdminEditPanelProps) {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (role !== "admin") return null;

  const handleSave = async (form: PlaceRecord) => {
    setSaving(true);
    const { error } = await supabase
      .from("places")
      .update({
        slug: form.slug,
        name_zh: form.name_zh,
        name_ja: form.name_ja,
        category: form.category,
        ward: form.ward,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        nearest_station: form.nearest_station,
        age_min: form.age_min,
        age_max: form.age_max,
        indoor: form.indoor,
        rainy_day: form.rainy_day,
        free_entry: form.free_entry,
        stroller_score: form.stroller_score,
        diaper_score: form.diaper_score,
        parking_score: form.parking_score,
        play_score: form.play_score,
        description: form.description,
        tips: form.tips,
        image_url: form.image_url,
      })
      .eq("id", form.id);
    setSaving(false);

    if (error) {
      alert("保存失败: " + error.message);
      return;
    }

    setOpen(false);
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#ff8c73] px-4 py-2 text-xs font-black text-white shadow transition hover:bg-[#ff7a5c] disabled:opacity-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        订正数据
      </button>

      {open && (
        <PlaceFormModal
          initial={mapPlaceToRecord(place)}
          onClose={() => setOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
