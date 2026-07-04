import React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "../SectionHeader";
import { HotspotMap } from "./HotspotMap";
import { HotspotList } from "./HotspotList";
import { HotspotItem } from "../../../types/dashboard";

interface HotspotSectionProps {
  hotspots?: HotspotItem[];
  loading?: boolean;
}

export function HotspotSection({
  hotspots,
  loading = false,
}: HotspotSectionProps) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push("/hotspots");
  };

  return (
    <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
      <SectionHeader title="Nearby Hotspots" onAction={handleNavigate} />
      <HotspotMap hotspots={hotspots} loading={loading} />
      <HotspotList hotspots={hotspots} loading={loading} />
    </div>
  );
}
