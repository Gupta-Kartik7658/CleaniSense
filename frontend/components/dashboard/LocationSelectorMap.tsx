"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationSelectorMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

function MapEventsHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LocationSelectorMap({ latitude, longitude, onChange }: LocationSelectorMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      style={{ height: "220px", width: "100%" }}
      className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[latitude, longitude]}
        radius={10}
        pathOptions={{
          color: "#ffffff",
          weight: 2.5,
          fillColor: "#10b981", // Emerald-500
          fillOpacity: 0.95,
        }}
      />
      <MapEventsHandler onChange={onChange} />
      <RecenterMap lat={latitude} lng={longitude} />
    </MapContainer>
  );
}
