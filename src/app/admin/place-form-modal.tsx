"use client";

import { useState } from "react";
import { X, ExternalLink, Upload, MapPin } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { categoryOptions } from "@/data/place-options";
import type { PlaceRecord } from "@/types/place";

type PlaceFormModalProps = {
  initial: PlaceRecord;
  onClose: () => void;
  onSave: (form: PlaceRecord) => void;
};

const supabase = createSupabaseClient();

export function PlaceFormModal({ initial, onClose, onSave }: PlaceFormModalProps) {
  const [form, setForm] = useState<PlaceRecord>({ ...initial });
  const [uploading, setUploading] = useState(false);

  const update = <K extends keyof PlaceRecord>(key: K, value: PlaceRecord[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#2c3834]">
            {form.id ? "编辑地点" : "新增地点"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-[#fff0e8] p-2 text-[#76584e] transition hover:bg-[#ffe0ce]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                中文名称
              </label>
              <input
                value={form.name_zh}
                onChange={(e) => update("name_zh", e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                日文名称
              </label>
              <input
                value={form.name_ja}
                onChange={(e) => update("name_ja", e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                Slug
              </label>
              <input
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                区
              </label>
              <input
                value={form.ward}
                onChange={(e) => update("ward", e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                分类
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  update("category", e.target.value as PlaceRecord["category"])
                }
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                地址
              </label>
              <div className="flex gap-2">
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="flex-1 rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
                />
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(form.address || "東京")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="在 Google Maps 搜索"
                  className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-[#e8f4e8] px-3 py-2 text-xs font-bold text-[#4a8c4a] transition hover:bg-[#4a8c4a] hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  搜索
                </a>
                <FetchCoordsButton
                  address={form.address}
                  onCoords={(lat, lon) => {
                    update("latitude", lat);
                    update("longitude", lon);
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                最近车站
              </label>
              <input
                value={form.nearest_station}
                onChange={(e) => update("nearest_station", e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                图片
              </label>
              <div className="flex gap-2">
                <input
                  value={form.image_url}
                  onChange={(e) => update("image_url", e.target.value)}
                  placeholder="图片 URL 或上传后自动填入"
                  className="flex-1 rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
                />
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-2xl bg-[#e8f0ff] px-3 py-2 text-xs font-bold text-[#4a7cc7] transition hover:bg-[#4a7cc7] hover:text-white">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "上传中..." : "上传"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const folder = form.id || crypto.randomUUID();
                      const ext = file.name.split(".").pop() || "jpg";
                      const path = `${folder}/${Date.now()}.${ext}`;
                      const { data: upData, error: upError } = await supabase.storage
                        .from("place-images")
                        .upload(path, file, { upsert: true });
                      if (upError) {
                        alert("上传失败: " + upError.message);
                        setUploading(false);
                        return;
                      }
                      const { data: urlData } = supabase.storage
                        .from("place-images")
                        .getPublicUrl(upData.path);
                      update("image_url", urlData.publicUrl);
                      setUploading(false);
                    }}
                  />
                </label>
              </div>
              {form.image_url && (
                <div className="mt-2 overflow-hidden rounded-xl border border-[#ffe0ce]">
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="h-24 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                Google Maps 链接（粘贴后自动解析坐标）
              </label>
              <input
                placeholder="https://www.google.com/maps/place/..."
                onChange={(e) => {
                  const coords = parseGoogleMapsUrl(e.target.value);
                  if (coords) {
                    update("latitude", coords.lat);
                    update("longitude", coords.lon);
                  }
                }}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
              <p className="mt-1 text-[10px] font-bold text-[#c4a99b]">
                提示：在 Google Maps 搜索地点 → 右键点击地图 → 「复制坐标」→ 粘贴到上方；或粘贴分享链接
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                纬度
              </label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  update("latitude", parseFloat(e.target.value))
                }
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                经度
              </label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  update("longitude", parseFloat(e.target.value))
                }
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-black text-[#6d5147]">
                  最小年龄
                </label>
                <input
                  type="number"
                  value={form.age_min}
                  onChange={(e) =>
                    update("age_min", parseInt(e.target.value))
                  }
                  className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-black text-[#6d5147]">
                  最大年龄
                </label>
                <input
                  type="number"
                  value={form.age_max}
                  onChange={(e) =>
                    update("age_max", parseInt(e.target.value))
                  }
                  className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(
                [
                  ["stroller_score", "婴儿车"],
                  ["diaper_score", "换尿布"],
                  ["parking_score", "停车"],
                  ["play_score", "放电"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex-1">
                  <label className="mb-1 block text-xs font-black text-[#6d5147]">
                    {label}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form[key]}
                    onChange={(e) =>
                      update(key, parseInt(e.target.value))
                    }
                    className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-[#2c3834]">
              <input
                type="checkbox"
                checked={form.indoor}
                onChange={(e) => update("indoor", e.target.checked)}
                className="h-4 w-4 accent-[#ff8c73]"
              />
              室内
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-[#2c3834]">
              <input
                type="checkbox"
                checked={form.rainy_day}
                onChange={(e) => update("rainy_day", e.target.checked)}
                className="h-4 w-4 accent-[#ff8c73]"
              />
              雨天可去
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-[#2c3834]">
              <input
                type="checkbox"
                checked={form.free_entry}
                onChange={(e) => update("free_entry", e.target.checked)}
                className="h-4 w-4 accent-[#ff8c73]"
              />
              免费
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              描述
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              Tips
            </label>
            <textarea
              value={form.tips}
              onChange={(e) => update("tips", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onSave(form)}
              className="flex-1 rounded-full bg-[#ff8c73] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c]"
            >
              保存
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-[#ffe0ce] bg-white py-3 text-sm font-bold text-[#76584e] transition hover:bg-[#fffaf4]"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseGoogleMapsUrl(url: string): { lat: number; lon: number } | null {
  // @lat,lng 格式
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]) };
  }
  // ?q=lat,lng 格式
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]) };
  }
  return null;
}

function FetchCoordsButton({
  address,
  onCoords,
}: {
  address: string;
  onCoords: (lat: number, lon: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!address.trim()) {
      alert("请先输入地址");
      return;
    }
    setLoading(true);
    try {
      const q = encodeURIComponent(address.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        {
          headers: {
            "Accept-Language": "ja",
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        onCoords(lat, lon);
      } else {
        alert("未找到该地址的坐标，请手动输入");
      }
    } catch {
      alert("获取坐标失败，请检查网络或手动输入");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title="根据地址自动获取经纬度"
      className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-[#fff0e8] px-3 py-2 text-xs font-bold text-[#ff8c73] transition hover:bg-[#ff8c73] hover:text-white disabled:opacity-50"
    >
      <MapPin className="h-3.5 w-3.5" />
      {loading ? "..." : "定位"}
    </button>
  );
}
