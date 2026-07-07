"use client";

import React, { useEffect, useState } from "react";
import { HotspotsPageView } from "@/components/pages/HotspotsPageView";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useHotspots } from "@/hooks/useHotspots";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

export default function HotspotsPage() {
  const { coords, loading: loadingLocation } = useCurrentLocation();
  const { hotspots, activeHotspot, fetchHotspots, fetchHotspotDetail, loading, error } = useHotspots();
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    const controller = new AbortController();

    fetchHotspots(
      coords?.latitude || undefined,
      coords?.longitude || undefined,
      5.0,
      severityFilter === "all" ? undefined : severityFilter,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [coords, fetchHotspots, severityFilter]);

  useEffect(() => {
    const controller = new AbortController();

    if (hotspots.length > 0) {
      const preferredId =
        activeHotspot?.id && hotspots.some((hotspot) => hotspot.id === activeHotspot.id)
          ? activeHotspot.id
          : hotspots[0].id;

      if (preferredId !== activeHotspot?.id) {
        void fetchHotspotDetail(preferredId, controller.signal).catch(() => undefined);
      }
    }
    return () => controller.abort();
  }, [activeHotspot?.id, fetchHotspotDetail, hotspots]);

  const getSeverityStyle = (sev: string) => {
    const severity = sev.toLowerCase();
    if (severity === "high") {
      return "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400";
    }
    if (severity === "medium") {
      return "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400";
    }
    return "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-450";
  };

  return (
    <HotspotsPageView
      coords={coords ? { latitude: coords.latitude, longitude: coords.longitude } : null}
      loadingLocation={loadingLocation}
      hotspots={hotspots}
      activeHotspot={activeHotspot}
      loading={loading}
      error={error}
      severityFilter={severityFilter}
      setSeverityFilter={setSeverityFilter}
      onSelectHotspot={(id) => {
        void fetchHotspotDetail(id).catch(() => undefined);
      }}
    />
  );
}
