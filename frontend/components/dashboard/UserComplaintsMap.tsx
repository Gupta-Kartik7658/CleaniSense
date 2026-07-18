"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Skeleton } from "../common/Skeleton";
import { ComplaintMapPoint } from "../../types/dashboard";

interface UserComplaintsMapProps {
  complaints?: ComplaintMapPoint[];
  loading?: boolean;
}

const COMPLAINT_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
];

function getMarkerColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COMPLAINT_COLORS.length;
  return COMPLAINT_COLORS[index];
}

function FitMapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export function UserComplaintsMap({ complaints = [], loading = false }: UserComplaintsMapProps) {
  const boundsPoints = useMemo<[number, number][]>(() => {
    return complaints.map((c) => [c.latitude, c.longitude] as [number, number]);
  }, [complaints]);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (boundsPoints.length > 0) return boundsPoints[0];
    return [23.0225, 72.5714]; // Ahmedabad default fallback
  }, [boundsPoints]);

  if (loading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  if (complaints.length === 0) {
    return (
      <div className="h-[420px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
        <span className="text-4xl mb-3">🗺️</span>
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
          No complaints registered
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Report an environmental issue to see your registered complaints plotted on the map.
        </p>
        <Link
          href="/complaints"
          className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Submit a report →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Your Registered Reports
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            {complaints.length} active report{complaints.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="h-[400px] w-full relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapBounds points={boundsPoints} />
          {complaints.map((c) => {
            const color = getMarkerColor(c.id);
            return (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={9}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[160px] text-left">
                    <p className="font-bold text-slate-900" style={{ color }}>{c.title}</p>
                    <p className="text-slate-500">{c.location_name}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Category: {c.category_name || "Other"}
                    </p>
                    <p className="text-emerald-700 font-semibold uppercase text-[10px]">
                      {c.status.replace(/_/g, " ")}
                    </p>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-emerald-600 font-bold text-[10px] hover:underline block mt-1"
                    >
                      View details →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
