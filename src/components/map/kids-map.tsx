"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { type Map, type Marker } from "maplibre-gl";
import { getCategoryColor, getCategoryLabel } from "@/data/place-options";
import type { Place } from "@/types/place";

type KidsMapProps = {
  places: Place[];
  selectedPlaceId?: string;
};

const tokyoCenter: [number, number] = [139.781, 35.748];

export default function KidsMap({ places, selectedPlaceId }: KidsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const boundsKey = useMemo(
    () => places.map((place) => place.id).join(":"),
    [places],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      center: tokyoCenter,
      zoom: 11,
      minZoom: 9,
      maxZoom: 17,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });

    mapRef.current.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "bottom-right",
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.title = place.nameZh;
      markerElement.className =
        "grid h-11 w-11 place-items-center rounded-full border-2 border-white text-base font-black text-white shadow-lg transition active:scale-95 cursor-pointer";
      markerElement.style.backgroundColor = getCategoryColor(place.category);
      markerElement.textContent = place.freeEntry ? "免" : "¥";

      const popupContent = createPopupContent(place);

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new maplibregl.Popup({
            offset: 18,
            closeButton: true,
          }).setDOMContent(popupContent),
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const selected = selectedPlaceId
      ? places.find((place) => place.id === selectedPlaceId)
      : undefined;

    if (selected) {
      map.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 14,
        essential: true,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    places.forEach((place) => bounds.extend([place.longitude, place.latitude]));
    map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 500 });
  }, [boundsKey, places, selectedPlaceId]);

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden bg-[#d9f1ea]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 hidden rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#567066] shadow-sm backdrop-blur md:block">
        OpenStreetMap · MapLibre GL
      </div>
    </div>
  );
}

function createPopupContent(place: Place) {
  const popupContent = document.createElement("div");
  popupContent.className = "w-64 overflow-hidden rounded-[18px] bg-white";

  const image = document.createElement("div");
  image.className = "h-20 bg-cover bg-center";
  image.style.backgroundImage = `url("${place.imageUrl}")`;

  const body = document.createElement("div");
  body.className = "space-y-2 p-4";

  const meta = document.createElement("div");
  meta.className = "text-xs font-bold text-[#f27d68]";
  meta.textContent = `${getCategoryLabel(place.category)} · ${place.ward}`;

  const title = document.createElement("div");
  title.className = "text-lg font-black text-[#2c3834]";
  title.textContent = place.nameZh;

  const subtitle = document.createElement("div");
  subtitle.className = "text-sm text-[#7d6358]";
  subtitle.textContent = place.nameJa;

  const age = document.createElement("div");
  age.className = "text-sm font-semibold text-[#5a7068]";
  age.textContent = `推荐 ${place.ageMin}-${place.ageMax} 岁`;

  const link = document.createElement("a");
  link.className =
    "inline-flex items-center gap-1 rounded-full bg-[#ff8c73] px-4 py-2 text-sm font-bold text-white";
  link.href = `/place/${place.id}`;
  link.textContent = "查看详情";

  body.append(meta, title, subtitle, age, link);
  popupContent.append(image, body);

  return popupContent;
}
