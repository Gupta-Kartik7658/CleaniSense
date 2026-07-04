# Frontend ↔ Backend Integration Plan

## Objective

The backend implementation is complete.

The goal is to replace all frontend mock data with real backend APIs **without changing the UI or UX**.

Do NOT redesign any pages.

Do NOT modify layouts.

Do NOT change styling.

Only integrate the existing frontend with the backend APIs.

---

# General Rules

Follow these rules strictly.

- Do not change any UI.
- Do not rename existing components.
- Keep all component hierarchy intact.
- Preserve loading skeletons.
- Preserve empty states.
- Preserve error states.
- Replace mock data only.
- Continue using the existing Axios client (`frontend/lib/api.ts`).
- Continue using AuthProvider.
- Continue using Firebase Authentication.

---

# Authentication

Already implemented.

Use the authenticated Firebase ID Token automatically through the Axios interceptor.

Never manually attach Authorization headers inside components.

---

# Dashboard Integration

Replace `frontend/mock/dashboard.ts`.

Replace `useDashboard()` mock implementation.

Use

GET

```
/api/v1/dashboard
```

The dashboard page should make **ONE API request only**.

The dashboard service already returns:

- overview statistics
- recent reports
- nearby hotspots
- notification summary
- user preferences

No additional API requests should be made from the dashboard.

---

## Dashboard Mapping

Dashboard Header

Uses:

Authenticated user from AuthProvider

---

Hero Action

"Report Issue"

↓

Navigate

```
/complaints
```

---

"My Reports"

↓

Navigate

```
/complaints/history
```

---

Dashboard Summary Cards

Populate from

```
dashboard.overview
```

Cards

- Total Reports

- Active Reports

- Resolved Reports

- Nearby Hotspots

---

Reports Section

Populate from

```
dashboard.recent_reports
```

Every report card should display

- title

- category

- location

- submitted date

- status

- severity

View Details

↓

Navigate

```
/complaints/history?id=<complaint_id>
```

---

Hotspot Section

Populate

```
dashboard.nearby_hotspots
```

Display

- hotspot title

- distance

- severity

- locality

---

Notification Badge

Populate

```
dashboard.notification_summary.unread_count
```

Do NOT fetch notifications separately.

Only display the unread badge.

---

# Notification Panel

When user clicks Bell Icon

Call

```
GET

/api/v1/notifications
```

Populate

- unread

- read

- notification title

- message

- timestamp

- status

- deep link

Support

Mark Read

↓

PUT

```
/api/v1/notifications/{id}/read
```

Mark All Read

↓

PUT

```
/api/v1/notifications/read-all
```

Notification click

↓

Navigate

```
/complaints/history?id=<complaint_id>
```

---

# Profile

Avatar dropdown

Continue using AuthProvider user

Account Settings

↓

GET

```
/api/v1/profile
```

Save

↓

PUT

```
/api/v1/profile
```

---

Language

GET

```
/api/v1/profile/preferences
```

Update

↓

PUT

```
/api/v1/profile/preferences
```

Persist

- language

- theme

- notifications enabled

Update TranslationProvider immediately after success.

---

# Complaint History

Page

```
/complaints/history
```

Replace mock data.

GET

```
/api/v1/complaints
```

Support

- pagination

- filters

- search

- status

- category

Populate

- complaint cards

- counts

- empty state

---

Complaint Details

Open

```
GET

/api/v1/complaints/{id}
```

Populate

- complaint information

- timeline

- attachments

If complaint resolved

Also call

```
GET

/api/v1/complaints/{id}/resolution
```

Populate

Government Report

Officer

Department

Resolution Notes

Before Image

After Image

Completion Date

---

# Complaint Submission

Page

```
/complaints
```

On load

Call

```
GET

/api/v1/dashboard/config
```

Populate

Categories

Allowed attachment types

Limits

Use

POST

```
/api/v1/complaints
```

Create complaint

If user uploads files

Use

POST

```
/api/v1/complaints/{id}/attachments
```

Display

Upload progress

Validation errors

Success state

Redirect

↓

```
/complaints/history?id=<id>
```

---

# Hotspots

Page

```
/hotspots
```

Call

```
GET

/api/v1/hotspots
```

Populate

- cards

- list

- map markers

Click hotspot

↓

GET

```
/api/v1/hotspots/{id}
```

Display

- details

- nearby complaints

- severity

- location

---

# Error Handling

Every request must support

Loading

Error

Empty

Success

Never crash UI.

Show reusable error component.

---

# API Client

Continue using

```
frontend/lib/api.ts
```

Never call fetch directly.

Never duplicate Axios instances.

---

# Hooks

Move all API logic into hooks.

Examples

```
useDashboard()

useComplaints()

useNotifications()

useProfile()

useHotspots()
```

Pages should never contain API calls.

Pages should only compose components.

---

# Types

Replace mock interfaces.

Create proper API response types.

Use backend schemas.

No use of `any`.

---

# Response Envelope

Every API response follows

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

The frontend must unwrap

```
response.data.data
```

centrally inside the API layer.

UI components should never access

```
response.success
```

or

```
response.message
```

---

# Deliverables

Update the implementation plan showing:

- Every page integrated
- Every API endpoint used
- Which hook calls which endpoint
- Which component consumes which hook
- Files modified
- New hooks created
- New types created
- Verification plan

Do NOT generate implementation code.

Generate only the detailed integration plan.
