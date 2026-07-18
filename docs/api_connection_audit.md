# CleaniSense — API Connectivity Audit Report

This report maps the frontend Next.js services (`frontend/services/`) to the backend FastAPI routers (`backend/app/api/v1/routers/`) and documents their connectivity status.

---

## 1. Authentication Services (`auth.ts`)
Exposes user session, registration, and logout operations.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `authService.loginWithFirebase` | `POST /auth/login` | `routers/auth.py` | `POST /api/v1/auth/login` | **CONNECTED** |
| `authService.getCurrentUser` | `GET /auth/me` | `routers/auth.py` | `GET /api/v1/auth/me` | **CONNECTED** |
| `authService.logout` | `POST /auth/logout` | `routers/auth.py` | `POST /api/v1/auth/logout` | **CONNECTED** |

Password reset is handled directly by Firebase on the frontend route `/forgot-password` using `sendPasswordResetEmail`; no backend route is required.

---

## 2. Profile & Preferences (`profile.ts`)
Manages logged-in citizen information, avatars, locales, and themes.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `profileService.getProfile` | `GET /profile` | `routers/profile.py` | `GET /api/v1/profile` | **CONNECTED** |
| `profileService.updateProfile` | `PUT /profile` | `routers/profile.py` | `PUT /api/v1/profile` | **CONNECTED** |
| `profileService.getPreferences` | `GET /profile/preferences` | `routers/profile.py` | `GET /api/v1/profile/preferences` | **CONNECTED** |
| `profileService.updatePreferences` | `PUT /profile/preferences` | `routers/profile.py` | `PUT /api/v1/profile/preferences` | **CONNECTED** |

---

## 3. General Dashboard (`dashboard.ts`)
Serves as the main statistics feed.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `dashboardService.getDashboard` | `GET /dashboard` | `routers/dashboard.py` | `GET /api/v1/dashboard` | **CONNECTED** |

- *Note*: In our V6.0 MVP backend refactoring, `GET /api/v1/dashboard` now dynamically branches to return the lightweight municipal overview summary for staff users, and citizen summaries for citizen users.

---

## 4. Complaint Management (`complaint.ts`)
Handles the citizen complaints database, attachments, and resolution documents.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `complaintService.getComplaints` | `GET /complaints` | `routers/complaints.py` | `GET /api/v1/complaints` | **CONNECTED** |
| `complaintService.getComplaintDetail` | `GET /complaints/{id}` | `routers/complaints.py` | `GET /api/v1/complaints/{id}` | **CONNECTED** |
| `complaintService.getComplaintResolution` | `GET /complaints/{id}/resolution` | `routers/complaints.py` | `GET /api/v1/complaints/{id}/resolution` | **CONNECTED** |
| `complaintService.createComplaint` | `POST /complaints` | `routers/complaints.py` | `POST /api/v1/complaints` | **CONNECTED** |
| `complaintService.uploadAttachment` | `POST /complaints/{id}/attachments` | `routers/complaints.py` | `POST /api/v1/complaints/{id}/attachments` | **CONNECTED** |
| `complaintService.updateComplaint` | `PUT /complaints/{id}` | `routers/complaints.py` | `PUT /api/v1/complaints/{id}` | **CONNECTED** |
| `complaintService.deleteComplaint` | `DELETE /complaints/{id}` | `routers/complaints.py` | `DELETE /api/v1/complaints/{id}` | **CONNECTED** |

- *Note*: In our latest implementation, complaint create/update payloads include survey fields (`area_affected_sqm`, `population_affected`, `duration_hours`, `survey_data`). Attachments trigger Gemini-gated hybrid image analysis, weather enrichment, severity recalculation, and hotspot refresh. OpenCV remains as corroborating visual evidence after Gemini validation.

---

## 5. Hotspot Boundaries (`hotspot.ts`)
Locates proximity-based pollution/waste hotspots.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `hotspotService.getHotspots` | `GET /hotspots` | `routers/hotspots.py` | `GET /api/v1/hotspots` | **CONNECTED** |
| `hotspotService.getHotspotDetail` | `GET /hotspots/{id}` | `routers/hotspots.py` | `GET /api/v1/hotspots/{id}` | **CONNECTED** |
| Admin/API direct | `POST /hotspots/refresh` | `routers/hotspots.py` | `POST /api/v1/hotspots/refresh` | **CONNECTED** |

---

## 5.1 Weather & Air Quality (`weather.py`)
Adds Open-Meteo weather/AQI connectivity.

| Frontend/API Consumer | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| API direct | `GET /weather/current` | `routers/weather.py` | `GET /api/v1/weather/current` | **CONNECTED** |
| API direct | `GET /weather/complaints/{id}` | `routers/weather.py` | `GET /api/v1/weather/complaints/{id}` | **CONNECTED** |
| Admin/API direct | `POST /weather/complaints/{id}/refresh` | `routers/weather.py` | `POST /api/v1/weather/complaints/{id}/refresh` | **CONNECTED** |

---

## 6. Real-time Notifications (`notification.ts`)
Feeds notifications and reads inbox messages.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `notificationService.getNotifications` | `GET /notifications` | `routers/notifications.py` | `GET /api/v1/notifications` | **CONNECTED** |
| `notificationService.markNotificationRead` | `PUT /notifications/{id}/read` | `routers/notifications.py` | `PUT /api/v1/notifications/{id}/read` | **CONNECTED** |
| `notificationService.markAllNotificationsRead` | `PUT /notifications/read-all` | `routers/notifications.py` | `PUT /api/v1/notifications/read-all` | **CONNECTED** |

---

## 7. Static Configuration (`config.ts`)
Injects lookup tables, localizations, and feature flags.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `configService.getConfig` | `GET /config` | `routers/config.py` | `GET /api/v1/config` | **CONNECTED** |

---

## 8. Pollution & Admin Portal Services (`pollutionService.ts`)
Exposes stats, settings, user listings, and maps inside `frontend/app/admin/`.

| Frontend Service Method | Axios Request Method & Path | Backend Router File | Backend Target Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PollutionService.getDashboardStats` | `GET /admin/stats` | `routers/admin.py` | `GET /api/v1/admin/stats` | **CONNECTED** |
| `PollutionService.getIncidents` | `GET /admin/incidents` | `routers/admin.py` | `GET /api/v1/admin/incidents` | **CONNECTED** |
| `PollutionService.getIncidentById` | `GET /admin/incidents/{id}` | `routers/admin.py` | `GET /api/v1/admin/incidents/{id}` | **CONNECTED** |
| `PollutionService.updateIncidentStatus` | `PATCH /admin/incidents/{id}/status`| `routers/admin.py` | `PATCH /api/v1/admin/incidents/{id}/status`| **CONNECTED** |
| `PollutionService.assignIncident` | `POST /admin/incidents/{id}/assign` | `routers/admin.py` | `POST /api/v1/admin/incidents/{id}/assign` | **CONNECTED** |
| `PollutionService.getAQIPredictions` | `GET /admin/predictions/aqi` | `routers/admin.py` | `GET /api/v1/admin/predictions/aqi` | **CONNECTED** |
| `PollutionService.getAQIHeatmap` | `GET /admin/predictions/heatmap` | `routers/admin.py` | `GET /api/v1/admin/predictions/heatmap` | **CONNECTED** |
| `PollutionService.getHotspotClusters` | `GET /admin/hotspots` | `routers/admin.py` | `GET /api/v1/admin/hotspots` | **CONNECTED** |
| `PollutionService.getUsers` | `GET /admin/users` | `routers/admin.py` | `GET /api/v1/admin/users` | **CONNECTED** |
| `PollutionService.updateUserStatus` | `PATCH /admin/users/{id}/status`| `routers/admin.py` | `PATCH /api/v1/admin/users/{id}/status`| **CONNECTED** |
| `PollutionService.updateUserRoleByEmail` | `PATCH /admin/users/role` | `routers/admin.py` | `PATCH /api/v1/admin/users/role` | **CONNECTED** |
| `PollutionService.getMediaByIncident` | `GET /admin/incidents/{id}/media` | `routers/admin.py` | `GET /api/v1/admin/incidents/{id}/media` | **CONNECTED** |
| `PollutionService.getAnalytics` | `GET /admin/analytics` | `routers/admin.py` | `GET /api/v1/admin/analytics` | **CONNECTED** |
| `PollutionService.getSettings` | `GET /admin/settings` | `routers/admin.py` | `GET /api/v1/admin/settings` | **CONNECTED** |
| `PollutionService.saveSettings` | `POST /admin/settings` | `routers/admin.py` | `POST /api/v1/admin/settings` | **CONNECTED** |
| `PollutionService.clearCache` | `POST /admin/settings/clear-cache` | `routers/admin.py` | `POST /api/v1/admin/settings/clear-cache`| **CONNECTED** |
| `PollutionService.triggerDatabaseBackup` | `GET /admin/settings/backup` | `routers/admin.py` | `GET /api/v1/admin/settings/backup` | **CONNECTED** |

- *Audit Findings*: The `/admin` prefix routes mapped in `PollutionService.ts` were defined in `backend/app/api/v1/routers/admin.py`, but `admin.router` was not registered inside the main backend API router. This caused admin page API requests to fail with a `404 Not Found` error.
- *Fix Action*: We registered the `admin.router` inside `backend/app/api/v1/__init__.py`. All admin routes are now fully **CONNECTED** and tested functional!
