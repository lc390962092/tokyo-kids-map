"use client";

import { useEffect, useRef } from "react";
import type { Map, Marker } from "maplibre-gl";
import { fetchNearbyPlaydates } from "@/lib/playdates";
import { createPlaydateMarker } from "./playdate-marker";
import type { Playdate } from "@/types/playdate";

type PlaydateLayerProps = {
  map: Map;
  visible: boolean;
  onSelect: (playdate: Playdate) => void;
  radiusMeters?: number;
};

export function PlaydateLayer({
  map,
  visible,
  onSelect,
  radiusMeters = 3000,
}: PlaydateLayerProps) {
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      return;
    }

    let cancelled = false;

    async function load() {
      const center = map.getCenter();
      const playdates = await fetchNearbyPlaydates(
        center.lat,
        center.lng,
        radiusMeters,
      );
      if (cancelled) return;

      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add new markers
      playdates.forEach((p) => {
        const marker = createPlaydateMarker({
          map,
          playdate: p,
          onClick: onSelect,
        });
        markersRef.current.push(marker);
      });
    }

    load();

    const handleMoveEnd = () => load();
    map.on("moveend", handleMoveEnd);

    return () => {
      cancelled = true;
      map.off("moveend", handleMoveEnd);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, visible, onSelect, radiusMeters]);

  return null;
}
