"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { categoryOptions } from "@/data/place-options";
import type { PlaceRecord } from "@/types/place";
import { PlaceFormModal } from "./place-form-modal";

const supabase = createSupabaseClient();

const emptyForm: PlaceRecord = {
  id: "",
  slug: "",
  name_zh: "",
  name_ja: "",
  category: "park",
  ward: "",
  latitude: 0,
  longitude: 0,
  address: "",
  nearest_station: "",
  age_min: 0,
  age_max: 10,
  indoor: false,
  rainy_day: false,
  free_entry: true,
  stroller_score: 3,
  diaper_score: 3,
  parking_score: 3,
  play_score: 3,
  description: "",
  tips: "",
  image_url: "",
};

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PlaceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.replace("/");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (role === "admin") loadPlaces();
  }, [role]);

  async function loadPlaces() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("name_zh", { ascending: true });
    if (!error && data) setPlaces(data as PlaceRecord[]);
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个地点吗？")) return;
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) alert("删除失败: " + error.message);
    else await loadPlaces();
  }

  async function handleSave(form: PlaceRecord) {
    const isNew = !form.id;
    const payload = { ...form };
    if (isNew) {
      payload.id = crypto.randomUUID();
      const { error } = await supabase.from("places").insert(payload);
      if (error) {
        alert("保存失败: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("places")
        .update(payload)
        .eq("id", form.id);
      if (error) {
        alert("保存失败: " + error.message);
        return;
      }
    }
    setEditing(null);
    await loadPlaces();
  }

  const filtered = places.filter(
    (p) =>
      p.name_zh.includes(search) ||
      p.ward.includes(search) ||
      p.slug.includes(search),
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf4]">
        <p className="text-sm font-bold text-[#8a6b5e]">加载中...</p>
      </main>
    );
  }

  if (role !== "admin") return null;

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 pb-6 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-[#2c3834]">地点管理后台</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing({ ...emptyForm })}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff8c73] px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c]"
            >
              <Plus className="h-4 w-4" />
              新增地点
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e8] text-[#76584e] shadow md:hidden"
              title="退出"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="搜索名称、区名或 slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-2xl border border-[#ffe0ce] bg-white px-4 py-3 text-sm font-bold text-[#2c3834] outline-none placeholder:text-[#c4a99b]"
        />

        {isLoading ? (
          <p className="py-10 text-center text-sm font-bold text-[#8a6b5e]">
            加载中...
          </p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#ffe0ce] bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff0e8] text-xs font-black text-[#6d5147] uppercase">
                <tr>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">区</th>
                  <th className="px-4 py-3">分类</th>
                  <th className="px-4 py-3">坐标</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffe0ce]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fffaf4]">
                    <td className="px-4 py-3 font-bold text-[#2c3834]">
                      {p.name_zh}
                    </td>
                    <td className="px-4 py-3 text-[#76584e]">{p.ward}</td>
                    <td className="px-4 py-3 text-[#76584e]">
                      {categoryOptions.find((c) => c.id === p.category)
                        ?.label ?? p.category}
                    </td>
                    <td className="px-4 py-3 text-[#76584e]">
                      {p.latitude}, {p.longitude}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-full bg-[#fff0e8] p-2 text-[#ff8c73] transition hover:bg-[#ff8c73] hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-full bg-[#fff0e8] p-2 text-red-400 transition hover:bg-red-400 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm font-bold text-[#c4a99b]"
                    >
                      没有匹配结果
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <PlaceFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </main>
  );
}
