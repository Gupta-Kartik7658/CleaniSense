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
    <div className="section-card space-y-4 text-left">
      <SectionHeader title="Nearby Hotspots" onAction={handleNavigate} />
      <HotspotMap hotspots={hotspots} loading={loading} />
      <HotspotList hotspots={hotspots} loading={loading} />
    </div>
  );
}
