import { DashboardData } from "../types/dashboard";

export const mockDashboardData: DashboardData = {
  summary: [
    { label: "Total Reports", value: 18, change: "+2 this week", statusType: "neutral" },
    { label: "Active Reports", value: 5, change: "Pending review", statusType: "warning" },
    { label: "Resolved Reports", value: 12, change: "94% resolution rate", statusType: "success" },
    { label: "Nearby Hotspots", value: 3, change: "1.5km radius", statusType: "danger" }
  ],
  reports: [
    {
      id: "rep-001",
      title: "Illegal Garbage Dump",
      status: "Under Review",
      locationName: "Satellite Road, Ahmedabad",
      latitude: 23.0305,
      longitude: 72.5074,
      date: "2026-07-02"
    },
    {
      id: "rep-002",
      title: "Open Waste Burning",
      status: "Pending",
      locationName: "Sagar Cooperative Society, Bopal",
      latitude: 23.0338,
      longitude: 72.4633,
      date: "2026-07-01"
    },
    {
      id: "rep-003",
      title: "Industrial Smoke Emission",
      status: "Resolved",
      locationName: "GIDC Industrial Area, Naroda",
      latitude: 23.0762,
      longitude: 72.6592,
      date: "2026-06-28"
    },
    {
      id: "rep-004",
      title: "Plastic Waste Accumulation",
      status: "Resolved",
      locationName: "Vastrapur Lake Pathway, Ahmedabad",
      latitude: 23.0354,
      longitude: 72.5284,
      date: "2026-06-25"
    },
    {
      id: "rep-005",
      title: "Blocked Drainage Overflow",
      status: "Rejected",
      locationName: "C.G. Road Crossings, Ahmedabad",
      latitude: 23.0274,
      longitude: 72.5599,
      date: "2026-06-22"
    }
  ],
  hotspots: [
    {
      id: "hot-001",
      title: "Naroda Industrial Smoke",
      distance: "4.2 km",
      priority: "High",
      reportsCount: 8
    },
    {
      id: "hot-002",
      title: "Vastrapur Waste Stagnation",
      distance: "1.2 km",
      priority: "Medium",
      reportsCount: 4
    },
    {
      id: "hot-003",
      title: "Bopal Open Garbage Burning",
      distance: "2.5 km",
      priority: "High",
      reportsCount: 5
    }
  ]
};
