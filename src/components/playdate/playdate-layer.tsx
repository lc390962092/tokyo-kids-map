"use client";

import { useEffect, useRef } from "react";
import type { Map, Marker } from "maplibre-gl";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchNearbyPlaydates } from "@/lib/playdates";
import { createPlaydateMarker } from "./playdate-marker";
import type { Playdate } from "@/types/playdate";

type PlaydateLayerProps = {
  map: Map;
  visible: boolean;
  onSelect: (playdate: Playdate) => void;
  onPlaydatesLoaded?: (playdates: Playdate[]) => void;
  radiusMeters?: number;
};

export function PlaydateLayer({
  map,
  visible,
  onSelect,
  onPlaydatesLoaded,
  radiusMeters = 3000,
}: PlaydateLayerProps) {
  const { user } = useAuth();
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    console.log("[PlaydateLayer] useEffect", { visible, mapId: map?.getContainer()?.id });
    if (!visible) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      return;
    }

    let cancelled = false;

    async function load() {
      const center = map.getCenter();
      console.log("[PlaydateLayer] loading, center:", center);
      const playdates = await fetchNearbyPlaydates(
        center.lat,
        center.lng,
        radiusMeters,
      );
      console.log("[PlaydateLayer] loaded", playdates.length, playdates);
      if (cancelled) return;

      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add new markers
      onPlaydatesLoaded?.(playdates);

      playdates.forEach((p) => {
        const marker = createPlaydateMarker({
          map,
          playdate: p,
          onClick: onSelect,
          isMine: user?.id === p.user_id,
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
