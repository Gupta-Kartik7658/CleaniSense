import { DashboardData, ReportItem } from "../types/dashboard";

export interface TimelineEvent {
  timestamp: string;
  status: string;
  remarks?: string;
}

export interface ResolutionReport {
  summary: string;
  department: string;
  officerName: string;
  dateResolved: string;
  actions: string;
  citizenRemarks?: string;
  beforeImage: string;
  afterImage: string;
}

export interface DetailedReportItem extends ReportItem {
  category: string;
  severity: "High" | "Medium" | "Low";
  municipality: string;
  timeline: TimelineEvent[];
  resolution?: ResolutionReport;
}

export const mockDetailedReports: DetailedReportItem[] = [
  {
    id: "rep-001",
    title: "Illegal Garbage Dump",
    status: "Resolved",
    category: "Waste Management",
    severity: "High",
    locationName: "Satellite Road, Ahmedabad",
    latitude: 23.0305,
    longitude: 72.5074,
    date: "2026-07-02",
    municipality: "Ahmedabad Municipal Corporation (AMC)",
    timeline: [
      { timestamp: "2026-07-02T10:00:00Z", status: "Submitted", remarks: "Report successfully logged by citizen." },
      { timestamp: "2026-07-02T10:05:00Z", status: "AI Validation Completed", remarks: "OpenCV classified: Plastic & Solid Waste. Severity rating: High." },
      { timestamp: "2026-07-02T11:30:00Z", status: "Municipality Accepted", remarks: "AMC Solid Waste Division verified and accepted the ticket." },
      { timestamp: "2026-07-02T12:00:00Z", status: "Officer Assigned", remarks: "Sanitary Inspector Ramesh Kumar assigned to ward." },
      { timestamp: "2026-07-02T14:30:00Z", status: "Inspection Completed", remarks: "Team dispatched with clearance trucks." },
      { timestamp: "2026-07-02T17:00:00Z", status: "Resolved", remarks: "Garbage fully cleared. Disinfected the surroundings." }
    ],
    resolution: {
      summary: "Successfully cleared the illegal waste accumulation from the road margins using mechanical loader dispatches.",
      department: "Solid Waste Management Division",
      officerName: "Ramesh Kumar (Sanitary Inspector)",
      dateResolved: "2026-07-02",
      actions: "Dispatched 1 backhoe loader and 2 dumper trucks. Cleared approximately 1.5 tons of municipal trash and disinfected the area.",
      citizenRemarks: "Verified by resident. Clean pathway restored.",
      beforeImage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "rep-002",
    title: "Open Waste Burning",
    status: "Pending",
    category: "Air Pollution",
    severity: "High",
    locationName: "Sagar Cooperative Society, Bopal",
    latitude: 23.0338,
    longitude: 72.4633,
    date: "2026-07-01",
    municipality: "Ahmedabad Municipal Corporation (AMC)",
    timeline: [
      { timestamp: "2026-07-01T17:00:00Z", status: "Submitted", remarks: "Report successfully logged by citizen." },
      { timestamp: "2026-07-01T17:08:00Z", status: "AI Validation Completed", remarks: "Gemini Vision verified: Active smoke emissions from dry leaves pile." }
    ]
  },
  {
    id: "rep-003",
    title: "Industrial Smoke Emission",
    status: "Resolved",
    category: "Air Quality Control",
    severity: "High",
    locationName: "GIDC Industrial Area, Naroda",
    latitude: 23.0762,
    longitude: 72.6592,
    date: "2026-06-28",
    municipality: "GIDC Ward Office, Naroda",
    timeline: [
      { timestamp: "2026-06-28T08:15:00Z", status: "Submitted" },
      { timestamp: "2026-06-28T08:22:00Z", status: "AI Validation Completed", remarks: "High volume smoke detected. Classified: Factory stack chimney." },
      { timestamp: "2026-06-28T09:30:00Z", status: "Municipality Accepted", remarks: "Industrial safety panel notified." },
      { timestamp: "2026-06-28T11:00:00Z", status: "Officer Assigned", remarks: "Pollution Control inspector Devang Mehta dispatched." },
      { timestamp: "2026-06-28T13:00:00Z", status: "Inspection Completed", remarks: "Scrubber failure detected in Boiler-2. Work stop notice issued." },
      { timestamp: "2026-06-28T16:45:00Z", status: "Resolved", remarks: "Scrubber filters replaced and verified by inspector." }
    ],
    resolution: {
      summary: "Addressed boiler exhaust filter malfunction at facility plot #23. Scrubbers replaced.",
      department: "Gujarat Pollution Control Board",
      officerName: "Devang Mehta (Regional Safety Inspector)",
      dateResolved: "2026-06-28",
      actions: "Conducted site visit. Found faulty dust collector scrubber. Replaced filters and updated fine protocols.",
      beforeImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "rep-004",
    title: "Plastic Waste Accumulation",
    status: "Resolved",
    category: "Waste Management",
    severity: "Medium",
    locationName: "Vastrapur Lake Pathway, Ahmedabad",
    latitude: 23.0354,
    longitude: 72.5284,
    date: "2026-06-25",
    municipality: "AMC West Zone",
    timeline: [
      { timestamp: "2026-06-25T07:00:00Z", status: "Submitted" },
      { timestamp: "2026-06-25T07:12:00Z", status: "AI Validation Completed", remarks: "Detected scatter litter on walking margins." },
      { timestamp: "2026-06-25T09:00:00Z", status: "Municipality Accepted" },
      { timestamp: "2026-06-25T10:00:00Z", status: "Officer Assigned" },
      { timestamp: "2026-06-25T11:30:00Z", status: "Inspection Completed" },
      { timestamp: "2026-06-25T13:00:00Z", status: "Resolved", remarks: "Cleared bags and pathway disinfected." }
    ],
    resolution: {
      summary: "Manual clean-up of scattered plastic wrappers and bottles along Vastrapur Lake pathway.",
      department: "West Zone Sanitary Wing",
      officerName: "AMC West Maintenance Squad",
      dateResolved: "2026-06-25",
      actions: "Deployed 3 sanitation workers for sweeping and manual trash bag gathering.",
      beforeImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "rep-005",
    title: "Blocked Drainage Overflow",
    status: "Rejected",
    category: "Wastewater / Sewerage",
    severity: "High",
    locationName: "C.G. Road Crossings, Ahmedabad",
    latitude: 23.0274,
    longitude: 72.5599,
    date: "2026-06-22",
    municipality: "AMC Sewerage Board",
    timeline: [
      { timestamp: "2026-06-22T09:00:00Z", status: "Submitted" },
      { timestamp: "2026-06-22T09:15:00Z", status: "AI Validation Completed" },
      { timestamp: "2026-06-22T11:00:00Z", status: "Municipality Accepted" },
      { timestamp: "2026-06-22T13:00:00Z", status: "Inspection Completed", remarks: "Found private property leakage not under municipal mandate." },
      { timestamp: "2026-06-22T14:00:00Z", status: "Rejected", remarks: "Issues resides within private residential compound pipeline. Forwarded to owner." }
    ]
  }
];

export const mockDashboardData: DashboardData = {
  summary: [
    { label: "Total Reports", value: 18, change: "+2 this week", statusType: "neutral" },
    { label: "Active Reports", value: 5, change: "Pending review", statusType: "warning" },
    { label: "Resolved Reports", value: 12, change: "94% resolution rate", statusType: "success" },
    { label: "Nearby Hotspots", value: 3, change: "1.5km radius", statusType: "danger" }
  ],
  reports: mockDetailedReports,
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
