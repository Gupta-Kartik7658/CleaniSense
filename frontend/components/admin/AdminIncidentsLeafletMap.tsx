"use client";

import React, { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { filterComplaintsByPollutionType, filterHotspotsForDisplay, filterSinglesByPollutionType, matchesCategoryFilter } from "../../utils/hotspotFilters";

export interface AdminHotspotItem {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  radius_meters?: number;
  city: string;
  district?: string;
  dominantType: string;
  averageSeverity?: number;
  complaints: any[];
}

export interface AdminSingleItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  location_name?: string;
  status: string;
  category_name?: string;
}

interface AdminIncidentsLeafletMapProps {
  hotspots: AdminHotspotItem[];
  singles?: AdminSingleItem[];
  selectedCity?: string | null;
  selectedHotspotId?: string | null;
  pollutionFilter?: string;
  mapMode?: "vector" | "clusters";
  height?: string;
  onSelectHotspot?: (hotspot: AdminHotspotItem) => void;
}

function getCategoryColor(type: string = ""): string {
  const t = type.toLowerCase();
  if (t.includes("air") || t.includes("aqi") || t.includes("smoke")) return "#06b6d4"; // Cyan
  if (t.includes("water") || t.includes("sewage") || t.includes("drain")) return "#2563eb"; // Blue
  if (t.includes("noise") || t.includes("sound")) return "#8b5cf6"; // Purple
  return "#10b981"; // Emerald for Land/Waste/General
}



function FitMapBounds({
  hotspots,
  selectedCity,
  selectedHotspotId,
}: {
  hotspots: AdminHotspotItem[];
  selectedCity?: string | null;
  selectedHotspotId?: string | null;
}) {
  const map = useMap();
  const hasFittedInitialRef = React.useRef(false);
  const prevHotspotIdRef = React.useRef<string | null | undefined>(selectedHotspotId);

  useEffect(() => {
    // If the user explicitly clicked on a specific hotspot to inspect:
    if (selectedHotspotId && selectedHotspotId !== prevHotspotIdRef.current) {
      prevHotspotIdRef.current = selectedHotspotId;
      const target = hotspots.find((h) => h.id === selectedHotspotId);
      if (target && target.latitude && target.longitude) {
        map.setView([target.latitude, target.longitude], 15, { animate: true });
        return;
      }
    }
    prevHotspotIdRef.current = selectedHotspotId;

    // Only do initial auto-bounding ONCE on load so filter changes don't move the map!
    if (hasFittedInitialRef.current) return;
    if (!hotspots || hotspots.length === 0) return;

    hasFittedInitialRef.current = true;

    if (selectedCity) {
      const cityHotspots = hotspots.filter((h) => h.city === selectedCity);
      if (cityHotspots.length > 0) {
        const points: [number, number][] = cityHotspots.map((h) => [
          h.latitude,
          h.longitude,
        ]);
        if (points.length === 1) {
          map.setView(points[0], 14, { animate: true });
        } else {
          map.fitBounds(points, { padding: [50, 50], maxZoom: 15 });
        }
        return;
      }
    }

    // Default: fit all hotspots
    const allPoints: [number, number][] = hotspots
      .filter((h) => h.latitude && h.longitude)
      .map((h) => [h.latitude, h.longitude]);

    if (allPoints.length === 1) {
      map.setView(allPoints[0], 13);
    } else if (allPoints.length > 1) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, hotspots, selectedCity, selectedHotspotId]);

  return null;
}

export function AdminIncidentsLeafletMap({
  hotspots,
  singles = [],
  selectedCity,
  selectedHotspotId,
  pollutionFilter = "all",
  mapMode = "vector",
  height = "550px",
  onSelectHotspot,
}: AdminIncidentsLeafletMapProps) {

  // Default center if no points available
  const defaultCenter: [number, number] = useMemo(() => {
    if (hotspots.length > 0 && hotspots[0].latitude && hotspots[0].longitude) {
      return [hotspots[0].latitude, hotspots[0].longitude];
    }
    return [26.875, 80.997]; // Centroid default
  }, [hotspots]);

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", zIndex: 1 }}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapBounds
          hotspots={hotspots}
          selectedCity={selectedCity}
          selectedHotspotId={selectedHotspotId}
        />

        {/* Render Hotspot Shaded Regions and Number Badges */}
        {hotspots.map((h) => {
          const filteredList = filterComplaintsByPollutionType(h.complaints || [], pollutionFilter);
          const domMatches = matchesCategoryFilter(h.dominantType, pollutionFilter);
          // Show hotspot if dominant type OR any complaints match the filter
          const displayCount = pollutionFilter === "all" ? h.count : filteredList.length;
          if (pollutionFilter !== "all" && displayCount === 0 && !domMatches) {
            return null;
          }

          const color = getCategoryColor(h.dominantType);
          const isSelected = selectedHotspotId === h.id || (selectedCity && h.city === selectedCity);
          const radius = h.radius_meters || 50.0;

          const badgeIcon = L.divIcon({
            className: "",
            html: `<div style="width:34px;height:34px;border-radius:50%;background:${color};color:#ffffff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 3px 12px rgba(0,0,0,0.35);cursor:pointer;transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};">${displayCount}</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          return (
            <React.Fragment key={h.id}>
              {/* 50m Shaded Region */}
              <Circle
                center={[h.latitude, h.longitude]}
                radius={radius}
                pathOptions={{
                  color: color,
                  weight: isSelected ? 3 : 2,
                  dashArray: "6 4",
                  fillColor: color,
                  fillOpacity: isSelected ? 0.28 : 0.16,
                }}
              />

              {/* Number Marker */}
              <Marker
                position={[h.latitude, h.longitude]}
                icon={badgeIcon}
                eventHandlers={{
                  click: () => {
                    if (onSelectHotspot) onSelectHotspot(h);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[200px] text-left">
                    <div className="flex items-center justify-between border-b pb-1">
                      <p className="font-extrabold text-slate-900" style={{ color }}>
                        {h.city || "City Hotspot"}
                      </p>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded uppercase">
                        {h.dominantType}
                      </span>
                    </div>

                    <p className="text-slate-600 font-semibold text-[11px]">
                      🚨 <span className="font-bold text-slate-900">{displayCount}</span> Incident Reports in 50m Zone
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      District / Location: {h.district || "Local Region"}
                    </p>

                    {filteredList.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-150 space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          Pollution Incidents ({filteredList.length}):
                        </p>
                        <ul className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                          {filteredList.map((c: any) => (
                            <li key={c.id || c.title} className="text-[10px] truncate text-slate-700">
                              • <span className="font-semibold text-slate-900">{c.title}</span> ({c.category_name || "General"})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Render Single Reported Incidents — filtered by pollution type in non-all modes */}
        {mapMode === "vector" &&
          filterSinglesByPollutionType(singles, pollutionFilter).map((s) => (
            <CircleMarker
              key={s.id}
              center={[s.latitude, s.longitude]}
              radius={6}
              pathOptions={{
                color: "#ffffff",
                weight: 1.5,
                fillColor: "#2563eb",
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="text-xs text-left">
                  <p className="font-bold text-slate-900">{s.title}</p>
                  <p className="text-slate-500 text-[10px]">{s.location_name}</p>
                  <p className="text-blue-600 font-semibold text-[10px] uppercase">
                    Single Incident ({s.category_name || "General"})
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
