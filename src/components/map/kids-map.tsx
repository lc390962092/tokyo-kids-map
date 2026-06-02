"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { type Map, type Marker } from "maplibre-gl";
import { Crosshair } from "lucide-react";
import { getCategoryColor, getCategoryLabel } from "@/data/place-options";
import type { Place } from "@/types/place";

type KidsMapProps = {
  places: Place[];
  selectedPlaceId?: string;
};

const tokyoCenter: [number, number] = [139.781, 35.748];

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

export default function KidsMap({ places, selectedPlaceId }: KidsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const placesRef = useRef(places);
  placesRef.current = places;

  const boundsKey = useMemo(
    () => places.map((place) => place.id).join(":"),
    [places],
  );

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

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "bottom-right",
    );

    map.once("load", () => {
      const geojson = createGeoJSON(placesRef.current);

      map.addSource("places", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
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
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 30, 30],
          "circle-stroke-width": 2,
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
          "text-size": 14,
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
          const zoom = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point)
              .coordinates as [number, number],
            zoom: zoom || 14,
          });
        } catch {
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point)
              .coordinates as [number, number],
            zoom: 14,
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
        const scale = Math.max(
          0.55,
          Math.min(1.2, 0.45 + (zoom - 8) * 0.08),
        );
        const size = Math.round(44 * scale);
        const fontSize = Math.max(10, Math.round(16 * scale));

        const uniqueIds = new Set<string>();
        features.forEach((f) => {
          const props = f.properties as Record<string, unknown> | undefined;
          if (!props) return;
          const id = props.id as string;
          if (!id || uniqueIds.has(id)) return;
          uniqueIds.add(id);

          const place = currentPlaces.find((p) => p.id === id);
          if (!place) return;

          const markerElement = document.createElement("button");
          markerElement.type = "button";
          markerElement.className =
            "grid place-items-center rounded-full border-2 border-white font-black text-white shadow-lg transition active:scale-95 cursor-pointer";
          markerElement.style.backgroundColor = getCategoryColor(
            place.category,
          );
          markerElement.style.width = `${size}px`;
          markerElement.style.height = `${size}px`;
          markerElement.style.fontSize = `${fontSize}px`;
          markerElement.textContent = place.freeEntry ? "免" : "¥";

          const popup = new maplibregl.Popup({
            offset: Math.round(14 * scale),
            closeButton: true,
          }).setDOMContent(createPopupContent(place));

          const marker = new maplibregl.Marker({ element: markerElement })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(popup)
            .addTo(map);

          markerElement.addEventListener("click", (e) => {
            e.stopPropagation();
            marker.togglePopup();
          });

          markersRef.current.push(marker);
        });
      };

      const handleMoveEnd = () => updateMarkers();
      const handleData = (e: maplibregl.MapSourceDataEvent) => {
        if (e.sourceId === "places" && e.isSourceLoaded) updateMarkers();
      };

      map.on("moveend", handleMoveEnd);
      map.on("data", handleData);
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

  // Update source data when places change
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

  // Fly to selected place or fit bounds
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

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden bg-[#d9f1ea]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 hidden rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#567066] shadow-sm backdrop-blur md:block">
        OpenStreetMap · MapLibre GL
      </div>
      <button
        type="button"
        onClick={handleLocate}
        className="absolute bottom-6 left-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white text-[#ff8c73] shadow-lg transition hover:scale-105 active:scale-95"
        aria-label="我的位置"
        title="我的位置"
      >
        <Crosshair className="h-5 w-5" />
      </button>
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
