"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map, type Marker } from "maplibre-gl";
import { Crosshair, Plus, Minus } from "lucide-react";
import { getCategoryColor, getCategoryLabel } from "@/data/place-options";
import { PlaydateLayer } from "@/components/playdate/playdate-layer";
import type { Place } from "@/types/place";
import type { Playdate } from "@/types/playdate";

type KidsMapProps = {
  places: Place[];
  selectedPlaceId?: string;
  showPlaydates?: boolean;
  onSelectPlaydate?: (playdate: Playdate) => void;
  onCreatePlaydateFromPlace?: (place: Place) => void;
  onPlaydatesLoaded?: (playdates: Playdate[]) => void;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (placeId: string) => void;
};

const tokyoCenter: [number, number] = [139.781, 35.748];

const categoryEmoji: Record<Place["category"], string> = {
  park: "🌳",
  library: "📚",
  children_center: "🧸",
  zoo: "🦁",
  aquarium: "🐠",
  science_museum: "🔬",
  indoor_play: "🎪",
  museum: "🏛️",
  landmark: "🗼",
  river: "🌊",
};

function createGeoJSON(places: Place[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        id: place.id,
        name: place.nameZh,
        category: place.category,
        free: place.freeEntry,
      },
    })),
  };
}

export default function KidsMap({
  places,
  selectedPlaceId,
  showPlaydates = false,
  onSelectPlaydate,
  onCreatePlaydateFromPlace,
  onPlaydatesLoaded,
  favoriteIds,
  onToggleFavorite,
}: KidsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const placesRef = useRef(places);
  placesRef.current = places;
  const onCreatePlaydateRef = useRef(onCreatePlaydateFromPlace);
  onCreatePlaydateRef.current = onCreatePlaydateFromPlace;
  const favoriteIdsRef = useRef(favoriteIds);
  favoriteIdsRef.current = favoriteIds;
  const onToggleFavoriteRef = useRef(onToggleFavorite);
  onToggleFavoriteRef.current = onToggleFavorite;
  const [mapLoaded, setMapLoaded] = useState(false);
  const initialFitDoneRef = useRef(false);

  // Initialize map + source + layers (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
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

    mapRef.current = map;

    map.once("load", () => {
      setMapLoaded(true);
      const geojson = createGeoJSON(placesRef.current);

      map.addSource("places", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 40,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#ff8c73",
            10,
            "#f27d68",
            30,
            "#e66b55",
          ],
          "circle-radius": ["step", ["get", "point_count"], 24, 10, 30, 30, 36],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count}",
          "text-font": ["Noto Sans Regular"],
          "text-size": 15,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.on("click", "clusters", async (e: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;

        const feature = features[0];
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource("places") as maplibregl.GeoJSONSource;

        try {
          // Fit to the actual children so the user always sees what was inside
          // the cluster after it disappears.
          const leaves = await source.getClusterLeaves(clusterId, 1000, 0);
          if (leaves.length === 0) return;

          const bounds = new maplibregl.LngLatBounds();
          leaves.forEach((leaf) => {
            const coords = (leaf.geometry as GeoJSON.Point)
              .coordinates as [number, number];
            bounds.extend(coords);
          });
          bounds.extend(
            (feature.geometry as GeoJSON.Point).coordinates as [number, number],
          );

          map.fitBounds(bounds, {
            padding: { top: 160, bottom: 160, left: 80, right: 80 },
            maxZoom: 16,
            duration: 450,
          });
        } catch {
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point)
              .coordinates as [number, number],
            zoom: Math.min(map.getZoom() + 2, 16),
            duration: 400,
          });
        }
      });

      const updateMarkers = () => {
        const currentPlaces = placesRef.current;
        const features = map.querySourceFeatures("places", {
          filter: ["!", ["has", "point_count"]],
        });

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const zoom = map.getZoom();
        // Visible marker: 44-56px; touch target always at least 56px
        const visibleSize = Math.round(Math.max(44, Math.min(56, 36 + (zoom - 10) * 4)));
        const touchSize = Math.max(56, visibleSize + 16);
        const fontSize = Math.max(18, Math.round(visibleSize * 0.45));

        const uniqueIds = new Set<string>();
        features.forEach((f) => {
          const props = f.properties as Record<string, unknown> | undefined;
          if (!props) return;
          const id = props.id as string;
          if (!id || uniqueIds.has(id)) return;
          uniqueIds.add(id);

          const place = currentPlaces.find((p) => p.id === id);
          if (!place) return;

          const isFavorited = favoriteIdsRef.current?.has(place.id) ?? false;
          const color = getCategoryColor(place.category);
          const emoji = categoryEmoji[place.category] ?? "📍";

          const wrapper = document.createElement("button");
          wrapper.type = "button";
          wrapper.className =
            "group relative grid place-items-center rounded-full border-0 bg-transparent p-0";
          wrapper.style.width = `${touchSize}px`;
          wrapper.style.height = `${touchSize}px`;
          wrapper.style.cursor = "pointer";

          const inner = document.createElement("span");
          inner.className =
            "relative grid place-items-center rounded-full border-2 border-white font-black text-white shadow-lg transition-transform duration-150 group-hover:scale-110 group-active:scale-95";
          inner.style.backgroundColor = color;
          inner.style.width = `${visibleSize}px`;
          inner.style.height = `${visibleSize}px`;
          inner.style.fontSize = `${fontSize}px`;
          inner.style.lineHeight = "1";
          inner.textContent = emoji;

          if (isFavorited) {
            const badge = document.createElement("span");
            badge.className =
              "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-sm";
            badge.textContent = "♥";
            inner.append(badge);
          }

          wrapper.append(inner);

          const popup = new maplibregl.Popup({
            offset: Math.round(visibleSize / 2 + 6),
            closeButton: true,
            closeOnClick: true,
            maxWidth: "280px",
          }).setDOMContent(
            createPopupContent(
              place,
              onCreatePlaydateRef.current,
              favoriteIdsRef.current?.has(place.id) ?? false,
              onToggleFavoriteRef.current,
            ),
          );

          const marker = new maplibregl.Marker({ element: wrapper })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(popup)
            .addTo(map);

          wrapper.addEventListener("click", (e) => {
            e.stopPropagation();
            marker.togglePopup();
          });

          markersRef.current.push(marker);
        });
      };

      let updatePending = false;
      const scheduleUpdateMarkers = () => {
        if (updatePending) return;
        updatePending = true;
        requestAnimationFrame(() => {
          updatePending = false;
          if (!mapRef.current) return;
          updateMarkers();
        });
      };

      map.on("moveend", scheduleUpdateMarkers);
      map.on("data", (e: maplibregl.MapSourceDataEvent) => {
        if (e.sourceId === "places" && e.isSourceLoaded)
          scheduleUpdateMarkers();
      });
      map.on("idle", scheduleUpdateMarkers);
      updateMarkers();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update source data when places change (filter changes do not reset view)
  useEffect(() => {
    placesRef.current = places;
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("places") as
      | maplibregl.GeoJSONSource
      | undefined;
    if (source) {
      source.setData(createGeoJSON(places));
    }
  }, [places]);

  // Initial fit bounds (only once)
  useEffect(() => {
    if (!mapLoaded || places.length === 0 || initialFitDoneRef.current) return;
    if (selectedPlaceId) return; // handled by fly effect below

    const bounds = new maplibregl.LngLatBounds();
    places.forEach((place) => bounds.extend([place.longitude, place.latitude]));
    mapRef.current?.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 600 });
    initialFitDoneRef.current = true;
  }, [mapLoaded, places, selectedPlaceId]);

  // Fly to selected place when prop changes
  useEffect(() => {
    if (!mapLoaded || !selectedPlaceId) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place) return;
    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 15,
      essential: true,
    });
    initialFitDoneRef.current = true;
  }, [mapLoaded, selectedPlaceId, places]);

  const handleLocate = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!navigator.geolocation) {
      window.alert("您的浏览器不支持地理定位。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true,
        });
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        } else {
          const el = document.createElement("div");
          el.className =
            "h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg ring-2 ring-blue-300";
          userMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map);
        }
      },
      () => {
        window.alert("无法获取您的位置，请检查定位权限设置。");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 250 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 250 });
  };

  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map || placesRef.current.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    placesRef.current.forEach((place) =>
      bounds.extend([place.longitude, place.latitude]),
    );
    map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 500 });
  };

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden bg-[#d9f1ea]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 hidden rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#567066] shadow-sm backdrop-blur md:block">
        OpenStreetMap · MapLibre GL
      </div>
      <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#ff8c73] shadow-lg transition hover:scale-105 active:scale-95"
          aria-label="放大"
          title="放大"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#ff8c73] shadow-lg transition hover:scale-105 active:scale-95"
          aria-label="缩小"
          title="缩小"
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleLocate}
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#ff8c73] shadow-lg transition hover:scale-105 active:scale-95"
          aria-label="我的位置"
          title="我的位置"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleFitAll}
        className="absolute bottom-6 right-4 z-10 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#76584e] shadow-lg transition hover:scale-105 active:scale-95"
        aria-label="显示全部"
        title="显示全部"
      >
        显示全部
      </button>
      {mapLoaded && showPlaydates && mapRef.current && (
        <PlaydateLayer
          map={mapRef.current}
          visible={showPlaydates}
          onSelect={(p) => onSelectPlaydate?.(p)}
          onPlaydatesLoaded={onPlaydatesLoaded}
        />
      )}
    </div>
  );
}

function createPopupContent(
  place: Place,
  onCreatePlaydate?: (place: Place) => void,
  isFavorited = false,
  onToggleFavorite?: (placeId: string) => void,
) {
  const popupContent = document.createElement("div");
  popupContent.className = "w-64 overflow-hidden rounded-[18px] bg-white";

  const image = document.createElement("div");
  image.className = "h-24 bg-cover bg-center";
  image.style.backgroundImage = `url("${place.imageUrl}")`;

  const body = document.createElement("div");
  body.className = "space-y-2 p-4";

  const meta = document.createElement("div");
  meta.className = "flex items-center justify-between";

  const metaText = document.createElement("span");
  metaText.className = "text-xs font-bold text-[#f27d68]";
  metaText.textContent = `${getCategoryLabel(place.category)} · ${place.ward}`;
  meta.append(metaText);

  if (onToggleFavorite) {
    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.title = isFavorited ? "取消收藏" : "收藏";
    favBtn.className = `grid h-8 w-8 place-items-center rounded-full transition ${isFavorited ? "bg-red-50 text-red-500" : "bg-[#fff0e8] text-[#c4a99b]"}`;
    favBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFavorited ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleFavorite(place.id);
    });
    meta.append(favBtn);
  }

  const title = document.createElement("div");
  title.className = "text-lg font-black text-[#2c3834]";
  title.textContent = place.nameZh;

  const subtitle = document.createElement("div");
  subtitle.className = "text-sm text-[#7d6358]";
  subtitle.textContent = place.nameJa;

  const age = document.createElement("div");
  age.className = "text-sm font-semibold text-[#5a7068]";
  age.textContent = `推荐 ${place.ageMin}-${place.ageMax} 岁`;

  const scoreRow = document.createElement("div");
  scoreRow.className = "flex flex-wrap gap-1.5";
  const scoreChips = [
    { label: "放电", score: place.playScore },
    { label: "婴儿车", score: place.strollerScore },
    { label: "停车", score: place.parkingScore },
    { label: "换尿布", score: place.diaperScore },
  ];
  scoreChips.forEach(({ label, score }) => {
    const chip = document.createElement("span");
    chip.className =
      "inline-flex items-center rounded-full bg-[#fff5ef] px-2 py-0.5 text-[10px] font-bold text-[#76584e]";
    chip.textContent = `${label} ${"★".repeat(score)}${"☆".repeat(5 - score)}`;
    scoreRow.append(chip);
  });

  const actions = document.createElement("div");
  actions.className = "flex flex-wrap gap-2 pt-1";

  const link = document.createElement("a");
  link.className =
    "inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[#ff8c73] px-3 py-2 text-sm font-bold text-white";
  link.href = `/place/${place.id}`;
  link.textContent = "查看详情";
  actions.append(link);

  const navBtn = document.createElement("a");
  navBtn.className =
    "inline-flex items-center justify-center gap-1 rounded-full border border-[#ff8c73] bg-white px-3 py-2 text-sm font-bold text-[#ff8c73]";
  navBtn.href = getNavigationUrl(place.latitude, place.longitude, place.nameZh);
  navBtn.target = "_blank";
  navBtn.rel = "noopener noreferrer";
  navBtn.textContent = "导航";
  actions.append(navBtn);

  if (onCreatePlaydate) {
    const playdateBtn = document.createElement("button");
    playdateBtn.type = "button";
    playdateBtn.className =
      "inline-flex w-full items-center justify-center gap-1 rounded-full border border-[#4a8c4a] bg-white px-3 py-2 text-sm font-bold text-[#4a8c4a]";
    playdateBtn.textContent = "发起约伴";
    playdateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onCreatePlaydate(place);
    });
    actions.append(playdateBtn);
  }

  body.append(meta, title, subtitle, age, scoreRow, actions);
  popupContent.append(image, body);

  return popupContent;
}

function getNavigationUrl(lat: number, lng: number, label: string): string {
  if (
    typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  ) {
    return `https://maps.apple.com/?q=${encodeURIComponent(label)}&ll=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
