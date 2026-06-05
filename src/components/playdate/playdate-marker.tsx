"use client";

import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { Playdate } from "@/types/playdate";

export type PlaydateMarkerProps = {
  map: Map;
  playdate: Playdate;
  onClick?: (playdate: Playdate) => void;
  isMine?: boolean;
};

export function createPlaydateMarker({
  map,
  playdate,
  onClick,
  isMine = false,
}: PlaydateMarkerProps): maplibregl.Marker {
  const el = document.createElement("div");
  el.className = "relative z-20 flex h-10 w-10 cursor-pointer items-center justify-center";
  el.style.zIndex = "20";
  const color = isMine ? "#4a8c4a" : "#ff8c73";
  el.innerHTML = `
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style="background-color: ${color}"></span>
    <span class="relative inline-flex h-4 w-4 rounded-full ring-2 ring-white" style="background-color: ${color}"></span>
  `;

  // Slightly offset to avoid overlapping with place markers at exact same location
  const offsetLat = 0.00002;

  const marker = new maplibregl.Marker({
    element: el,
    anchor: "center",
  })
    .setLngLat([playdate.longitude, playdate.latitude + offsetLat])
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
      <div class="inline-block rounded-full bg-[#ff8c73] px-2 py-0.5 text-[10px] font-black text-white">约伴</div>
      <div class="mt-1 text-xs font-bold text-[#8a6b5e]">${dateStr} ${timeStr}</div>
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
