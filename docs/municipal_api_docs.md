# CleaniSense — Municipal Dashboard API Integration Guide

This document provides a comprehensive integration guide for frontend developers building the **Municipal Dashboard** portal for CleaniSense. 

---

## 2026-07-08 Module Update

Municipal dashboards now consume generated severity and hotspot data:

- Complaint responses expose `severity_score`, `image_severity_score`, `ai_confidence_score`, `survey_score`, `weather_score`, `density_score`, and `severity_breakdown`.
- Complaint severity is Gemini-gated: survey/weather/density values are visible for audit, but final severity remains `0` until Gemini verifies image evidence. OpenCV is used as corroborating visual evidence after Gemini validation.
- Hotspots are generated from unresolved complaint clusters and persisted in the `hotspots` table.
- `POST /api/v1/hotspots/refresh` rebuilds clusters with configurable `radius_meters` and `min_complaints`.
- Critical hotspots create deduplicated `CRITICAL_HOTSPOT` notifications for municipality staff and superadmins.
- Weather observations can be retrieved or refreshed through `/api/v1/weather/complaints/{complaint_id}`.
- Prediction endpoints remain demo/stub data and are intentionally deferred.

---

## 1. Authentication & Tenant Context

All municipal endpoints require Firebase authentication headers. The backend parses the token claims, identifies the user's role (`municipality_officer` or `municipality_admin`), and scopes database queries automatically to the user's tenant municipality (`municipality_id`).

### Required HTTP Headers
```http
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json
```

---

## 2. API Endpoints Reference

### 2.1 Lightweight Dashboard Overview
#### `GET /api/v1/dashboard`
- **Description**: Retrieves a lightweight summary overview of counts and recent complaints specifically scoped to the officer's municipality.
- **Access Role**: `municipality_officer`, `municipality_admin`
- **Response Example (`200 OK`)**:
```json
{
  "success": true,
  "message": "Dashboard overview data retrieved successfully",
  "data": {
    "overview": {
      "total_reports": 142,
      "active_reports": 58,
      "resolved_reports": 64,
      "pending_reports": 20
    },
    "recent_complaints": [
      {
        "id": "789e5653-ba0e-468a-98ed-9ca73dee6984",
        "user_id": "0c0e9359-ef4c-497c-990c-4ba3d70f626c",
        "category_id": "3c4d7e82-e304-4537-8853-2947a5be23c1",
        "municipality_id": "1aaae69a-98b2-4d1c-bc14-497ac45e7b85",
        "title": "Garbage accumulated near public park",
        "description": "Large heap of waste lying around since 3 days.",
        "status": "ai_validation_completed",
        "severity": "medium",
        "location_name": "Nehru Park Outer Circle Gate 2",
        "latitude": 23.0284,
        "longitude": 72.5068,
        "assigned_department": null,
        "assigned_officer": null,
        "created_at": "2026-07-07T12:00:00Z",
        "updated_at": "2026-07-07T12:05:00Z"
      }
    ],
    "recent_activity": [
      {
        "id": "f25c1a66-76cc-4355-b2d9-9a833934434e",
        "complaint_id": "789e5653-ba0e-468a-98ed-9ca73dee6984",
        "status": "ai_validation_completed",
        "remarks": "AI auto-validation passed.",
        "changed_by": null,
        "created_at": "2026-07-07T12:05:00Z"
      }
    ]
  }
}
```

---

### 2.2 List & Filter Complaints
#### `GET /api/v1/complaints`
- **Description**: Lists paginated complaints belonging to the staff's municipality.
- **Query Parameters**:
  - `status`: `string` (e.g. `submitted`, `officer_assigned`, `resolved`) (optional)
  - `category_id`: `uuid` (optional)
  - `search`: `string` (optional)
  - `page`: `int` (default `1`)
  - `page_size`: `int` (default `20`)
- **Response Example (`200 OK`)**:
```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": {
    "items": [
      {
        "id": "789e5653-ba0e-468a-98ed-9ca73dee6984",
        "user_id": "0c0e9359-ef4c-497c-990c-4ba3d70f626c",
        "category_id": "3c4d7e82-e304-4537-8853-2947a5be23c1",
        "title": "Garbage accumulated near public park",
        "status": "officer_assigned",
        "severity": "high",
        "location_name": "Nehru Park Gate 2",
        "latitude": 23.0284,
        "longitude": 72.5068,
        "assigned_department": "Sanitation Board",
        "assigned_officer": "Officer Rajesh",
        "created_at": "2026-07-07T12:00:00Z",
        "updated_at": "2026-07-07T13:45:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "pages": 1
  }
}
```

---

### 2.3 Consolidated Complaint Actions (PUT)
#### `PUT /api/v1/complaints/{id}`
- **Description**: Standardized endpoint to process all status updates, officer assignments, severity ratings, and final resolution reports.
- **Access Role**: `municipality_officer`, `municipality_admin`

#### Workflow Transition Payload Examples:

##### A. Accept submitted complaint
Shifts status to `municipality_accepted`:
```json
{
  "status": "municipality_accepted",
  "remarks": "Remediation planning initiated."
}
```

##### B. Reject complaint
Shifts status to `rejected` with comments:
```json
{
  "status": "rejected",
  "remarks": "Duplicate complaint registered under #12948."
}
```

##### C. Assign department and officer
Shifts status to `officer_assigned` and updates assignment columns:
```json
{
  "status": "officer_assigned",
  "severity": "high",
  "assigned_department": "Waste Management Division",
  "assigned_officer": "Inspector Vikram Singh",
  "remarks": "Assigned to Vikram for site cleaning."
}
```

##### D. Mark inspection in progress
Shifts status to `in_progress` when team arrives on-site:
```json
{
  "status": "in_progress",
  "remarks": "Cleaning crew dispatched to site."
}
```

##### E. Resolve complaint (requires resolution report details)
Shifts status to `resolved` and saves resolution evidence:
```json
{
  "status": "resolved",
  "remarks": "Waste cleared completely.",
  "resolution": {
    "summary": "Garbage pile cleared and area sanitized.",
    "department": "Waste Management Division",
    "officer_name": "Inspector Vikram Singh",
    "actions": "Deployed 1 loader truck to collect accumulated plastic waste. Spray disinfected the area.",
    "before_image_url": "https://supabase.com/storage/v1/before.jpg",
    "after_image_url": "https://supabase.com/storage/v1/after.jpg"
  }
}
```

- **Response Example (`200 OK`)**: Returns updated `ComplaintResponse` DTO.

---

### 2.4 Standalone Analytics Distributions
#### `GET /api/v1/analytics`
- **Description**: Returns status, category, and priority distributions structured as chart-ready lists.
- **Access Role**: `municipality_officer`, `municipality_admin`
- **Response Example (`200 OK`)**:
```json
{
  "success": true,
  "message": "Analytics metrics retrieved successfully",
  "data": {
    "status_distribution": [
      { "label": "ai_validation_completed", "count": 20 },
      { "label": "municipality_accepted", "count": 15 },
      { "label": "officer_assigned", "count": 30 },
      { "label": "in_progress", "count": 10 },
      { "label": "resolved", "count": 64 },
      { "label": "rejected", "count": 3 }
    ],
    "category_distribution": [
      { "label": "Waste Management", "count": 82 },
      { "label": "Air Pollution", "count": 35 },
      { "label": "Wastewater / Sewerage", "count": 25 }
    ],
    "severity_distribution": [
      { "label": "high", "count": 45 },
      { "label": "medium", "count": 60 },
      { "label": "low", "count": 22 },
      { "label": "Unassigned", "count": 15 }
    ]
  }
}
```

---

### 2.5 Active Hotspots & Map Clusters
#### `GET /api/v1/map`
- **Description**: Retrieves single points and clustered hotspots (distance-radius ≤ 50m) representing active complaints inside the municipality bounds.
- **Access Role**: `municipality_officer`, `municipality_admin`
- **Response Example (`200 OK`)**:
```json
{
  "success": true,
  "message": "Map cluster coordinates retrieved successfully",
  "data": {
    "singles": [
      {
        "id": "789e5653-ba0e-468a-98ed-9ca73dee6984",
        "title": "Illegal landfill pile",
        "status": "in_progress",
        "latitude": 23.0284,
        "longitude": 72.5068,
        "location_name": "Nehru Park Outer Circle Gate 2",
        "category_name": "Waste Management"
      }
    ],
    "hotspots": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "latitude": 23.0305,
        "longitude": 72.5074,
        "count": 4,
        "radius_meters": 50.0,
        "complaint_ids": [
          "789e5653-ba0e-468a-98ed-9ca73dee6984",
          "3a969ce4-d91c-4297-bcee-1eee4332dae5"
        ],
        "complaints": [
          {
            "id": "789e5653-ba0e-468a-98ed-9ca73dee6984",
            "title": "Garbage near Gate 2",
            "status": "officer_assigned",
            "latitude": 23.0284,
            "longitude": 72.5068,
            "location_name": "Nehru Park Gate 2",
            "category_name": "Waste Management"
          }
        ]
      }
    ],
    "total_complaints": 5,
    "hotspot_radius_meters": 50.0
  }
}
```

#### Persisted Hotspots
Use `GET /api/v1/hotspots` for persisted active hotspots. These include:

```json
{
  "id": "uuid",
  "title": "Air Pollution hotspot (4 reports)",
  "latitude": 23.0305,
  "longitude": 72.5074,
  "severity": "critical",
  "severity_score": 82.5,
  "radius_meters": 500,
  "reports_count": 4,
  "complaint_ids": "[\"uuid\", \"uuid\"]",
  "dominant_category": "Air Pollution",
  "trend": "increasing",
  "is_active": true
}
```

Admins can force a rebuild:

```http
POST /api/v1/hotspots/refresh?radius_meters=500&min_complaints=2
```
