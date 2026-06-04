"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { createPlaydate } from "@/lib/playdates";
import type { Place } from "@/types/place";

function parseGoogleMapsUrl(url: string): { lat: number; lon: number } | null {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]) };
  }
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]) };
  }
  return null;
}

type PlaydateFormModalProps = {
  places: Place[];
  defaultCenter?: { latitude: number; longitude: number };
  defaultPlaceId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function PlaydateFormModal({
  places,
  defaultCenter,
  defaultPlaceId,
  onClose,
  onSuccess,
}: PlaydateFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetAt, setMeetAt] = useState("");
  const [placeId, setPlaceId] = useState(defaultPlaceId ?? "");
  const [latitude, setLatitude] = useState(defaultCenter?.latitude ?? 35.748);
  const [longitude, setLongitude] = useState(defaultCenter?.longitude ?? 139.781);
  const [address, setAddress] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [radius, setRadius] = useState(3000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default meet time: tomorrow same hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(0);
    setMeetAt(tomorrow.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setLatitude(place.latitude);
      setLongitude(place.longitude);
      setAddress(place.address);
    }
  }, [placeId, places]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !meetAt) {
      alert("请填写标题和时间");
      return;
    }
    setLoading(true);
    const { error } = await createPlaydate({
      place_id: placeId || null,
      title: title.trim(),
      description: description.trim() || null,
      meet_at: new Date(meetAt).toISOString(),
      latitude,
      longitude,
      radius_meters: radius,
      max_participants: maxParticipants,
    });
    setLoading(false);
    if (error) {
      alert("发起失败: " + error.message);
      return;
    }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#2c3834]">发起一起溜娃</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-[#fff0e8] p-2 text-[#76584e] transition hover:bg-[#ffe0ce]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              标题
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：周六上午 xxx公园溜娃"
              className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              说明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="几岁娃、想玩什么、怎么联系..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              见面时间
            </label>
            <input
              type="datetime-local"
              value={meetAt}
              onChange={(e) => setMeetAt(e.target.value)}
              className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              关联地点（可选）
            </label>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
            >
              <option value="">不关联，手动填写位置</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameZh} · {p.ward}
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="具体见面地点"
                className="flex-1 rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(address || "東京")}`}
                target="_blank"
                rel="noopener noreferrer"
                title="在 Google Maps 搜索"
                className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-[#e8f4e8] px-3 py-2 text-xs font-bold text-[#4a8c4a] transition hover:bg-[#4a8c4a] hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                搜索
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                Google Maps 链接（粘贴后自动解析坐标）
              </label>
              <input
                placeholder="https://www.google.com/maps/place/..."
                onChange={(e) => {
                  const coords = parseGoogleMapsUrl(e.target.value);
                  if (coords) {
                    setLatitude(coords.lat);
                    setLongitude(coords.lon);
                  }
                }}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                纬度
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
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
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                最多几组家庭
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                可见范围（米）
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#ff8c73]"
              >
                <option value={1000}>1km</option>
                <option value={3000}>3km（默认）</option>
                <option value={5000}>5km</option>
                <option value={10000}>10km</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-[#ff8c73] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c] disabled:opacity-50"
            >
              {loading ? "发起中..." : "发起邀约"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#ffe0ce] bg-white py-3 text-sm font-bold text-[#76584e] transition hover:bg-[#fffaf4]"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
