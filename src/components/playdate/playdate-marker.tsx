"use client";

import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { Playdate } from "@/types/playdate";

export type PlaydateMarkerProps = {
  map: Map;
  playdate: Playdate;
  onClick?: (playdate: Playdate) => void;
};

export function createPlaydateMarker({
  map,
  playdate,
  onClick,
}: PlaydateMarkerProps): maplibregl.Marker {
  const el = document.createElement("div");
  el.className = "relative flex h-8 w-8 cursor-pointer items-center justify-center";
  el.innerHTML = `
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff8c73] opacity-75"></span>
    <span class="relative inline-flex h-3 w-3 rounded-full bg-[#ff8c73] ring-2 ring-white"></span>
  `;

  const marker = new maplibregl.Marker({
    element: el,
    anchor: "center",
  })
    .setLngLat([playdate.longitude, playdate.latitude])
    .addTo(map);

  // Popup content
  const popup = new maplibregl.Popup({
    offset: 12,
    closeButton: false,
    className: "rounded-2xl",
  }).setHTML(createPopupHTML(playdate));

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    marker.setPopup(popup);
    marker.togglePopup();
    onClick?.(playdate);
  });

  return marker;
}

function createPopupHTML(playdate: Playdate): string {
  const meetAt = new Date(playdate.meet_at);
  const dateStr = meetAt.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
  const timeStr = meetAt.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div class="w-56 overflow-hidden rounded-2xl bg-white p-4 shadow-xl">
      <div class="text-xs font-bold text-[#ff8c73]">附近约伴 · ${dateStr} ${timeStr}</div>
      <div class="mt-1 text-base font-black text-[#2c3834] line-clamp-2">${escapeHtml(
        playdate.title,
      )}</div>
      <p class="mt-1 text-xs text-[#76584e] line-clamp-2">${escapeHtml(
        playdate.description || "",
      )}</p>
      <button
        type="button"
        class="mt-3 w-full rounded-full bg-[#ff8c73] px-3 py-2 text-xs font-black text-white"
        data-playdate-id="${playdate.id}"
      >
        查看详情
      </button>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
