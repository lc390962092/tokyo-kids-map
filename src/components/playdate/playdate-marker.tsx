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
  const el = document.createElement("button");
  el.type = "button";
  el.className =
    "relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0";
  el.style.zIndex = "10";
  el.setAttribute("aria-label", "约伴活动");

  const color = isMine ? "#4a8c4a" : "#ff8c73";
  // Custom slower pulse animation (3.5s cycle)
  const pulseId = `pulse-${Math.random().toString(36).slice(2, 8)}`;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes ${pulseId} {
      0% { transform: scale(0.5); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 0.4; }
      100% { transform: scale(0.5); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
  el.innerHTML = `
    <span class="pointer-events-none absolute inline-flex h-10 w-10 rounded-full opacity-75" style="background-color: ${color}; animation: ${pulseId} 3.5s ease-in-out infinite;"></span>
    <span class="pointer-events-none relative inline-flex h-4 w-4 rounded-full ring-2 ring-white" style="background-color: ${color}"></span>
  `;

  const marker = new maplibregl.Marker({
    element: el,
    anchor: "center",
    offset: [0, -6],
  })
    .setLngLat([playdate.longitude, playdate.latitude])
    .addTo(map);

  // Popup content
  const popup = new maplibregl.Popup({
    offset: 14,
    closeButton: false,
    closeOnClick: true,
    className: "rounded-2xl",
  }).setDOMContent(createPopupContent(playdate, onClick));

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    marker.setPopup(popup);
    marker.togglePopup();
    onClick?.(playdate);
  });

  return marker;
}

function createPopupContent(
  playdate: Playdate,
  onClick?: (playdate: Playdate) => void,
): HTMLElement {
  const meetAt = new Date(playdate.meet_at);
  const dateStr = meetAt.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
  const timeStr = meetAt.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const wrapper = document.createElement("div");
  wrapper.className = "w-56 overflow-hidden rounded-2xl bg-white p-4 shadow-xl";
  wrapper.innerHTML = `
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
  `;

  const btn = wrapper.querySelector(
    `button[data-playdate-id="${playdate.id}"]`,
  ) as HTMLButtonElement | null;
  if (btn && onClick) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(playdate);
    });
  }

  return wrapper;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
